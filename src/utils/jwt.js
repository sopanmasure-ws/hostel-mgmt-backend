const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {Object} payload - { id, role, type }
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-12345678';
  const expire = process.env.JWT_EXPIRE || '7d';
  
  return jwt.sign(payload, secret, { expiresIn: expire });
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-12345678';
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
