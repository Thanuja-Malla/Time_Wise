const express = require('express');
const router = express.Router();
const { getReportData, downloadUnifiedExcel } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/export-data', getReportData);
router.get('/download-excel', downloadUnifiedExcel);

module.exports = router;
