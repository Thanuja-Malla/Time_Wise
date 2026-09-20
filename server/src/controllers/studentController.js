const Student = require('../models/Student');
const LateEntry = require('../models/LateEntry');
const Department = require('../models/Department');

// Helper to get today's date in YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get all students with search & filters
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res, next) => {
  try {
    const { search, department, year, status, page = 1, limit = 20, sort = 'name' } = req.query;

    const query = {};

    if (department) query.department = department;
    if (year) query.year = Number(year);
    if (status) query.status = status;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { rollNumber: searchRegex },
        { studentId: searchRegex },
        { barcode: searchRegex },
        { email: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { name: 1 };
    if (sort === '-createdAt') sortOption = { createdAt: -1 };
    if (sort === 'rollNumber') sortOption = { rollNumber: 1 };

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('department', 'name code')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      count: students.length,
      students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student by ID with history & stats
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('department', 'name code');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Fetch late entry count and recent entries
    const lateEntriesCount = await LateEntry.countDocuments({ student: student._id });
    const recentLateEntries = await LateEntry.find({ student: student._id })
      .populate('recordedBy', 'name role')
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      student,
      stats: {
        totalLateEntries: lateEntriesCount
      },
      recentLateEntries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student by registration number or barcode & check today's late status
// @route   GET /api/students/barcode/:barcode or /api/students/regno/:regno
// @access  Private (Staff & Admin)
const getStudentByBarcode = async (req, res, next) => {
  try {
    const identifier = (req.params.barcode || req.params.regno || '').trim().toUpperCase();

    const student = await Student.findOne({
      $or: [
        { barcode: identifier },
        { studentId: identifier },
        { rollNumber: identifier }
      ]
    }).populate('department', 'name code');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found matching registration number or barcode: ${identifier}`
      });
    }

    if (student.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Student account is currently inactive (${student.name} - ${student.rollNumber})`
      });
    }

    const today = getTodayDateString();

    // Check if student has already been marked late today
    const todayLateEntries = await LateEntry.find({
      student: student._id,
      date: today
    }).populate('recordedBy', 'name');

    const alreadyMarkedToday = todayLateEntries.length > 0;

    // Total historical late entries
    const totalLateCount = await LateEntry.countDocuments({ student: student._id });

    res.status(200).json({
      success: true,
      student,
      historySummary: {
        totalLateCount
      },
      todayLateStatus: {
        alreadyMarked: alreadyMarkedToday,
        countToday: todayLateEntries.length,
        entries: todayLateEntries
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res, next) => {
  try {
    const {
      studentId,
      barcode,
      name,
      rollNumber,
      department,
      year,
      section,
      email,
      phone,
      guardianPhone,
      status
    } = req.body;

    // Validate barcode uniqueness
    const barcodeExists = await Student.findOne({ barcode: barcode.toUpperCase().trim() });
    if (barcodeExists) {
      return res.status(400).json({
        success: false,
        message: `Barcode '${barcode}' is already assigned to student ${barcodeExists.name} (${barcodeExists.rollNumber})`
      });
    }

    // Validate roll number uniqueness
    const rollExists = await Student.findOne({ rollNumber: rollNumber.toUpperCase().trim() });
    if (rollExists) {
      return res.status(400).json({
        success: false,
        message: `Roll number '${rollNumber}' is already registered`
      });
    }

    // Validate student ID uniqueness
    const idExists = await Student.findOne({ studentId: studentId.toUpperCase().trim() });
    if (idExists) {
      return res.status(400).json({
        success: false,
        message: `Student ID '${studentId}' is already registered`
      });
    }

    // Validate department exists
    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(400).json({
        success: false,
        message: 'Selected department does not exist'
      });
    }

    const student = await Student.create({
      studentId: studentId.toUpperCase().trim(),
      barcode: barcode.toUpperCase().trim(),
      name: name.trim(),
      rollNumber: rollNumber.toUpperCase().trim(),
      department,
      year: Number(year),
      section: section ? section.trim().toUpperCase() : 'A',
      email: email ? email.toLowerCase().trim() : '',
      phone: phone ? phone.trim() : '',
      guardianPhone: guardianPhone ? guardianPhone.trim() : '',
      status: status || 'active'
    });

    const populatedStudent = await Student.findById(student._id).populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      student: populatedStudent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res, next) => {
  try {
    const {
      studentId,
      barcode,
      name,
      rollNumber,
      department,
      year,
      section,
      email,
      phone,
      guardianPhone,
      status
    } = req.body;

    let student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Uniqueness checks
    if (barcode && barcode.toUpperCase() !== student.barcode) {
      const barcodeExists = await Student.findOne({ barcode: barcode.toUpperCase().trim() });
      if (barcodeExists) {
        return res.status(400).json({
          success: false,
          message: `Barcode '${barcode}' is already in use by another student`
        });
      }
      student.barcode = barcode.toUpperCase().trim();
    }

    if (rollNumber && rollNumber.toUpperCase() !== student.rollNumber) {
      const rollExists = await Student.findOne({ rollNumber: rollNumber.toUpperCase().trim() });
      if (rollExists) {
        return res.status(400).json({
          success: false,
          message: `Roll number '${rollNumber}' is already in use`
        });
      }
      student.rollNumber = rollNumber.toUpperCase().trim();
    }

    if (studentId && studentId.toUpperCase() !== student.studentId) {
      const idExists = await Student.findOne({ studentId: studentId.toUpperCase().trim() });
      if (idExists) {
        return res.status(400).json({
          success: false,
          message: `Student ID '${studentId}' is already in use`
        });
      }
      student.studentId = studentId.toUpperCase().trim();
    }

    if (name) student.name = name.trim();
    if (department) student.department = department;
    if (year) student.year = Number(year);
    if (section) student.section = section.trim().toUpperCase();
    if (email !== undefined) student.email = email.toLowerCase().trim();
    if (phone !== undefined) student.phone = phone.trim();
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone.trim();
    if (status) student.status = status;

    await student.save();

    const updatedStudent = await Student.findById(student._id).populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Also delete associated late entries or keep them?
    await LateEntry.deleteMany({ student: student._id });
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student and related late-entry records removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getStudentByBarcode,
  createStudent,
  updateStudent,
  deleteStudent
};
