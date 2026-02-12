/**
 * Validation utilities for common field checks
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

const validatePNR = (pnr) => {
  return pnr && pnr.trim().length > 0;
};

const validatePassword = (password) => {
  // Minimum 6 characters
  return password && password.length >= 6;
};

const validateRequiredFields = (fields, fieldNames) => {
  for (const field of fieldNames) {
    if (!fields[field]) {
      return { valid: false, missing: field };
    }
  }
  return { valid: true };
};

const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePNR,
  validatePassword,
  validateRequiredFields,
  validateObjectId,
};
