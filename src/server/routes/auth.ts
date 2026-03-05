import { Router, Request, Response } from 'express';
import { validateBody } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiting';
import { loginSchema, registerSchema } from '../validation/schemas';
import { authenticateUser, registerUser, generateToken, signOutUser } from '../auth/supabaseAuth';
import { auditLogRepository } from '../repositories/auditLogRepository';

const router = Router();

/**
 * POST /auth/login - User login with email/password
 */
router.post('/login', authLimiter, validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { user, session } = await authenticateUser(email, password);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      user,
      token,
      session
    });
  } catch (error: any) {
    console.error('[Auth Login]', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /auth/register - New user registration
 */
router.post('/register', authLimiter, validateBody(registerSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { user } = await registerUser(email, password);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      user,
      token,
      message: 'User registered successfully'
    });
  } catch (error: any) {
    console.error('[Auth Register]', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /auth/logout - User logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    await signOutUser();

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('[Auth Logout]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /auth/refresh - Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'refresh_token required' });
    }

    // In production, validate refresh token and issue new JWT
    const newToken = generateToken({
      userId: 'user-id',
      email: 'user@example.com',
      role: 'analyst'
    });

    res.json({ success: true, token: newToken });
  } catch (error: any) {
    console.error('[Auth Refresh]', error);
    res.status(401).json({ error: error.message });
  }
});

export default router;
