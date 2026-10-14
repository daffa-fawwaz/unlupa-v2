import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { classService } from '../services/classService';

export const classRouter = Router();

// Protect all class endpoints with authentication
classRouter.use(authenticate);

function getParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const createClassSchema = z.object({
  name: z.string().min(1, 'Nama kelas tidak boleh kosong'),
  type: z.enum(['quran', 'non-quran', 'QURAN', 'NON_QURAN']),
  code: z.string().optional(),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  requiredJuzList: z.array(z.number()).optional(),
  assignedBookIds: z.array(z.string()).optional(),
  assignedBooksData: z.array(z.any()).optional(),
});

const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  status: z.enum(['active', 'closed', 'ACTIVE', 'CLOSED']).optional(),
  requiredJuzList: z.array(z.number()).optional(),
  assignedBookIds: z.array(z.string()).optional(),
});

const joinClassSchema = z.object({
  code: z.string().min(1, 'Kode kelas tidak boleh kosong'),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/v1/classes
 * Create a new class
 */
classRouter.post('/classes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const body = createClassSchema.parse(req.body);
    const created = await classService.createClass(currentUserId, body);
    res.status(201).json({
      success: true,
      message: 'Kelas berhasil dibuat.',
      data: created,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/classes/teaching
 * Get all classes taught by current user
 */
classRouter.get('/classes/teaching', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const classes = await classService.listTeachingClasses(currentUserId);
    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/classes/joined
 * Get all classes joined by current user
 */
classRouter.get('/classes/joined', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const classes = await classService.listJoinedClasses(currentUserId);
    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/classes/code/:code
 * Get class by unique code
 */
classRouter.get('/classes/code/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = getParam(req.params.code);
    const cls = await classService.getClassByCode(code);
    res.status(200).json({
      success: true,
      data: cls,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/classes/join
 * Join class using code
 */
classRouter.post('/classes/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const { code } = joinClassSchema.parse(req.body);
    const joined = await classService.joinClassByCode(currentUserId, code);
    res.status(200).json({
      success: true,
      message: `Berhasil bergabung dengan kelas "${joined.name}".`,
      data: joined,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/classes/:id
 * Get class details by ID
 */
classRouter.get('/classes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = getParam(req.params.id);
    const cls = await classService.getClassById(classId);
    res.status(200).json({
      success: true,
      data: cls,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/classes/:id/leave
 * Leave a joined class
 */
classRouter.delete('/classes/:id/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const classId = getParam(req.params.id);
    await classService.leaveClass(currentUserId, classId);
    res.status(200).json({
      success: true,
      message: 'Berhasil keluar dari kelas.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/classes/:id
 * Update class
 */
classRouter.patch('/classes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;
    const classId = getParam(req.params.id);
    const body = updateClassSchema.parse(req.body);
    const updated = await classService.updateClass(currentUserId, classId, body, currentUserRole);
    res.status(200).json({
      success: true,
      message: 'Kelas berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/classes/:id
 * Delete class
 */
classRouter.delete('/classes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;
    const classId = getParam(req.params.id);
    await classService.deleteClass(currentUserId, classId, currentUserRole);
    res.status(200).json({
      success: true,
      message: 'Kelas berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/classes/:id/students/:studentId
 * Remove student from class
 */
classRouter.delete('/classes/:id/students/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;
    const classId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);
    await classService.removeStudent(currentUserId, classId, studentId, currentUserRole);
    res.status(200).json({
      success: true,
      message: 'Santri berhasil dikeluarkan dari kelas.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/classes/:id/students/:studentId/quran-pages
 * Teacher retrieves full Quran progress for a student in their class
 */
classRouter.get('/classes/:id/students/:studentId/quran-pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;
    const classId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);

    const pages = await classService.getStudentQuranPages(currentUserId, classId, studentId, currentUserRole);
    res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/classes/:id/students/:studentId/quran-pages/:pageNumber/activate
 * Teacher activates a page for a student during halaqah
 */
classRouter.post('/classes/:id/students/:studentId/quran-pages/:pageNumber/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;
    const classId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);
    const pageNumber = parseInt(getParam(req.params.pageNumber), 10);

    const updated = await classService.activateStudentQuranPage(currentUserId, classId, studentId, pageNumber, currentUserRole);
    res.status(200).json({
      success: true,
      message: 'Halaman santri berhasil diaktivasi.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/classes/:id/students/:studentId/quran-pages/:pageNumber/deactivate
 * Teacher deactivates a page for a student
 */
classRouter.post('/classes/:id/students/:studentId/quran-pages/:pageNumber/deactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;
    const classId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);
    const pageNumber = parseInt(getParam(req.params.pageNumber), 10);

    const updated = await classService.deactivateStudentQuranPage(currentUserId, classId, studentId, pageNumber, currentUserRole);
    res.status(200).json({
      success: true,
      message: 'Halaman santri berhasil dinonaktifkan.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/classes/:id/students/:studentId/quran-pages/:pageNumber/review
 * Teacher conducts tasmi' / murajaah review for student
 */
classRouter.post('/classes/:id/students/:studentId/quran-pages/:pageNumber/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;
    const classId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);
    const pageNumber = parseInt(getParam(req.params.pageNumber), 10);

    const { rating, notes, issueTypes, problemAyahs } = req.body;
    const reviewerName = req.user?.fullName || 'Pengajar';

    const result = await classService.reviewStudentQuranPage(
      currentUserId,
      classId,
      studentId,
      pageNumber,
      { rating, notes, issueTypes, problemAyahs, reviewerName },
      currentUserRole
    );

    res.status(200).json({
      success: true,
      message: 'Hasil simakan santri berhasil disimpan.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

