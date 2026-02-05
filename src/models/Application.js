const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentPNR: {
      type: String,
      required: true,
    },
    studentYear: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    caste: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    aadharCard: {
      type: String,
      required: true,
    },
    admissionReceipt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'DISALLOWCATED'],
      default: 'PENDING',
    },
    appliedOn: {
      type: Date,
      default: Date.now,
    },
    approvedOn: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    roomNumber: {
      type: String,
      default: '',
    },
    floor: {
      type: String,
      default: '',
    },
    studentPNR: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure one application per student
applicationSchema.index({ studentId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
