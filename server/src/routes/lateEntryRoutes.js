const express = require('express');
const router = express.Router();
const {
  createLateEntry,
  getLateEntries,
  getLateEntryById,
  getStudentLateHistory,
  deleteLateEntry
} = require('../controllers/lateEntryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student/:studentId', getStudentLateHistory);

router.route('/')
  .get(getLateEntries)
  .post(createLateEntry);

router.route('/:id')
  .get(getLateEntryById)
  .delete(authorize('admin'), deleteLateEntry);

module.exports = router;
