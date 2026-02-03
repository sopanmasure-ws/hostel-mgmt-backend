const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Prefer explicit token type, but fall back for older tokens.
    let user = null;
    let userType = decoded.type;

    if (userType === 'student') {
      user = await Student.findById(decoded.id);
    } else if (userType === 'admin') {
      user = await Admin.findById(decoded.id);
    } else {
      // Backward compatibility: try student first, then admin
      user = await Student.findById(decoded.id);
      if (!user) {
        user = await Admin.findById(decoded.id);
        if (user) userType = 'admin';
      } else {
        userType = 'student';
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // Ensure role exists for backward compatibility with older DB records/tokens
    if (!user.role) {
      if (userType === 'admin') user.role = decoded.role || 'admin';
      if (userType === 'student') user.role = decoded.role || 'student';
    }

    // Block deactivated accounts (admin or student)
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    req.user = user;
    req.userType = userType;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
      return next();
    }
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'User role is not authorized to access this route',
      });
    }

    return next();
  };
};

module.exports = { protect, authorize };
