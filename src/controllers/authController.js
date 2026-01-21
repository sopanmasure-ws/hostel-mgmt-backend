const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, pnr, password, gender, year,...rest } = req.body;

    // Validation
    if (!name || !email || !pnr || !password || !gender || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if student already exists
    let student = await Student.findOne({ $or: [{ email }, { pnr }] });
    if (student) {
      return res.status(400).json({
        success: false,
        message: 'Email or PNR already exists',
      });
    }

    // Create student
    student = await Student.create({
      name,
      email,
      pnr,
      password,
      gender,
      year,
      ...rest,
    });

    const token = generateToken(student._id);

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      user: student.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login a student
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if student exists and get password field
    const student = await Student.findOne({ $or: [{ email }, { pnr: email }] }).select('+password');

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await student.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(student._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: student.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
const getMe = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);

    return res.status(200).json({
      success: true,
      user: student.toJSON(),
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
  getMe,
};
