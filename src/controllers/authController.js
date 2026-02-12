const Student = require('../models/Student');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError, validationError, unauthorizedError } = require('../utils/response');
const { validateRequiredFields } = require('../utils/validators');

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, pnr, password, gender, year, ...rest } = req.body;

    // Validation
    const validation = validateRequiredFields({ name, email, pnr, password, gender, year }, ['name', 'email', 'pnr', 'password', 'gender', 'year']);
    if (!validation.valid) {
      return validationError(res, `${validation.missing} is required`);
    }

    // Check if student already exists
    let student = await Student.findOne({ $or: [{ email }, { pnr }] });
    if (student) {
      return validationError(res, 'Email or PNR already exists');
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

    return sendSuccess(res, 201, 'Student registered successfully', {
      token,
      user: student.toJSON(),
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @route   POST /api/auth/login
// @desc    Login a student
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    const validation = validateRequiredFields({ email, password }, ['email', 'password']);
    if (!validation.valid) {
      return validationError(res, `${validation.missing} is required`);
    }

    // Check if student exists and get password field
    const student = await Student.findOne({ $or: [{ email }, { pnr: email }] }).select('+password');

    if (!student) {
      return unauthorizedError(res, 'Invalid credentials');
    }

    // Check if password matches
    const isMatch = await student.comparePassword(password);

    if (!isMatch) {
      return unauthorizedError(res, 'Invalid credentials');
    }

    const token = generateToken({ id: student._id, role: student.role, type: 'student' });

    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: student.toJSON(),
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
const getMe = async (req, res) => {
  try {
    const student = req.user;
    return sendSuccess(res, 200, 'User fetched', {
      user: student ? student.toJSON() : null,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
