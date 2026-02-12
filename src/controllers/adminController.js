const Admin = require('../models/Admin');
const Hostel = require('../models/Hostel');
const Application = require('../models/Application');
const Room = require('../models/Room');
const Student = require('../models/Student');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError, validationError, unauthorizedError, forbiddenError, notFoundError } = require('../utils/response');
const { validateRequiredFields } = require('../utils/validators');
const { canAccessHostel, validatePasswordMatch, calculateRoomStats, createSeatMap } = require('../utils/adminHelpers');

// @route   POST /api/admin/register
// @desc    Register a new admin
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, adminId, password, confirmPassword, phone } = req.body;

    // Validation
    const validation = validateRequiredFields(
      { name, email, adminId, password, confirmPassword },
      ['name', 'email', 'adminId', 'password', 'confirmPassword']
    );
    if (!validation.valid) {
      return validationError(res, `${validation.missing} is required`);
    }

    // Check if passwords match
    if (!validatePasswordMatch(password, confirmPassword)) {
      return validationError(res, 'Passwords do not match');
    }

    // Check if admin already exists
    let admin = await Admin.findOne({ $or: [{ email }, { adminId }] });
    if (admin) {
      return validationError(res, 'Email or Admin ID already exists');
    }

    // Create admin
    admin = await Admin.create({
      name,
      email,
      adminId,
      password,
      phone: phone || '',
      hostelIds: [],
    });

    const token = generateToken({ id: admin._id, role: admin.role, type: 'admin' });

    return sendSuccess(res, 201, 'Admin registered successfully', {
      admin: admin.toJSON(),
      token,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @route   POST /api/admin/login
// @desc    Login admin
// @access  Public
const login = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    // Validation
    if (!adminId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide admin ID and password',
      });
    }

    // Find admin and include password field
    const admin = await Admin.findOne({ adminId }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordMatch = await admin.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    const token = generateToken({ id: admin._id, role: admin.role, type: 'admin' });

    return res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      data: {
        admin: admin.toJSON(),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/admin/:adminId/hostels
// @desc    Get all hostels managed by admin
// @access  Public (for now)
const getAdminHostels = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Admins can only view their own hostels; superadmin can view any admin
    if (req.user.role === 'admin' && req.user.adminId !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view other admin hostels',
      });
    }

    const admin =
      req.user.role === 'admin'
        ? await Admin.findById(req.user._id).populate('hostelIds')
        : await Admin.findOne({ adminId }).populate('hostelIds');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hostels retrieved successfully',
      data: {
        hostels: admin.hostelIds,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/admin/hostels/:hostelId/applications
// @desc    Get all applications for a hostel
// @access  Public (for now)
const getHostelApplications = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { status, studentYear } = req.query;

    if (!canAccessHostel(req.user, hostelId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this hostel',
      });
    }

    let query = { hostelId };

    if (status) {
      query.status = status;
    }

    if (studentYear) {
      query.studentYear = studentYear;
    }

    const applications = await Application.find(query)
      .populate('studentId', 'name email pnr phone gender')
      .sort({ appliedOn: -1 });

    return res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: {
        applications,
        total: applications.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const acceptApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { roomNumber, floor } = req.body;

    if (!roomNumber || !floor) {
      return res.status(400).json({
        success: false,
        message: 'Please provide room number and floor',
      });
    }

    // Find application
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status.toUpperCase() !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been processed',
      });
    }

    if (!canAccessHostel(req.user, application.hostelId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process applications for this hostel',
      });
    }

    // Find room
    const room = await Room.findOne({
      roomNumber,
      floor,
      hostelId: application.hostelId,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    if (room.occupiedSpaces >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room is full',
      });
    }

    // Update application
    application.status = 'APPROVED';
    application.approvedOn = new Date();
    application.roomNumber = roomNumber;
    application.floor = floor;
    await application.save();

    // Update student with room details and hostel name
    const student = await Student.findById(application.studentId);
    if (student) {
      student.assignedRoom = room._id;
      student.roomNumber = roomNumber;
      student.floor = floor;
      student.applicationStatus = 'APPROVED';
      const hostel = await Hostel.findById(application.hostelId);
      if (hostel) {
        student.hostelName = hostel.name;
      }
      await student.save();
    }

    // Update room with student reference and details
    room.assignedStudents.push(application.studentId);
    
    // Add student details to room's studentDetails array
    if (!room.studentDetails) {
      room.studentDetails = [];
    }
    room.studentDetails.push({
      studentId: application.studentId,
      name: student.name,
      pnr: student.pnr,
    });
    
    room.occupiedSpaces += 1;
    if (room.occupiedSpaces === room.capacity) {
      room.status = 'filled';
    } else if (room.status === 'empty') {
      room.status = 'filled';
    }
    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Application accepted successfully',
      data: {
        application,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason',
      });
    }

    // Find application
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status.toUpperCase() !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been processed',
      });
    }

    if (!canAccessHostel(req.user, application.hostelId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process applications for this hostel',
      });
    }

    // Update application
    application.status = 'REJECTED';
    application.rejectionReason = rejectionReason;
    await application.save();

    // Update student application status
    const student = await Student.findById(application.studentId);
    if (student) {
      student.applicationStatus = 'REJECTED';
      await student.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Application rejected successfully',
      data: {
        application,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/admin/hostels/:hostelId/inventory
// @desc    Get hostel inventory with rooms
// @access  Public (for now)
const getHostelInventory = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { floor, status } = req.query;

    if (!canAccessHostel(req.user, hostelId)) {
      return forbiddenError(res, 'Not authorized to access this hostel');
    }

    // Verify hostel exists
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return notFoundError(res, 'Hostel not found');
    }

    let query = { hostelId };

    if (floor) {
      query.floor = floor;
    }

    if (status) {
      query.status = status;
    }

    const rooms = await Room.find(query)
      .populate('assignedStudents', 'name email pnr gender year')
      .sort({ floor: 1, roomNumber: 1 });

    // Calculate stats and create seat map
    const stats = calculateRoomStats(rooms);
    const seatMap = createSeatMap(rooms);

    return sendSuccess(res, 200, 'Inventory retrieved successfully', {
      hostel: {
        id: hostel._id,
        name: hostel.name,
      },
      stats,
      rooms,
      seatMap,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @route   GET /api/admin/hostels/:hostelId/rooms
// @desc    Get rooms with filters
// @access  Public (for now)
const getHostelRooms = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { floor, status } = req.query;

    if (!canAccessHostel(req.user, hostelId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this hostel',
      });
    }

    let query = { hostelId };

    if (floor) {
      query.floor = floor;
    }

    if (status) {
      query.status = status;
    }

    const rooms = await Room.find(query)
      .populate('assignedStudents', 'name email pnr')
      .sort({ floor: 1, roomNumber: 1 });

    return res.status(200).json({
      success: true,
      message: 'Rooms retrieved successfully',
      data: {
        rooms,
        total: rooms.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   PUT /api/admin/rooms/:roomId/update-status
// @desc    Update room status (maintenance, damaged, etc)
// @access  Public (for now)
const updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide room status',
      });
    }

    const validStatuses = ['empty', 'filled', 'damaged', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    if (!canAccessHostel(req.user, room.hostelId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update rooms for this hostel',
      });
    }

    room.status = status;
    if (notes) {
      room.notes = notes;
    }
    room.lastInspection = new Date();
    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Room status updated successfully',
      data: {
        room,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getAdminHostels,
  getHostelApplications,
  acceptApplication,
  rejectApplication,
  getHostelInventory,
  getHostelRooms,
  updateRoomStatus,
};
