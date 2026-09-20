const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  getStudentByBarcode,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student scanner lookup endpoints (supports registration number, roll number, or barcode)
router.get('/barcode/:barcode', getStudentByBarcode);
router.get('/regno/:regno', getStudentByBarcode);

router.route('/')
  .get(getStudents)
  .post(authorize('admin'), createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;
