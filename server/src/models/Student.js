const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Please provide student ID'],
      unique: true,
      trim: true,
      uppercase: true
    },
    barcode: {
      type: String,
      required: [true, 'Please provide student barcode'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide student name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    rollNumber: {
      type: String,
      required: [true, 'Please provide roll number'],
      unique: true,
      trim: true,
      uppercase: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Please assign a department'],
      index: true
    },
    year: {
      type: Number,
      required: [true, 'Please provide study year'],
      min: 1,
      max: 5
    },
    section: {
      type: String,
      trim: true,
      default: 'A'
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})*$/,
        'Please provide a valid email address'
      ]
    },
    phone: {
      type: String,
      trim: true
    },
    guardianPhone: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching
studentSchema.index({ name: 'text', rollNumber: 'text', studentId: 'text' });

module.exports = mongoose.model('Student', studentSchema);
