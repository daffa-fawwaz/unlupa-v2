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

/**
 * JWT Authentication Middleware:
 * 1. Reads the `Authorization: Bearer <JWT token>` header.
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

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Header otorisasi dengan format Bearer <token> diperlukan.',
      },
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token autentikasi tidak boleh kosong.',
      },
    });
    return;
  }

  try {
    // 1. Verify cryptographic token signature, algorithm, and expiration
    const payload = verifyJwtToken(token);

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

    // 2. Fetch authoritative user record from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

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
  } catch (error: any) {
    const statusCode = error?.statusCode || 401;
    const errorCode = error?.code || 'INVALID_TOKEN';
    const message = error?.message || 'Gagal memverifikasi token autentikasi.';

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
      },
    });
  }
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
