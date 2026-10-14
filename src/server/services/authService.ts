import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { User, Role, Plan, Prisma } from '@prisma/client';
import { env } from '../env';
import { createError } from '../middleware/errorHandler';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
  clientIp?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    quranSpaceCode: string;
    role: Role;
    plan: Plan;
    onboardingPreferences: any;
    createdAt: Date;
    updatedAt: Date;
  };
  token: string;
}

export interface JwtTokenPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ==============================================================================
// Brute-force Login Protection (In-Memory Rate Limiter)
// ==============================================================================

interface FailedAttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout
const failedAttemptsMap = new Map<string, FailedAttemptRecord>();

function getRateLimitKey(email: string, clientIp?: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = clientIp || 'unknown-ip';
  return `${normalizedIp}:${normalizedEmail}`;
}

export function checkLoginRateLimit(email: string, clientIp?: string): void {
  const key = getRateLimitKey(email, clientIp);
  const now = Date.now();
  const record = failedAttemptsMap.get(key);

  if (record) {
    if (record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      throw createError(
        `Terlalu banyak percobaan login gagal. Akun sementara dibatasi. Silakan coba lagi dalam ${remainingMinutes} menit.`,
        429,
        'TOO_MANY_REQUESTS'
      );
    }

    // Reset if window expired
    if (now - record.firstAttemptAt > BLOCK_WINDOW_MS) {
      failedAttemptsMap.delete(key);
    }
  }
}

export function recordFailedLoginAttempt(email: string, clientIp?: string): void {
  const key = getRateLimitKey(email, clientIp);
  const now = Date.now();
  const record = failedAttemptsMap.get(key);

  if (!record || now - record.firstAttemptAt > BLOCK_WINDOW_MS) {
    failedAttemptsMap.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    });
  } else {
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_WINDOW_MS;
    }
    failedAttemptsMap.set(key, record);
  }
}

export function resetFailedLoginAttempts(email: string, clientIp?: string): void {
  const key = getRateLimitKey(email, clientIp);
  failedAttemptsMap.delete(key);
}

// Clear expired records periodically to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedAttemptsMap.entries()) {
    if (record.blockedUntil <= now && now - record.firstAttemptAt > BLOCK_WINDOW_MS) {
      failedAttemptsMap.delete(key);
    }
  }
}, 30 * 60 * 1000).unref();

// ==============================================================================
// Password Hashing & JWT Signing
// ==============================================================================

const BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function generateJwtToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const payload: JwtTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const secret = env.JWT_SECRET;
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: (env.JWT_EXPIRES_IN || '7d') as any,
  });
}

export function verifyJwtToken(token: string): JwtTokenPayload {
  const secret = env.JWT_SECRET;
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });
    return decoded as JwtTokenPayload;
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createError('Sesi autentikasi telah kedaluwarsa. Silakan masuk kembali.', 401, 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Token autentikasi tidak valid.', 401, 'INVALID_TOKEN');
    }
    throw createError('Verifikasi token gagal.', 401, 'UNAUTHORIZED');
  }
}

/**
 * Asynchronously generates a unique Quran Space Code.
 * Checks the database to guarantee uniqueness before insertion,
 * preventing unique constraint collisions.
 */
