import { Request, Response, NextFunction } from 'express';

type Role = 'admin' | 'analyst' | 'viewer';

const roleHierarchy: Record<Role, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

/**
 * Middleware to authorize requests based on user role
 * Requires authenticate middleware to run first
 *
 * @param allowedRoles - Array of roles that can access this resource
 * @param requireExact - If true, requires exact role match. If false, allows higher roles.
 */
export function authorize(allowedRoles: Role[], requireExact = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    const userRole = req.user.role;
    const userRoleLevel = roleHierarchy[userRole];

    if (requireExact) {
      // Exact match required
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }
    } else {
      // Hierarchical check - higher roles can access lower-level resources
      const minRequiredLevel = Math.min(...allowedRoles.map(r => roleHierarchy[r]));

      if (userRoleLevel < minRequiredLevel) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`
        });
      }
    }

    next();
  };
}

/**
 * Shorthand middleware for admin-only endpoints
 */
export const adminOnly = authorize(['admin'], true);

/**
 * Shorthand middleware for analyst+ endpoints (analyst and admin)
 */
export const analystOrHigher = authorize(['analyst']);

/**
 * Shorthand middleware for any authenticated user
 */
export const anyAuthenticated = authorize(['viewer']);
