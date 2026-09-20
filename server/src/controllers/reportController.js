const LateEntry = require('../models/LateEntry');
const Student = require('../models/Student');
const Department = require('../models/Department');

// @desc    Get filtered report data formatted for PDF/Excel generation
// @route   GET /api/reports/export-data
// @access  Private
const getReportData = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      department,
      year,
      studentId,
      session,
      reason
    } = req.query;

    const query = {};

    if (department) query.department = department;
    if (session) query.session = session;
    if (reason) query.reason = reason;

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    if (studentId) {
      query.student = studentId;
    } else if (year) {
      const yearStudents = await Student.find({ year: Number(year) }).select('_id');
      query.student = { $in: yearStudents.map((s) => s._id) };
    }

    const lateEntries = await LateEntry.find(query)
      .populate('student', 'name rollNumber studentId year section phone email')
      .populate('department', 'name code')
      .populate('recordedBy', 'name role')
      .sort({ timestamp: -1 });

    // Calculate metadata & summary statistics
    const uniqueStudents = new Set(lateEntries.map((e) => e.student?._id?.toString()).filter(Boolean));

    // Department breakdown within this report
    const deptCount = {};
    lateEntries.forEach((e) => {
      const deptName = e.department?.name || 'Unknown';
      deptCount[deptName] = (deptCount[deptName] || 0) + 1;
    });

    let selectedDeptName = 'All Departments';
    if (department) {
      const deptObj = await Department.findById(department);
      if (deptObj) selectedDeptName = deptObj.name;
    }

    const reportMetadata = {
      institutionName: process.env.COLLEGE_NAME || 'Anil Neerukonda Institute of Technology & Sciences',
      reportTitle: 'Student Late Entry Punctuality & Attendance Audit Report',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name,
      filters: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Present',
        department: selectedDeptName,
        year: year ? `Year ${year}` : 'All Years',
        session: session ? session.toUpperCase() : 'ALL SESSIONS'
      },
      summary: {
        totalLateEntries: lateEntries.length,
        uniqueStudentsCount: uniqueStudents.size,
        departmentBreakdown: deptCount
      }
    };

    // Flatten data for table/export
    const rows = lateEntries.map((e, idx) => ({
      slNo: idx + 1,
      studentName: e.student?.name || 'N/A',
      rollNumber: e.student?.rollNumber || 'N/A',
      studentId: e.student?.studentId || 'N/A',
      department: e.department?.code || 'N/A',
      departmentFull: e.department?.name || 'N/A',
      year: e.student?.year ? `Year ${e.student.year}` : 'N/A',
      section: e.student?.section || 'A',
      date: e.date,
      time: e.time,
      session: (e.session || 'morning').toUpperCase(),
      reason: e.reason || 'N/A',
      remarks: e.remarks || '',
      recordedBy: e.recordedBy?.name || 'N/A'
    }));

    res.status(200).json({
      success: true,
      metadata: reportMetadata,
      count: rows.length,
      rows
    });
  } catch (error) {
    next(error);
  }
};

const fs = require('fs');
const { getUnifiedExcelPath, UNIFIED_EXCEL_FILENAME, initUnifiedExcelFile } = require('../services/excelService');

// @desc    Download single TimeWise_Late_Entries.xlsx containing 3 year-wise sheets
// @route   GET /api/reports/download-excel
// @access  Private
const downloadUnifiedExcel = (req, res, next) => {
  try {
    initUnifiedExcelFile();
    const filePath = getUnifiedExcelPath();

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'TimeWise_Late_Entries.xlsx file not found.'
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${UNIFIED_EXCEL_FILENAME}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportData,
  downloadUnifiedExcel
};
