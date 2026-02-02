const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Application = require('../models/Application');

const listAdmins = async (req, res) => {
  try {
    const { q } = req.query;

    const query = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { adminId: { $regex: q, $options: 'i' } },
      ];
    }

    const admins = await Admin.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        total: admins.length,
        admins,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminDetails = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findOne({ adminId }).populate('hostelIds');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const hostels = await Hostel.find({ adminId: admin._id }).sort({ createdAt: -1 });
    const applicationsCount = await Application.countDocuments({ hostelId: { $in: hostels.map((h) => h._id) } });

    return res.status(200).json({
      success: true,
      data: {
        admin,
        hostels,
        stats: {
          hostels: hostels.length,
          applications: applicationsCount,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const disableAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Cannot disable a superadmin' });
    }

    admin.isActive = false;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Admin disabled successfully',
      data: { admin: admin.toJSON() },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const enableAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    admin.isActive = true;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Admin enabled successfully',
      data: { admin: admin.toJSON() },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { name, email, adminId, password, confirmPassword, phone } = req.body;

    if (!name || !email || !adminId || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existing = await Admin.findOne({ $or: [{ email }, { adminId }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or Admin ID already exists' });
    }

    const admin = await Admin.create({
      name,
      email,
      adminId,
      password,
      phone: phone || '',
      hostelIds: [],
      role: 'admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: { admin: admin.toJSON() },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const listStudents = async (req, res) => {
  try {
    const { q } = req.query;

    const query = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { pnr: { $regex: q, $options: 'i' } },
      ];
    }

    const students = await Student.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { total: students.length, students },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentDetails = async (req, res) => {
  try {
    const { pnr } = req.params;

    const student = await Student.findOne({ pnr });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const application = await Application.findOne({ studentId: student._id }).populate('hostelId');

    return res.status(200).json({
      success: true,
      data: {
        student,
        application: application || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const overview = async (req, res) => {
  try {
    const [admins, students, hostels, rooms, applications] = await Promise.all([
      Admin.countDocuments({}),
      Student.countDocuments({}),
      Hostel.countDocuments({}),
      Room.countDocuments({}),
      Application.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        counts: { admins, students, hostels, rooms, applications },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  overview,
  createAdmin,
  listAdmins,
  getAdminDetails,
  disableAdmin,
  enableAdmin,
  listStudents,
  getStudentDetails,
};

