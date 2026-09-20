const LateEntry = require('../models/LateEntry');
const Student = require('../models/Student');
const Department = require('../models/Department');

// Helper to format date YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get dashboard high-level metrics and summary charts
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    const todayStr = formatDate(today);

    // 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
    const weekAgoStr = formatDate(weekAgo);

    // 30 days ago / start of month
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 29);
    const monthAgoStr = formatDate(monthAgo);

    // Run parallel counts
    const [totalStudents, todayLateCount, weekLateCount, monthLateCount] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      LateEntry.countDocuments({ date: todayStr }),
      LateEntry.countDocuments({ date: { $gte: weekAgoStr, $lte: todayStr } }),
      LateEntry.countDocuments({ date: { $gte: monthAgoStr, $lte: todayStr } })
    ]);

    // Top frequently late student overall
    const topLateStudentsAgg = await LateEntry.aggregate([
      { $group: { _id: '$student', count: { $sum: 1 }, lastLate: { $max: '$timestamp' } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    let mostFrequentlyLateStudent = null;
    if (topLateStudentsAgg.length > 0) {
      const studentDetails = await Student.findById(topLateStudentsAgg[0]._id)
        .populate('department', 'name code');
      if (studentDetails) {
        mostFrequentlyLateStudent = {
          _id: studentDetails._id,
          name: studentDetails.name,
          rollNumber: studentDetails.rollNumber,
          department: studentDetails.department?.name || 'N/A',
          count: topLateStudentsAgg[0].count,
          lastLate: topLateStudentsAgg[0].lastLate
        };
      }
    }

    // Department with highest late entries
    const deptAgg = await LateEntry.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    let highestLateDepartment = null;
    if (deptAgg.length > 0) {
      const deptDetails = await Department.findById(deptAgg[0]._id);
      if (deptDetails) {
        highestLateDepartment = {
          name: deptDetails.name,
          code: deptDetails.code,
          count: deptAgg[0].count
        };
      }
    }

    // Last 7 days daily counts
    const last7Days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = formatDate(d);
      last7Days.push({
        date: dStr,
        day: dayNames[d.getDay()],
        count: 0
      });
    }

    const dailyCountsAgg = await LateEntry.aggregate([
      { $match: { date: { $gte: weekAgoStr, $lte: todayStr } } },
      { $group: { _id: '$date', count: { $sum: 1 } } }
    ]);

    const dailyCountMap = {};
    dailyCountsAgg.forEach((item) => {
      dailyCountMap[item._id] = item.count;
    });

    const dailyTrend = last7Days.map((item) => ({
      ...item,
      count: dailyCountMap[item.date] || 0
    }));

    // Department-wise distribution
    const departments = await Department.find({ status: 'active' });
    const deptBreakdownAgg = await LateEntry.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const deptMap = {};
    deptBreakdownAgg.forEach((item) => {
      if (item._id) deptMap[item._id.toString()] = item.count;
    });

    const departmentDistribution = departments.map((d) => ({
      _id: d._id,
      name: d.name,
      code: d.code,
      count: deptMap[d._id.toString()] || 0
    })).sort((a, b) => b.count - a.count);

    // Reasons breakdown
    const reasonsAgg = await LateEntry.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const reasonsDistribution = reasonsAgg.map((r) => ({
      reason: r._id || 'Unspecified',
      count: r.count
    }));

    res.status(200).json({
      success: true,
      kpis: {
        totalStudents,
        todayLateCount,
        weekLateCount,
        monthLateCount,
        mostFrequentlyLateStudent,
        highestLateDepartment
      },
      dailyTrend,
      departmentDistribution,
      reasonsDistribution
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top frequently late students
// @route   GET /api/analytics/frequent-late-students
// @access  Private
const getFrequentLateStudents = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const topAgg = await LateEntry.aggregate([
      {
        $group: {
          _id: '$student',
          count: { $sum: 1 },
          lastLate: { $max: '$timestamp' },
          reasons: { $push: '$reason' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit, 10) }
    ]);

    const populatedStudents = await Promise.all(
      topAgg.map(async (item) => {
        const student = await Student.findById(item._id).populate('department', 'name code');
        if (!student) return null;

        // Calculate most common reason
        const reasonFreq = {};
        item.reasons.forEach((r) => {
          reasonFreq[r] = (reasonFreq[r] || 0) + 1;
        });
        const commonReason = Object.keys(reasonFreq).reduce((a, b) =>
          reasonFreq[a] > reasonFreq[b] ? a : b, 'Traffic Congestion'
        );

        return {
          _id: student._id,
          studentId: student.studentId,
          barcode: student.barcode,
          name: student.name,
          rollNumber: student.rollNumber,
          department: student.department?.name || 'N/A',
          departmentCode: student.department?.code || 'N/A',
          year: student.year,
          section: student.section,
          lateCount: item.count,
          lastLateDate: item.lastLate,
          primaryReason: commonReason
        };
      })
    );

    res.status(200).json({
      success: true,
      count: populatedStudents.filter(Boolean).length,
      students: populatedStudents.filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly trend
// @route   GET /api/analytics/monthly
// @access  Private
const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const monthlyAgg = await LateEntry.aggregate([
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] }, // YYYY-MM
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyTrend = monthlyAgg.map((item) => {
      const [year, month] = item._id.split('-');
      const monthLabel = `${monthNames[parseInt(month, 10) - 1]} ${year}`;
      return {
        month: monthLabel,
        rawMonth: item._id,
        count: item.count
      };
    });

    res.status(200).json({
      success: true,
      monthlyTrend
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getFrequentLateStudents,
  getMonthlyAnalytics
};
