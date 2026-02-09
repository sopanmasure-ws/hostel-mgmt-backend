const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide room number'],
      trim: true,
    },
    floor: {
      type: String,
      required: [true, 'Please provide floor number'],
      trim: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide room capacity'],
      min: 1,
    },
    occupiedSpaces: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['available', 'empty', 'filled', 'damaged', 'maintenance'],
      default: 'empty',
    },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    studentDetails: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
        },
        name: {
          type: String,
          required: true,
        },
        pnr: {
          type: String,
          required: true,
        },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    lastInspection: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique room per hostel
roomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
