const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = ({ id, role, type }) => {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-12345678';
  const expire = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id, role, type }, secret, {
    expiresIn: expire,
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

    const token = generateToken({ id: student._id, role: student.role, type: 'student' });

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

    const token = generateToken({ id: student._id, role: student.role, type: 'student' });

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
    // `protect` attaches the Student document as `req.user`
    const student = req.user;

    return res.status(200).json({
      success: true,
      user: student ? student.toJSON() : null,
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
