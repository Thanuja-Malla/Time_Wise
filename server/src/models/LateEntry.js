const mongoose = require('mongoose');

const lateEntrySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      index: true
    },
    date: {
      type: String,
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      index: true
    },
    time: {
      type: String,
      required: [true, 'Time string (HH:mm:ss) is required']
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff/Admin user reference is required']
    },
    reason: {
      type: String,
      enum: [
        'Traffic Congestion',
        'Bus / Transit Delay',
        'Weather Conditions',
        'Medical / Health',
        'Overslept',
        'Personal / Family',
        'Other'
      ],
      default: 'Traffic Congestion'
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },
    session: {
      type: String,
      enum: ['morning', 'afternoon'],
      default: 'morning'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate late entries for the same student on the same date and session
lateEntrySchema.index({ student: 1, date: 1, session: 1 }, { unique: true });

// Optimize analytics and date-range queries
lateEntrySchema.index({ department: 1, date: 1 });

module.exports = mongoose.model('LateEntry', lateEntrySchema);
