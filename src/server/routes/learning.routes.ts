import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { learningService } from '../services/learningService';
import { wsManager } from '../websocket';
import { prisma } from '../db';

export const learningRouter = Router();

// Protect all learning endpoints with Firebase Authentication
learningRouter.use(authenticate);

function getParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const reviewCardSchema = z.object({
  rating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ], {
    errorMap: () => ({ message: 'Rating harus berupa angka 1 (Again), 2 (Hard), 3 (Good), atau 4 (Easy).' }),
  }),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/learning/stats
 * Get personal learning statistics for the authenticated user
 */
learningRouter.get('/learning/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const stats = await learningService.getStats(currentUserId);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/learning/due
 * Retrieve flashcards currently due for review
 */
learningRouter.get('/learning/due', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const bookId = typeof req.query.bookId === 'string' ? req.query.bookId : undefined;
    const limit = parseInt(String(req.query.limit || 50), 10);

    const dueCards = await learningService.getDueCards(currentUserId, bookId, limit);
    res.status(200).json({
      success: true,
      data: dueCards,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/items/:id/activate
 * Activate a flashcard for FSRS review
 */
learningRouter.post('/items/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const itemId = getParam(req.params.id);
    const progress = await learningService.activateItem(itemId, currentUserId);
    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/items/:id/deactivate
 * Deactivate a flashcard from FSRS review
 */
learningRouter.post('/items/:id/deactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const itemId = getParam(req.params.id);
    const result = await learningService.deactivateItem(itemId, currentUserId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/items/:id/review
 * Submit an FSRS review for a card
 */
learningRouter.post('/items/:id/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const itemId = getParam(req.params.id);
    const validatedData = reviewCardSchema.parse(req.body);

    const result = await learningService.submitReview(
      itemId,
      currentUserId,
      validatedData.rating
    );

    // Realtime broadcast via WebSocket
    const cleanUserId = currentUserId.replace(/^std-user-/, '').replace(/^user-/, '');
    wsManager.broadcastToUser(cleanUserId, {
      type: 'STUDENT_BOOK_REVIEWED',
      studentId: cleanUserId,
      itemId,
      rating: validatedData.rating,
      progress: result.progress,
      reviewLog: result.reviewLog,
      nextIntervalDays: result.nextIntervalDays,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to active classes where this student is enrolled
    prisma.classMember.findMany({
      where: { studentId: cleanUserId, class: { status: 'ACTIVE' } },
      select: { classId: true }
    }).then(memberships => {
      memberships.forEach(m => {
        wsManager.broadcastToRoom(`class:${m.classId}`, {
          type: 'STUDENT_BOOK_REVIEWED',
          classId: m.classId,
          studentId: cleanUserId,
          itemId,
          rating: validatedData.rating,
          progress: result.progress,
          reviewLog: result.reviewLog,
          nextIntervalDays: result.nextIntervalDays,
          timestamp: new Date().toISOString(),
        });
      });
    }).catch(() => {});

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/items/:id/progress
 * Get learning progress and recent review history for a specific card
 */
learningRouter.get('/items/:id/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const itemId = getParam(req.params.id);
    const progress = await learningService.getItemProgress(itemId, currentUserId);
    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});
