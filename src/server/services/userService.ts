import crypto from 'crypto';
import { DecodedIdToken } from 'firebase-admin/auth';
import { prisma } from '../db';
import { User, Role, Plan, Prisma } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

/**
 * Generate a unique, formatted Quran Space Code for a user
 */
function generateQuranSpaceCode(uid: string): string {
  const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const prefix = cleanUid.length >= 3 ? cleanUid : 'QRN';
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `UNL-${prefix}-${randomHex}`;
}

/**
 * Safe User Provisioning Service:
 * 1. Uses verified Firebase UID as the authoritative external identity.
 * 2. Never trusts unverified client claims (client body/headers).
 * 3. Never escalates existing user roles (role default is strictly Role.USER).
 * 4. Safely handles concurrency and race conditions using unique constraints.
 * 5. Prevents unsafe auto-linking of accounts solely based on unverified email.
 */
export async function findOrProvisionUser(decodedToken: DecodedIdToken): Promise<User> {
  const uid = decodedToken.uid;
  if (!uid || typeof uid !== 'string') {
    throw createError('Token Firebase tidak memiliki UID yang valid.', 401, 'INVALID_TOKEN_UID');
  }

  // 1. Check if user already exists by firebaseUid
  const existingUser = await prisma.user.findUnique({
    where: { firebaseUid: uid },
  });

  if (existingUser) {
    // If user already exists, retain their database role, plan, and permissions strictly.
    // Optionally backfill avatar or name if they were previously null and token provides them
    if (!existingUser.avatarUrl && decodedToken.picture) {
      try {
        return await prisma.user.update({
          where: { id: existingUser.id },
          data: { avatarUrl: decodedToken.picture },
        });
      } catch {
        return existingUser;
      }
    }
    return existingUser;
  }

  // 2. Extract profile details securely from verified Firebase token claims ONLY
  const rawEmail = (decodedToken.email || '').toLowerCase().trim();
  const email = rawEmail || `anon_${uid.slice(0, 8)}@unlupa.id`;
  const fullName = (decodedToken.name || '').trim() || (rawEmail ? rawEmail.split('@')[0] : 'Penghafal Qur\'an');
  const avatarUrl = decodedToken.picture || null;
  const quranSpaceCode = generateQuranSpaceCode(uid);

  // 3. Check for email collision with a different firebaseUid to prevent unauthorized account takeover
  if (rawEmail) {
    const emailCollision = await prisma.user.findUnique({
      where: { email: rawEmail },
    });
    if (emailCollision && emailCollision.firebaseUid !== uid) {
      throw createError(
        'Email ini sudah terdaftar dengan identitas akun lain. Mohon masuk dengan penyedia autentikasi awal Anda.',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }
  }

  // 4. Atomic creation with race-condition handling
  try {
    const newUser = await prisma.user.create({
      data: {
        firebaseUid: uid,
        email: email,
        fullName: fullName,
        avatarUrl: avatarUrl,
        quranSpaceCode: quranSpaceCode,
        role: Role.USER, // DEFAULT USER
        plan: Plan.FREE,
      },
    });
    return newUser;
  } catch (error) {
    // Handle race condition: If a concurrent request created the record simultaneously
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const metaTarget = JSON.stringify(error.meta?.target || '').toLowerCase();
      if (metaTarget.includes('firebaseuid')) {
        const raceUser = await prisma.user.findUnique({
          where: { firebaseUid: uid },
        });
        if (raceUser) return raceUser;
      }
      if (metaTarget.includes('quranspacecode')) {
        // Retry with randomized suffix if space code had rare collision
        const fallbackCode = `UNL-QRN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        return await prisma.user.create({
          data: {
            firebaseUid: uid,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            quranSpaceCode: fallbackCode,
            role: Role.USER,
            plan: Plan.FREE,
          },
        });
      }
    }
    throw error;
  }
}
