import { prisma } from '../db';
import { Role, Plan } from '@prisma/client';
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

  /**
   * Directly update a user's plan (FREE, PREMIUM, INSTITUTIONAL)
   */
  async updateUserPlan(targetUserId: string, newPlan: Plan) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw createError('Pengguna tidak ditemukan.', 404, 'USER_NOT_FOUND');

    return prisma.user.update({
      where: { id: targetUserId },
      data: { plan: newPlan },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        plan: true,
      },
    });
  },

  /**
   * Admin permanently deletes a user account (cannot delete self)
   */
  async deleteUser(targetUserId: string, currentAdminId: string) {
    if (targetUserId === currentAdminId) {
      throw createError('Anda tidak dapat menghapus akun Anda sendiri.', 400, 'CANNOT_DELETE_SELF');
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw createError('Pengguna tidak ditemukan.', 404, 'USER_NOT_FOUND');

    await prisma.user.delete({ where: { id: targetUserId } });
    return { success: true, message: `Akun pengguna ${user.fullName || user.email} berhasil dihapus.` };
  },
};
