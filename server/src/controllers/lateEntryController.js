const LateEntry = require('../models/LateEntry');
const Student = require('../models/Student');
const { appendLateEntryToExcel } = require('../services/excelService');

// Helper to get formatted server-side date and time strings
const getServerDateTime = () => {
  const now = new Date();

  // Localized date formatting YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Localized 24h time formatting HH:mm:ss
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  return { dateStr, timeStr, timestamp: now };
};

// @desc    Record a new student late entry (Server-Authoritative)
// @route   POST /api/late-entries
// @access  Private (Staff & Admin)
const createLateEntry = async (req, res, next) => {
  try {
    const { barcode, studentId, reason, remarks } = req.body;
    const session = 'morning';

    if (!barcode && !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student barcode or ID is required'
      });
    }

    // Lookup student by Mongo ID, Registration Number / Student ID, or Barcode
    let student;
    if (studentId) {
      if (typeof studentId === 'string' && studentId.match(/^[0-9a-fA-F]{24}$/)) {
        student = await Student.findById(studentId);
      }
      if (!student) {
        student = await Student.findOne({
          $or: [
            { studentId: String(studentId).toUpperCase().trim() },
            { rollNumber: String(studentId).toUpperCase().trim() },
            { barcode: String(studentId).toUpperCase().trim() }
          ]
        });
      }
    } else if (barcode) {
      student = await Student.findOne({
        $or: [
          { barcode: barcode.toUpperCase().trim() },
          { studentId: barcode.toUpperCase().trim() },
          { rollNumber: barcode.toUpperCase().trim() }
        ]
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found in system'
      });
    }

    if (student.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Student account is inactive (${student.name})`
      });
    }

    // Authoritative Server-side Timestamping
    const { dateStr, timeStr, timestamp } = getServerDateTime();

    // Prevent duplicate entry on same date (Morning Session)
    const existingEntry = await LateEntry.findOne({
      student: student._id,
      date: dateStr,
      session: 'morning'
    }).populate('recordedBy', 'name');

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: `Late entry already recorded for ${student.name} today at ${existingEntry.time}`,
        existingEntry: {
          _id: existingEntry._id,
          time: existingEntry.time,
          recordedBy: existingEntry.recordedBy?.name,
          reason: existingEntry.reason
        }
      });
    }

    // Create the late entry
    const lateEntry = await LateEntry.create({
      student: student._id,
      barcode: student.barcode,
      date: dateStr,
      time: timeStr,
      timestamp,
      department: student.department,
      recordedBy: req.user._id,
      reason: reason || 'Traffic Congestion',
      remarks: remarks ? remarks.trim() : '',
      session: 'morning'
    });

    const populatedEntry = await LateEntry.findById(lateEntry._id)
      .populate('student', 'studentId barcode name rollNumber year section email phone')
      .populate('department', 'name code')
      .populate('recordedBy', 'name role email');

    // Count today's total late entries for immediate feedback
    const totalTodayCount = await LateEntry.countDocuments({ date: dateStr });

    // Automatically append record to the corresponding sheet inside TimeWise_Late_Entries.xlsx
    const branchName = populatedEntry.department?.name || populatedEntry.department?.code || 'General';
    const rollNum = student.rollNumber || student.studentId || student.barcode;
    try {
      await appendLateEntryToExcel({
        rollNumber: rollNum,
        name: student.name,
        branch: branchName,
        date: dateStr,
        time: timeStr,
        year: student.year
      });
    } catch (excelErr) {
      console.error('[lateEntryController] Excel tracking error:', excelErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Late entry recorded successfully for ${student.name}`,
      lateEntry: populatedEntry,
      summary: {
        totalTodayCount,
        studentLateCount: await LateEntry.countDocuments({ student: student._id })
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all late entries with filtering & pagination
// @route   GET /api/late-entries
// @access  Private
const getLateEntries = async (req, res, next) => {
  try {
    const {
      search,
      department,
      startDate,
      endDate,
      session,
      reason,
      page = 1,
      limit = 25,
      sort = '-timestamp'
    } = req.query;

    const query = {};

    if (department) query.department = department;
    if (session) query.session = session;
    if (reason) query.reason = reason;

    // Date range filter
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // Search by student name, rollNumber, or barcode
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingStudents = await Student.find({
        $or: [
          { name: searchRegex },
          { rollNumber: searchRegex },
          { studentId: searchRegex },
          { barcode: searchRegex }
        ]
      }).select('_id');

      const studentIds = matchingStudents.map((s) => s._id);

      query.$or = [
        { student: { $in: studentIds } },
        { barcode: searchRegex },
        { remarks: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    const total = await LateEntry.countDocuments(query);
    const lateEntries = await LateEntry.find(query)
      .populate('student', 'studentId barcode name rollNumber year section')
      .populate('department', 'name code')
      .populate('recordedBy', 'name role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      count: lateEntries.length,
      lateEntries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single late entry
// @route   GET /api/late-entries/:id
// @access  Private
const getLateEntryById = async (req, res, next) => {
  try {
    const lateEntry = await LateEntry.findById(req.params.id)
      .populate('student', 'studentId barcode name rollNumber year section email phone guardianPhone')
      .populate('department', 'name code description')
      .populate('recordedBy', 'name email role');

    if (!lateEntry) {
      return res.status(404).json({ success: false, message: 'Late entry record not found' });
    }

    res.status(200).json({ success: true, lateEntry });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all late entries for a student
// @route   GET /api/late-entries/student/:studentId
// @access  Private
const getStudentLateHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const entries = await LateEntry.find({ student: studentId })
      .populate('department', 'name code')
      .populate('recordedBy', 'name role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: entries.length,
      lateEntries: entries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a late entry record
// @route   DELETE /api/late-entries/:id
// @access  Private/Admin
const deleteLateEntry = async (req, res, next) => {
  try {
    const lateEntry = await LateEntry.findByIdAndDelete(req.params.id);
    if (!lateEntry) {
      return res.status(404).json({ success: false, message: 'Late entry not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Late entry record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLateEntry,
  getLateEntries,
  getLateEntryById,
  getStudentLateHistory,
  deleteLateEntry
};
