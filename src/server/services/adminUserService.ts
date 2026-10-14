import { prisma } from '../db';
import { Role } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

export const adminUserService = {
  /**
   * List all users with their roles (for admin management)
   */
  async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        quranSpaceCode: true,
        role: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            teachingClasses: true,
            classMemberships: true,
            books: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Directly update a user's role (Admin override: USER, ADMIN, SUPERADMIN)
   */
  async updateUserRole(targetUserId: string, newRole: Role) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw createError('Pengguna tidak ditemukan.', 404, 'USER_NOT_FOUND');

    return prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        plan: true,
      },
    });
  },
};
