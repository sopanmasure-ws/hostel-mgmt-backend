/**
 * Constants used across the application
 */

// User Roles
const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

// Room Status
const ROOM_STATUS = {
  EMPTY: 'empty',
  FILLED: 'filled',
  DAMAGED: 'damaged',
  MAINTENANCE: 'maintenance',
};

// Application Status
const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// Gender
const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

// Student Years
const STUDENT_YEARS = [1, 2, 3, 4, 5];

// Cache TTL (in seconds)
const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 15 * 60, // 15 minutes
  LONG: 60 * 60, // 1 hour
};

// Valid status values for room updates
const VALID_ROOM_STATUSES = Object.values(ROOM_STATUS);

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

module.exports = {
  ROLES,
  ROOM_STATUS,
  APPLICATION_STATUS,
  GENDER,
  STUDENT_YEARS,
  CACHE_TTL,
  VALID_ROOM_STATUSES,
  HTTP_STATUS,
};
