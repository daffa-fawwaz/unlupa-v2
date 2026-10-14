import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { authService, sanitizeUser } from '../services/authService';

export const authRouter = Router();

/**
 * POST /api/v1/auth/register (or /api/v1/register)
 * Creates a new user with name, email, and password.
 */
async function handleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body || {};

    const result = await authService.register({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Akun Anda telah siap digunakan.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login (or /api/v1/login)
 * Authenticates user via email and password, returning signed JWT.
 */
async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body || {};
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    const result = await authService.login({
      email,
      password,
      clientIp,
    });

    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me (or /api/v1/me)
 * Retrieves profile of the currently authenticated user from PostgreSQL.
 */
async function handleGetMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout (or /api/v1/logout)
 * Client-directed session termination.
 * Note on invalidation mechanism:
 * Unlupa v2 uses stateless Bearer JWT access tokens with client-side token discard.
 * Server returns 200 OK confirming logout. The frontend wipes the stored token from
 * memory and localStorage, clearing the session immediately.
 */
async function handleLogout(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Berhasil keluar (logout). Sesi klien telah ditutup.',
  });
}

// Register routes on both /auth/* and legacy shorthand /*
authRouter.post('/auth/register', handleRegister);
authRouter.post('/register', handleRegister);

authRouter.post('/auth/login', handleLogin);
authRouter.post('/login', handleLogin);

authRouter.get('/auth/me', authenticate, handleGetMe);
authRouter.get('/me', authenticate, handleGetMe);

authRouter.post('/auth/logout', handleLogout);
authRouter.post('/logout', handleLogout);
