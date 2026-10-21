import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role, Plan } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { adminUserService } from '../services/adminUserService';

export const adminUserRouter = Router();

const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Role tidak valid (USER, ADMIN, SUPERADMIN)' }),
  }),
});

const updateUserPlanSchema = z.object({
  plan: z.nativeEnum(Plan, {
    errorMap: () => ({ message: 'Plan tidak valid (FREE, PREMIUM, INSTITUTIONAL)' }),
  }),
});

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

/**
 * GET /api/v1/admin/users
 * Admin directory of all registered users and their roles
 */
adminUserRouter.get(
  '/admin/users',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await adminUserService.listUsers();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/admin/users/:id/role
 * Admin directly updates user role (USER, ADMIN, SUPERADMIN)
 */
adminUserRouter.patch(
  '/admin/users/:id/role',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = getParam(req.params.id);
      const { role } = updateUserRoleSchema.parse(req.body);

      const updated = await adminUserService.updateUserRole(targetUserId, role);

      res.status(200).json({
        success: true,
        message: `Role pengguna berhasil diubah menjadi ${role}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/admin/users/:id/plan
 * Admin directly updates user plan (FREE, PREMIUM, INSTITUTIONAL)
 */
adminUserRouter.patch(
  '/admin/users/:id/plan',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = getParam(req.params.id);
      const { plan } = updateUserPlanSchema.parse(req.body);

      const updated = await adminUserService.updateUserPlan(targetUserId, plan);

      res.status(200).json({
        success: true,
        message: `Paket pengguna berhasil diubah menjadi ${plan}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/admin/users/:id
 * Admin permanently deletes a user account
 */
adminUserRouter.delete(
  '/admin/users/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = getParam(req.params.id);
      const currentAdminId = req.user!.id;

      const result = await adminUserService.deleteUser(targetUserId, currentAdminId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
);

