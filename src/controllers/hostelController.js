const Hostel = require('../models/Hostel');
const Admin = require('../models/Admin');
const Room = require('../models/Room');
const { sendSuccess, sendError, notFoundError, serverError } = require("../utils/response");

// @route   GET /api/hostels
// @desc    Get all hostels
// @access  Public
const getAllHostels = async (req, res) => {
  try {
    const query = { isActive: true };
    
    // Filter by gender if provided
    if (req.query.gender) {
      query.gender = req.query.gender;
    }
    
    const hostels = await Hostel.find(query);

    return res.status(200).json({
      success: true,
      count: hostels.length,
      hostels,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/hostels/:id
// @desc    Get hostel by ID
// @access  Public
const getHostelById = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    return res.status(200).json({
      success: true,
      hostel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST /api/hostels
// @desc    Create a new hostel (Admin only)
// @access  Private
const createHostel = async (req, res) => {
  try {
    const { name, location, capacity, gender, amenities, rules, adminId, availableRooms } = req.body;

    if (!name || !location || !capacity || !gender || !adminId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, location, capacity, gender, adminId)',
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found for provided adminId',
      });
    }

    const hostel = await Hostel.create({
      name,
      location,
      capacity,
      gender,
      availableRooms: typeof availableRooms === 'number' ? availableRooms : capacity,
      amenities: amenities || [],
      rules: rules || [],
      adminId: admin._id,
    });

    // Keep Admin.hostelIds in sync
    await Admin.updateOne({ _id: admin._id }, { $addToSet: { hostelIds: hostel._id } });

    return res.status(201).json({
      success: true,
      message: 'Hostel created successfully',
      hostel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   PUT /api/hostels/:id
// @desc    Update hostel (Admin only)
// @access  Private
const updateHostel = async (req, res) => {
  try {
    let hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    // If adminId is being changed, sync hostelIds lists
    if (req.body.adminId && req.body.adminId.toString() !== hostel.adminId.toString()) {
      const newAdmin = await Admin.findById(req.body.adminId);
      if (!newAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found for provided adminId',
        });
      }
      await Admin.updateOne({ _id: hostel.adminId }, { $pull: { hostelIds: hostel._id } });
      await Admin.updateOne({ _id: newAdmin._id }, { $addToSet: { hostelIds: hostel._id } });
    }

    hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Hostel updated successfully',
      hostel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   DELETE /api/hostels/:id
// @desc    Delete hostel (Admin only)
// @access  Private
const deleteHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    // Remove rooms for this hostel
    await Room.deleteMany({ hostelId: hostel._id });
    // Remove hostel reference from admin
    await Admin.updateOne({ _id: hostel.adminId }, { $pull: { hostelIds: hostel._id } });

    await Hostel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Hostel deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
};
