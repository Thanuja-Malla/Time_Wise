const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getFrequentLateStudents,
  getMonthlyAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/frequent-late-students', getFrequentLateStudents);
router.get('/monthly', getMonthlyAnalytics);

module.exports = router;
