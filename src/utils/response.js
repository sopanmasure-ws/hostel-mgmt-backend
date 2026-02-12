/**
 * Standard response formatter for API responses
 */

const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data }),
  });
};

const sendError = (res, statusCode = 400, message = 'Error', data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(data && { data }),
  });
};

/**
 * Common validation error responses
 */
const validationError = (res, message = 'Invalid request') => {
  return sendError(res, 400, message);
};

const notFoundError = (res, message = 'Resource not found') => {
  return sendError(res, 404, message);
};

const unauthorizedError = (res, message = 'Unauthorized') => {
  return sendError(res, 401, message);
};

const forbiddenError = (res, message = 'Forbidden') => {
  return sendError(res, 403, message);
};

const serverError = (res, error, message = 'Internal server error') => {
  console.error('Server Error:', error);
  return sendError(res, 500, message);
};

module.exports = {
  sendSuccess,
  sendError,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  serverError,
};
