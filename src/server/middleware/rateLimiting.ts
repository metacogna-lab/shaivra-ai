import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter: 100 requests per 15 minutes per IP
 * Applied to all API routes
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests from whitelisted IPs
  skip: (req) => {
    const whitelist = (process.env.RATE_LIMIT_WHITELIST || '').split(',');
    const clientIp = req.ip || '';
    return whitelist.includes(clientIp);
  },
});

/**
 * AI endpoint limiter: 10 requests per minute per IP
 * Applied to Gemini AI endpoints to prevent API cost attacks
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI calls per minute
  message: {
    error: 'AI quota exceeded',
    message: 'Too many AI requests. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
});

/**
 * Authentication limiter: 5 login attempts per 15 minutes per IP
 * Applied to login/register endpoints to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts
  message: {
    error: 'Too many login attempts',
    message: 'Account locked due to too many failed login attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Search limiter: 30 requests per minute per IP
 * Applied to search endpoints
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: {
    error: 'Search quota exceeded',
    message: 'Too many search requests. Please try again in a moment.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload limiter: 10 uploads per hour per IP
 * Applied to file upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Upload quota exceeded',
    message: 'Too many file uploads. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
