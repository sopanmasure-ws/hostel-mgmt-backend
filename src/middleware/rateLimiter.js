const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

/**
 * General API rate limiter
 * Max 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Store in memory (use Redis for production)
  // store: new RedisStore({ client: redisClient }),
});

/**
 * Strict rate limiter for authentication routes
 * Max 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for registration
 * Max 3 registrations per hour per IP
 */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many accounts created from this IP, please try again after an hour.',
  },
});

/**
 * Speed limiter - gradually slow down responses
 * After 50 requests in 15 minutes, add 500ms delay per request
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 500,
  maxDelayMs: 20000, // Max 20 seconds delay
});

/**
 * Rate limiter for file uploads
 * Max 10 uploads per hour per IP
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
  },
});

/**
 * Rate limiter for sensitive operations
 * Max 20 requests per hour per IP
 */
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many requests for this operation, please try again later.',
  },
});

/**
 * Custom rate limiter for high-load endpoints
 * Max 1000 requests per minute (handles 1000+ req/sec in bursts)
 */
const highLoadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  registrationLimiter,
  speedLimiter,
  uploadLimiter,
  sensitiveLimiter,
  highLoadLimiter,
};
