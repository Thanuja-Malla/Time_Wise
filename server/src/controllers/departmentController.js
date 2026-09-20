const Department = require('../models/Department');
const Student = require('../models/Student');
const LateEntry = require('../models/LateEntry');

// @desc    Get all departments with student & late entry statistics
// @route   GET /api/departments
// @access  Private (Staff & Admin)
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Aggregate student counts and late entry counts for each department
    const deptsWithStats = await Promise.all(
      departments.map(async (dept) => {
        const studentCount = await Student.countDocuments({ department: dept._id });
        const lateEntryCount = await LateEntry.countDocuments({ department: dept._id });
        return {
          ...dept.toObject(),
          studentCount,
          lateEntryCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: deptsWithStats.length,
      departments: deptsWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const studentCount = await Student.countDocuments({ department: department._id });
    const lateEntryCount = await LateEntry.countDocuments({ department: department._id });

    res.status(200).json({
      success: true,
      department: {
        ...department.toObject(),
        studentCount,
        lateEntryCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, status } = req.body;

    const existingCode = await Department.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Department with code '${code}' already exists`
      });
    }

    const existingName = await Department.findOne({ name: name.trim() });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: `Department with name '${name}' already exists`
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description || '',
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, description, status } = req.body;

    let department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (code && code.toUpperCase() !== department.code) {
      const codeExists = await Department.findOne({ code: code.toUpperCase().trim() });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: `Department code '${code}' is already used`
        });
      }
      department.code = code.toUpperCase().trim();
    }

    if (name && name.trim() !== department.name) {
      const nameExists = await Department.findOne({ name: name.trim() });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: `Department name '${name}' is already used`
        });
      }
      department.name = name.trim();
    }

    if (description !== undefined) department.description = description;
    if (status) department.status = status;

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res, next) => {
  try {
    const studentCount = await Student.countDocuments({ department: req.params.id });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. There are ${studentCount} students registered under this department.`
      });
    }

    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
