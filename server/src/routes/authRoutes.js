const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
