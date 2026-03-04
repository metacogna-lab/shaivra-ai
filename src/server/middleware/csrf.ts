import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF protection middleware
 * Requires cookie-parser to be configured first
 */
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

/**
 * Error handler for CSRF token validation failures
 */
export function csrfErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed. Please refresh the page and try again.',
    });
  }
  next(err);
}

/**
 * Helper to get CSRF token for client
 * Use this in a GET endpoint to provide token to frontend
 */
export function getCsrfToken(req: Request): string {
  return (req as any).csrfToken();
}
