import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { adminBookService } from '../services/adminBookService';

export const adminBookRouter = Router();

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

/**
 * All admin book routes require authentication and ADMIN or SUPERADMIN role
 */
adminBookRouter.use('/admin/books', authenticate, requireRole(Role.ADMIN, Role.SUPERADMIN));

/**
 * GET /api/v1/admin/books
 * Admin directory of all published library books
 */
adminBookRouter.get('/admin/books', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;

    const books = await adminBookService.listPublishedBooks({ search, category });
    res.status(200).json({
      success: true,
      data: books,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/books/:id
 * Retrieve full details of any book for inspection (chapters, cards, items)
 */
adminBookRouter.get('/admin/books/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = getParam(req.params.id);
    const book = await adminBookService.getBookDetails(bookId);

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/admin/books/:id/unpublish
 * Admin pulls a book from the public library (unpublishes)
 */
adminBookRouter.patch('/admin/books/:id/unpublish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = getParam(req.params.id);
    const result = await adminBookService.unpublishBook(bookId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.book,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/admin/books/:id
 * Admin permanently deletes a book and its content from the database
 */
adminBookRouter.delete('/admin/books/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = getParam(req.params.id);
    const result = await adminBookService.deleteBook(bookId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});
