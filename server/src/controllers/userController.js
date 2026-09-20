const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name code');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone, status } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'staff',
      department: department || null,
      phone,
      status: status || 'active'
    });

    const populatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: populatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, department, phone, status, password } = req.body;

    let user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Another user is already registered with this email'
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department || null;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;
    if (password && password.trim().length >= 6) {
      user.password = password;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own logged-in account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
