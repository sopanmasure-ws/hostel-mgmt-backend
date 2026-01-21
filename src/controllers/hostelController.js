const Hostel = require('../models/Hostel');

// @route   GET /api/hostels
// @desc    Get all hostels
// @access  Public
const getAllHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find({ isActive: true });

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
    const { name, location, capacity, gender, amenities, rules } = req.body;

    if (!name || !location || !capacity || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const hostel = await Hostel.create({
      name,
      location,
      capacity,
      gender,
      availableRooms: capacity,
      amenities: amenities || [],
      rules: rules || [],
    });

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
