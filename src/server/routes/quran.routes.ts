import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { quranService, ReviewQuranPageInput } from '../services/quranService';
import { createError } from '../middleware/errorHandler';

export const quranRouter = Router();

// Require JWT authentication for all Quran endpoints
quranRouter.use('/quran', authenticate);

function parsePageNumber(param: string | string[] | undefined): number {
  const raw = Array.isArray(param) ? param[0] : param;
  const num = parseInt(raw || '', 10);
  if (isNaN(num) || num < 1 || num > 604) {
    throw createError('Nomor halaman tidak valid (harus 1-604)', 400, 'INVALID_PAGE_NUMBER');
  }
  return num;
}

const reviewSchema = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  notes: z.string().trim().max(1000).optional(),
  issueTypes: z.array(z.string().trim()).optional(),
  problemAyahs: z.union([z.string().trim().max(500), z.array(z.string()).transform(arr => arr.join(', '))]).optional(),
  reviewerName: z.string().trim().max(100).optional(),
});

/**
 * GET /api/v1/quran/pages
 * Retrieves all Quran pages with user progress and review logs
 */
quranRouter.get('/quran/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const pages = await quranService.getUserQuranPages(userId);
    res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/quran/pages/:pageNumber
 * Retrieves details and history of a specific Quran page
 */
quranRouter.get('/quran/pages/:pageNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const pageNumber = parsePageNumber(req.params.pageNumber);
    const page = await quranService.getUserQuranPage(userId, pageNumber);

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/quran/pages/:pageNumber/activate
 * Activates a Quran page for murajaah
 */
quranRouter.post('/quran/pages/:pageNumber/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const pageNumber = parsePageNumber(req.params.pageNumber);
    const page = await quranService.activateQuranPage(userId, pageNumber);

    res.status(200).json({
      success: true,
      message: `Halaman ${pageNumber} berhasil diaktifkan`,
      data: page,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/quran/pages/:pageNumber/deactivate
 * Deactivates a Quran page from murajaah
 */
quranRouter.post('/quran/pages/:pageNumber/deactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const pageNumber = parsePageNumber(req.params.pageNumber);
    const page = await quranService.deactivateQuranPage(userId, pageNumber);

    res.status(200).json({
      success: true,
      message: `Halaman ${pageNumber} dinonaktifkan`,
      data: page,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/quran/pages/:pageNumber/review
 * Submits an inline FSRS review for a Quran page
 */
quranRouter.post('/quran/pages/:pageNumber/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const pageNumber = parsePageNumber(req.params.pageNumber);
    const validatedData = reviewSchema.parse(req.body) as ReviewQuranPageInput;

    const result = await quranService.reviewQuranPage(userId, pageNumber, validatedData);

    res.status(200).json({
      success: true,
      message: 'Hasil murajaah berhasil dicatat',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
