import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { systemConfigService } from '../services/systemConfigService';

export const systemRouter = Router();

const tierLimitSchema = z.object({
  maxBooks: z.number().int().min(0),
  maxCardsPerBook: z.number().int().min(0),
  maxDailyAIGenerations: z.number().int().min(0),
  maxActiveQuranJuz: z.number().int().min(0),
  maxAudioRecordings: z.number().int().min(0),
  maxJoinedClasses: z.number().int().min(0).optional().default(2),
  maxQuranClasses: z.number().int().min(0),
  maxNonQuranClasses: z.number().int().min(0),
  allowCreateClass: z.boolean(),
  allowExportReport: z.boolean(),
  allowAISmartExtractor: z.boolean(),
});

const updateTierConfigSchema = z.object({
  freeTier: tierLimitSchema.partial().optional(),
  premiumTier: tierLimitSchema.partial().optional(),
  pricing: z
    .object({
      monthlyIDR: z.number().min(0).optional(),
      yearlyIDR: z.number().min(0).optional(),
      monthlyUSD: z.number().min(0).optional(),
    })
    .optional(),
});

/**
 * GET /api/v1/system/tier-config
 * Public endpoint to fetch active tier limits & pricing
 */
systemRouter.get('/system/tier-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await systemConfigService.getTierConfig();
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/system/tier-config
 * Admin endpoint to update tier limits & pricing
 */
systemRouter.put(
  '/system/tier-config',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateTierConfigSchema.parse(req.body);
      const updatedBy = req.user?.email || req.user?.name || req.user?.id || 'Admin';

      const config = await systemConfigService.updateTierConfig(validatedData, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Pengaturan batasan sistem berhasil disimpan dan diterapkan.',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }
);
