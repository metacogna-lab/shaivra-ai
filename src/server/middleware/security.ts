import helmet, { type IHelmetContentSecurityPolicyDirectives } from 'helmet';

/**
 * Security headers configuration using Helmet
 * Protects against common web vulnerabilities
 */
const contentSecurityDirectives: IHelmetContentSecurityPolicyDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Vite dev
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  connectSrc: [
    "'self'",
    "https://generativelanguage.googleapis.com", // Gemini AI
    "https://*.supabase.co", // Supabase
    "ws://localhost:*", // Vite HMR in dev
    "wss://*.supabase.co", // Supabase realtime
  ],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  imgSrc: ["'self'", "data:", "https:", "blob:"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
};

if (process.env.NODE_ENV === 'production') {
  contentSecurityDirectives.upgradeInsecureRequests = [];
}

export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: contentSecurityDirectives,
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // Force HTTPS in production
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Prevent XSS attacks
  xssFilter: true,

  // Disable caching for sensitive data
  // (can be overridden per-route if needed)
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * Additional security headers for development
 * Less restrictive CSP for Vite HMR
 */
export const devSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval for Vite
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      connectSrc: [
        "'self'",
        "https://generativelanguage.googleapis.com",
        "https://*.supabase.co",
        "ws://localhost:*",
        "http://localhost:*",
        "wss://*.supabase.co",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  hidePoweredBy: true,
  xssFilter: true,
});
