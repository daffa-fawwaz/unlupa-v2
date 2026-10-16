import { Router, Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { classService } from '../services/classService';
import { wsManager } from '../websocket';

export const classRouter = Router();
export const classEventBus = new EventEmitter();
classEventBus.setMaxListeners(200);

// Protect all class endpoints with authentication
classRouter.use('/classes', authenticate);

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
  assignedBooksData: z.array(z.any()).optional(),
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
 * GET /api/v1/classes/events/stream
 * Server-Sent Events (SSE) stream for real-time class notifications (e.g. book updates)
 */
classRouter.get('/classes/events/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Send initial connection ACK
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  const onUpdate = (eventData: any) => {
    try {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    } catch (err) {}
  };

  classEventBus.on('class_updated', onUpdate);

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (err) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    classEventBus.off('class_updated', onUpdate);
  });
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

    // Broadcast real-time update event to connected clients (students and teachers)
    classEventBus.emit('class_updated', {
      type: 'CLASS_BOOK_UPDATED',
      classId,
      assignedBooksData: updated.assignedBooksData,
      assignedBookIds: updated.assignedBookIds,
      updatedAt: new Date().toISOString(),
    });

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

    const cleanStudentIdQuran = studentId.replace(/^std-user-/, '').replace(/^user-/, '');
    wsManager.broadcastToUser(cleanStudentIdQuran, {
      type: 'STUDENT_QURAN_REVIEWED',
      classId,
      studentId: cleanStudentIdQuran,
      pageNumber,
      rating,
      reviewerName,
      timestamp: new Date().toISOString(),
    });
    wsManager.broadcastToRoom(`class:${classId}`, {
      type: 'STUDENT_QURAN_REVIEWED',
      classId,
      studentId: cleanStudentIdQuran,
      pageNumber,
      rating,
      reviewerName,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Hasil simakan santri berhasil disimpan.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/classes/:id/students/:studentId/items/:itemId/review
 * Teacher conducts review for student's book item card
 */
classRouter.post('/classes/:id/students/:studentId/items/:itemId/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;
    const classId = getParam(req.params.id);
    const studentId = getParam(req.params.studentId);
    const itemId = getParam(req.params.itemId);

    const { rating, notes } = req.body;
    if (![1, 2, 3, 4].includes(Number(rating))) {
      return res.status(400).json({ success: false, message: 'Rating harus bernilai 1, 2, 3, atau 4' });
    }

    const result = await classService.reviewStudentBookItem(
      currentUserId,
      classId,
      studentId,
      itemId,
      Number(rating) as 1 | 2 | 3 | 4,
      currentUserRole,
      notes
    );

    const cleanStudentId = studentId.replace(/^std-user-/, '').replace(/^user-/, '');
    wsManager.broadcastToUser(cleanStudentId, {
      type: 'STUDENT_BOOK_REVIEWED',
      classId,
      studentId: cleanStudentId,
      itemId,
      rating: Number(rating),
      progress: result.progress,
      reviewLog: result.reviewLog,
      nextIntervalDays: result.nextIntervalDays,
      reviewerId: currentUserId,
      reviewerName: req.user?.fullName || 'Pengajar',
      timestamp: new Date().toISOString(),
    });
    wsManager.broadcastToRoom(`class:${classId}`, {
      type: 'STUDENT_BOOK_REVIEWED',
      classId,
      studentId: cleanStudentId,
      itemId,
      rating: Number(rating),
      progress: result.progress,
      reviewLog: result.reviewLog,
      nextIntervalDays: result.nextIntervalDays,
      reviewerId: currentUserId,
      reviewerName: req.user?.fullName || 'Pengajar',
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Hasil review materi santri berhasil disimpan.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});