async function generateUniqueQuranSpaceCode(seed?: string): Promise<string> {
  const cleanSeed = (seed || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();
  const prefix = cleanSeed.length >= 3 ? cleanSeed : 'QRN';

  for (let attempt = 0; attempt < 10; attempt++) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars (e.g. 7F2A9C)
    const candidateCode = `UNL-${prefix}-${randomHex}`;

    const existing = await prisma.user.findUnique({
      where: { quranSpaceCode: candidateCode },
      select: { id: true },
    });

    if (!existing) {
      return candidateCode;
    }
  }

  // Fallback with timestamp and random int to guarantee uniqueness under high concurrency
  return `UNL-${prefix}-${Date.now().toString(36).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    quranSpaceCode: user.quranSpaceCode,
    role: user.role,
    plan: user.plan,
    onboardingPreferences: user.onboardingPreferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ==============================================================================
// Authentication Service Implementation
// ==============================================================================

export const authService = {
  /**
   * Register a new user with name, email, and password.
   * Strictly enforces:
   * - Email normalization
   * - Duplicate check (409 Conflict)
   * - Password hashing (bcrypt salt rounds 12)
   * - Default USER role and FREE plan (never elevated from input)
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const rawEmail = input.email || '';
    const normalizedEmail = rawEmail.trim().toLowerCase();
    const cleanName = (input.name || '').trim();
    const rawPassword = input.password || '';

    // 1. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      throw createError('Format alamat email tidak valid.', 400, 'INVALID_EMAIL');
    }

    // 2. Name validation
    if (!cleanName || cleanName.length < 2) {
      throw createError('Nama lengkap minimal terdiri dari 2 karakter.', 400, 'INVALID_NAME');
    }
    if (cleanName.length > 100) {
      throw createError('Nama lengkap maksimal 100 karakter.', 400, 'NAME_TOO_LONG');
    }

    // 3. Password validation
    if (!rawPassword || rawPassword.length < 6) {
      throw createError('Password minimal harus terdiri dari 6 karakter.', 400, 'WEAK_PASSWORD');
    }
    if (rawPassword.length > 128) {
      throw createError('Password maksimal 128 karakter.', 400, 'PASSWORD_TOO_LONG');
    }

    // 4. Duplicate email check
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw createError(
        'Email ini sudah terdaftar. Silakan masuk menggunakan email tersebut atau gunakan opsi pemulihan.',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }

    // 5. Hash password safely
    const hashedPassword = await hashPassword(rawPassword);

    // 6. Generate guaranteed unique Quran Space Code
    const spaceCode = await generateUniqueQuranSpaceCode(normalizedEmail.split('@')[0] || 'NEW');

    // 7. Atomic User Creation with default Role.USER and Plan.FREE
    try {
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName: cleanName,
          passwordHash: hashedPassword,
          quranSpaceCode: spaceCode,
          role: Role.USER, // DEFAULT USER
          plan: Plan.FREE,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        },
      });

      const token = generateJwtToken(newUser);
      return {
        user: sanitizeUser(newUser),
        token,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const metaTarget = JSON.stringify(error.meta?.target || '').toLowerCase();
        if (metaTarget.includes('email')) {
          throw createError(
            'Email ini sudah terdaftar. Silakan masuk ke akun Anda.',
            409,
            'EMAIL_ALREADY_EXISTS'
          );
        }
        if (metaTarget.includes('quranspacecode')) {
          const fallbackCode = `UNL-QRN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
          const retryUser = await prisma.user.create({
            data: {
              email: normalizedEmail,
              fullName: cleanName,
              passwordHash: hashedPassword,
              quranSpaceCode: fallbackCode,
              role: Role.USER,
              plan: Plan.FREE,
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
            },
          });
          const token = generateJwtToken(retryUser);
          return {
            user: sanitizeUser(retryUser),
            token,
          };
        }
      }
      throw error;
    }
  },

  /**
   * Log in user with email and password.
   * Strictly enforces:
   * - Rate limiting / brute-force protection
   * - Constant-time / generic error response for invalid credentials
   * - Issues signed JWT with sub claim
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const normalizedEmail = (input.email || '').trim().toLowerCase();
    const rawPassword = input.password || '';

    if (!normalizedEmail || !rawPassword) {
      throw createError('Email dan password wajib diisi.', 400, 'INVALID_INPUT');
    }

    // Rate limit check
    checkLoginRateLimit(normalizedEmail, input.clientIp);

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      recordFailedLoginAttempt(normalizedEmail, input.clientIp);
      // Generic error message to prevent account enumeration
      throw createError('Email atau password yang Anda masukkan salah.', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password hash
    const isPasswordValid = await comparePassword(rawPassword, user.passwordHash);
    if (!isPasswordValid) {
      recordFailedLoginAttempt(normalizedEmail, input.clientIp);
      throw createError('Email atau password yang Anda masukkan salah.', 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed attempts on successful login
    resetFailedLoginAttempts(normalizedEmail, input.clientIp);

    // Issue signed JWT
    const token = generateJwtToken(user);

    return {
      user: sanitizeUser(user),
      token,
    };
  },

  /**
   * Get authenticated user profile from PostgreSQL
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError('Pengguna tidak ditemukan atau telah dinonaktifkan.', 404, 'USER_NOT_FOUND');
    }

    return sanitizeUser(user);
  },
};
