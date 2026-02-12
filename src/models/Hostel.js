const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide hostel name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Please provide hostel location'],
    },
    warden: {
      type: String,
      default: '',
    },
    wardenPhone: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide hostel capacity'],
      min: 1,
    },
    availableRooms: {
      type: Number,
      required: true,
    },
    amenities: [
      {
        type: String,
      },
    ],
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Co-ed'],
      required: true,
    },
    rentPerMonth: {
      type: Number,
      default: 0,
    },
    rules: [
      {
        type: String,
      },
    ],
    image: {
      type: String,
      default: '',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for performance optimization (name already has unique: true in schema)
hostelSchema.index({ adminId: 1 });
hostelSchema.index({ gender: 1, isActive: 1 });
hostelSchema.index({ location: 1 });
hostelSchema.index({ createdAt: -1 });
hostelSchema.index({ availableRooms: 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
