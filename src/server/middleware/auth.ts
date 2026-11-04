import { Request, Response, NextFunction } from 'express';
import { User, Role } from '@prisma/client';
import { prisma } from '../db';
import { verifyJwtToken, JwtTokenPayload } from '../services/authService';
import { createError } from './errorHandler';

// Extend Express Request interface to include authenticated user and token
declare global {
  namespace Express {
    interface Request {
      user?: User;
      jwtPayload?: JwtTokenPayload;
    }
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const rawVal = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(rawVal);
    } catch {
      cookies[key] = rawVal;
    }
  }
  return cookies;
}

/**
 * JWT Authentication Middleware:
 * 1. Reads the `Authorization: Bearer <JWT token>` header or `unlupa_token` cookie.
 * 2. Cryptographically verifies signature, algorithm (HS256), and expiry.
 * 3. Extracts user ID from verified `sub` claim.
 * 4. Ensures the user account exists in PostgreSQL.
 * 5. Attaches authenticated user to `req.user`.
 * 6. Rejects missing, invalid, or expired tokens with HTTP 401.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // TEST SEAM: Strictly allowed ONLY when NODE_ENV === 'test' and req.user was internally injected by test harness.
  if (process.env.NODE_ENV === 'test' && req.user) {
    return next();
  }

  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1]?.trim();
  } else if (typeof req.query.token === 'string' && req.query.token) {
    token = req.query.token.trim();
  } else if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.unlupa_token) {
      token = cookies.unlupa_token.trim();
    }
  }

  // Filter out invalid/empty token placeholders
  if (!token || token === 'null' || token === 'undefined') {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token autentikasi diperlukan (header Bearer, cookie unlupa_token, atau query ?token=...).',
      },
    });
    return;
  }

  // 1. Verify cryptographic token signature, algorithm, and expiration
  let payload: JwtTokenPayload;
  try {
    payload = verifyJwtToken(token);
  } catch (jwtError: any) {
    const statusCode = jwtError?.statusCode || 401;
    const errorCode = jwtError?.code || 'INVALID_TOKEN';
    const message = jwtError?.message || 'Token autentikasi tidak valid atau telah kedaluwarsa.';

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
      },
    });
    return;
  }

  if (!payload.sub) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token autentikasi tidak memiliki klaim subjek (sub) yang valid.',
      },
    });
    return;
  }

  // 2. Fetch authoritative user record from PostgreSQL in isolated try/catch
  let user: User | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
  } catch (dbError) {
    console.error('[Auth Middleware] Database error looking up user by token sub:', dbError);
    // Transient database failure must NEVER be returned as 401 Unauthorized!
    // Passing to next(dbError) produces HTTP 500/503 so client does NOT wipe valid user tokens.
    return next(dbError);
  }

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Akun pengguna tidak ditemukan atau telah dinonaktifkan.',
      },
    });
    return;
  }

  // 3. Attach authenticated identity to request context
  req.user = user;
  req.jwtPayload = payload;

  next();
}

/**
 * Role-Based Authorization Middleware:
 * Verifies that the authenticated user's database role is within the permitted roles list.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Autentikasi diperlukan sebelum mengakses sumber daya ini.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Anda tidak memiliki hak akses (role) yang memadai untuk melakukan tindakan ini.',
        },
      });
      return;
    }

    next();
  };
}
