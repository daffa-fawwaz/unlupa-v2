import { prisma } from '../db';
import { ClassType, ClassStatus, Plan, Role, Prisma } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { quranService, ReviewQuranPageInput } from './quranService';
import { getSurahForPage, getJuzForPage } from '../../data/quranData';
import { isDue } from '../../lib/fsrs';
import { learningService } from './learningService';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export interface CreateClassInput {
  name: string;
  type: 'quran' | 'non-quran' | 'QURAN' | 'NON_QURAN';
  code?: string;
  description?: string;
  coverUrl?: string;
  requiredJuzList?: number[];
  assignedBookIds?: string[];
  assignedBooksData?: any[];
}

export interface UpdateClassInput {
  name?: string;
  description?: string;
  coverUrl?: string;
  status?: 'active' | 'closed' | 'ACTIVE' | 'CLOSED';
  requiredJuzList?: number[];
  assignedBookIds?: string[];
  assignedBooksData?: any[];
}

/**
 * Builds the complete 604-element Quran pages array for a student,
 * accurately overlaying active state and FSRS metrics from PostgreSQL user_quran_pages.
 */
export function buildStudentQuranPages(userPages: any[] = []): any[] {
  const pageMap = new Map<number, any>();
  if (Array.isArray(userPages)) {
    userPages.forEach(p => {
      pageMap.set(Number(p.pageNumber), p);
    });
  }

  const result = [];
  for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
    const dbPage = pageMap.get(pageNumber);
    const surah = getSurahForPage(pageNumber);
    const juz = getJuzForPage(pageNumber);

    const isActive = Boolean(dbPage?.isActive);
    let statusStr = 'inactive';
    if (dbPage?.status) {
      statusStr = String(dbPage.status).toLowerCase();
      if (statusStr !== 'active' && statusStr !== 'inactive' && statusStr !== 'mastered_for_now' && statusStr !== 'mapan') {
        statusStr = isActive ? 'active' : 'inactive';
      }
    } else if (isActive) {
      statusStr = 'active';
    }

    result.push({
      pageNumber,
      juzNumber: juz,
      surahNumber: surah.surahNumber,
      surahNameEn: surah.nameEn,
      surahNameAr: surah.nameAr,
      ayahRange: surah.ayahRange,
      imageUrl: `https://quran.ksu.edu.sa/png_pages/${pageNumber}.png`,
      isActive,
      status: statusStr,
      mapanCelebrated: Boolean(dbPage?.mapanCelebrated),
      fsrsData: {
        stability: Number(dbPage?.stability) || 0,
        difficulty: Number(dbPage?.difficulty) || 10.0,
        reps: Number(dbPage?.reps) || 0,
        lapses: Number(dbPage?.lapses) || 0,
        lastReview: dbPage?.lastReview ? new Date(dbPage.lastReview).toISOString() : null,
        nextReview: dbPage?.nextReview ? new Date(dbPage.nextReview).toISOString() : null,
        state: dbPage?.state ? String(dbPage.state).toLowerCase() : (isActive ? 'review' : 'new'),
      },
      reviewLogs: Array.isArray(dbPage?.reviewLogs) ? dbPage.reviewLogs.map((rl: any) => ({
        id: rl.id,
        date: rl.date ? new Date(rl.date).toISOString() : new Date().toISOString(),
        rating: rl.rating,
        notes: rl.notes,
        issueTypes: rl.issueTypes,
        problemAyahs: rl.problemAyahs,
      })) : [],
    });
  }
  return result;
}

function isPageInRequiredJuz(pageNumber: number, requiredJuzList?: number[]): boolean {
  if (!requiredJuzList || requiredJuzList.length === 0 || requiredJuzList.length === 30) {
    return true;
  }
  const pageJuz = getJuzForPage(pageNumber);
  return requiredJuzList.includes(pageJuz);
}

export function formatClassResponse(cls: any) {
  const typeFormatted = (cls.type === ClassType.QURAN || cls.type === 'quran') ? 'quran' : 'non-quran';
  const statusFormatted = (cls.status === ClassStatus.ACTIVE || cls.status === 'active') ? 'active' : 'closed';
  
  const assignedIds: string[] = Array.isArray(cls.assignedBookIds) && cls.assignedBookIds.length > 0
    ? cls.assignedBookIds
    : (cls.assignedBooks?.map((ab: any) => ab.bookId) || []);

  const isQuranClass = typeFormatted === 'quran';
  const requiredJuzList: number[] = Array.isArray(cls.requiredJuzList) ? cls.requiredJuzList : [];

  const students = (cls.members || []).map((m: any) => {
    if (isQuranClass) {
      // QURAN CLASS: Strictly calculate due and active pages for this class's assigned Juz!
      const userPages = m.student?.userQuranPages || [];
      const classPages = userPages.filter((p: any) => isPageInRequiredJuz(Number(p.pageNumber), requiredJuzList));
      const activePages = classPages.filter((p: any) => p.isActive);
      const activeCount = activePages.length;
      const dueCount = activePages.filter((p: any) => {
        const nextIso = p.nextReview ? new Date(p.nextReview).toISOString() : null;
        const lastIso = p.lastReview ? new Date(p.lastReview).toISOString() : null;
        return isDue(nextIso, p.isActive, lastIso);
      }).length;
      const avgStability = activeCount > 0
        ? Number((activePages.reduce((acc: number, p: any) => acc + (p.stability || 0), 0) / activeCount).toFixed(1))
        : 0;

      const fullQuranData = buildStudentQuranPages(classPages);

      return {
        id: m.student?.id || m.studentId,
        name: m.student?.fullName || 'Santri',
        email: m.student?.email || '',
        avatarUrl: m.student?.avatarUrl || '',
        quranSpaceCode: m.student?.quranSpaceCode || '',
        activeItemsCount: activeCount,
        dueTodayCount: dueCount,
        averageStability: avgStability,
        retentionRate: 95,
        lastActive: m.joinedAt ? new Date(m.joinedAt).toISOString() : 'Baru bergabung',
        frequentStruggles: [],
        quranData: fullQuranData,
        bookItemsData: [],
      };
    } else {
      // NON-QURAN (Kitab / Materi Flashcard) CLASS:
      // Strictly calculate progress for books assigned to THIS class only!
      const allClassBookIds = new Set<string>();
      assignedIds.forEach(id => {
        if (id) {
          allClassBookIds.add(id);
          allClassBookIds.add(`class-book-${cls.id}-${id}`);
        }
      });
      if (Array.isArray(cls.assignedBooks)) {
        cls.assignedBooks.forEach((ab: any) => {
          if (ab.bookId) {
            allClassBookIds.add(ab.bookId);
            allClassBookIds.add(`class-book-${cls.id}-${ab.bookId}`);
          }
          if (ab.book?.id) {
            allClassBookIds.add(ab.book.id);
            allClassBookIds.add(`class-book-${cls.id}-${ab.book.id}`);
          }
        });
      }

      const allProgresses: any[] = m.student?.bookProgresses || [];
      const classProgresses = allProgresses.filter((bp: any) => {
        const bId = bp.bookItem?.bookId;
        return bId && allClassBookIds.has(bId);
      });

      const activeProgresses = classProgresses.filter((bp: any) => bp.isActive);
      const activeCount = activeProgresses.length;
      const dueProgresses = activeProgresses.filter((bp: any) => {
        const nextIso = bp.nextReview ? new Date(bp.nextReview).toISOString() : null;
        const lastIso = bp.lastReview ? new Date(bp.lastReview).toISOString() : null;
        return isDue(nextIso, bp.isActive, lastIso);
      });
      const dueCount = dueProgresses.length;

      const frequentStruggles = dueProgresses
        .map((bp: any) => bp.bookItem?.question)
        .filter(Boolean)
        .slice(0, 5);

      const avgStability = activeCount > 0
        ? Number((activeProgresses.reduce((acc: number, bp: any) => acc + (bp.stability || 0), 0) / activeCount).toFixed(1))
        : 0;

      const bookItemsData = classProgresses.map((bp: any) => ({
        id: bp.bookItemId,
        bookId: bp.bookItem?.bookId,
        question: bp.bookItem?.question || '',
        answer: bp.bookItem?.answer || '',
        isActive: bp.isActive,
        status: bp.status,
        fsrsData: {
          stability: bp.stability || 0,
          difficulty: bp.difficulty || 5,
          reps: bp.reps || 0,
          lapses: bp.lapses || 0,
          state: bp.state?.toLowerCase() || 'new',
          lastReview: bp.lastReview ? new Date(bp.lastReview).toISOString() : null,
          nextReview: bp.nextReview ? new Date(bp.nextReview).toISOString() : null,
        },
      }));

      return {
        id: m.student?.id || m.studentId,
        name: m.student?.fullName || 'Santri',
        email: m.student?.email || '',
        avatarUrl: m.student?.avatarUrl || '',
        quranSpaceCode: m.student?.quranSpaceCode || '',
        activeItemsCount: activeCount,
        dueTodayCount: dueCount,
        averageStability: avgStability,
        retentionRate: 95,
        lastActive: m.joinedAt ? new Date(m.joinedAt).toISOString() : 'Baru bergabung',
        frequentStruggles,
        quranData: [],
        bookItemsData,
      };
    }
  });

  return {
    id: cls.id,
    teacherId: cls.teacherId,
    teacherName: cls.teacher?.fullName || 'Pengajar',
    name: cls.name,
    code: cls.code,
    type: typeFormatted as 'quran' | 'non-quran',
    description: cls.description || '',
    coverUrl: cls.coverUrl || undefined,
    requiredJuzList: cls.requiredJuzList || [],
    assignedBookIds: assignedIds,
    assignedBooksData: cls.metadata?.assignedBooksData || undefined,
    status: statusFormatted as 'active' | 'closed',
    closedAt: cls.closedAt ? new Date(cls.closedAt).toISOString() : undefined,
    createdAt: cls.createdAt ? new Date(cls.createdAt).toISOString() : new Date().toISOString(),
    students,
  };
}

const defaultClassInclude = {
  teacher: {
    select: { id: true, fullName: true, email: true, avatarUrl: true, quranSpaceCode: true },
  },
  members: {
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          quranSpaceCode: true,
          userQuranPages: {
            select: {
              pageNumber: true,
              isActive: true,
              status: true,
              stability: true,
              difficulty: true,
              reps: true,
              lapses: true,
              lastReview: true,
              nextReview: true,
              state: true,
              mapanCelebrated: true,
            },
            orderBy: { pageNumber: 'asc' as const },
          },
          bookProgresses: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              bookItemId: true,
              isActive: true,
              status: true,
              stability: true,
              difficulty: true,
              reps: true,
              lapses: true,
              lastReview: true,
              nextReview: true,
              state: true,
              bookItem: {
                select: {
                  id: true,
                  bookId: true,
                  question: true,
                  answer: true,
                },
              },
            },
          },
        },
      },
    },
  },
  assignedBooks: {
    include: {
      book: true,
    },
  },
};

export class ClassService {
  /**
   * Create a new class with quota enforcement
   */
  async createClass(teacherId: string, input: CreateClassInput) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw createError('Pengguna pengajar tidak ditemukan.', 404, 'USER_NOT_FOUND');
    }

    const classTypeEnum = (input.type.toLowerCase() === 'quran') ? ClassType.QURAN : ClassType.NON_QURAN;

    // Enforce limits for FREE plan users
    const isPro = teacher.plan === Plan.PREMIUM || teacher.plan === Plan.INSTITUTIONAL || teacher.role === Role.ADMIN || teacher.role === Role.SUPERADMIN;
    if (!isPro) {
      if (classTypeEnum === ClassType.QURAN) {
        const quranCount = await prisma.class.count({
          where: { teacherId, type: ClassType.QURAN },
        });
        if (quranCount >= 1) {
          throw createError(
            'Batas akun Free adalah maksimal 1 kelas Al-Qur\'an. Upgrade ke Pro untuk membuat lebih banyak kelas.',
            403,
            'QUOTA_EXCEEDED'
          );
        }
      } else {
        const nonQuranCount = await prisma.class.count({
          where: { teacherId, type: ClassType.NON_QURAN },
        });
        if (nonQuranCount >= 1) {
          throw createError(
            'Batas akun Free adalah maksimal 1 kelas Non-Qur\'an (Kitab). Upgrade ke Pro untuk membuat lebih banyak kelas.',
            403,
            'QUOTA_EXCEEDED'
          );
        }
      }
    }

    // Determine unique code
    let finalCode = input.code?.trim().toUpperCase();
    if (finalCode) {
      const existing = await prisma.class.findUnique({ where: { code: finalCode } });
      if (existing) {
        finalCode = undefined;
      }
    }

    if (!finalCode) {
      const prefix = classTypeEnum === ClassType.QURAN ? 'QRN' : 'CLS';
      for (let attempt = 0; attempt < 10; attempt++) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        const candidate = `${prefix}-${rand}`;
        const existing = await prisma.class.findUnique({ where: { code: candidate } });
        if (!existing) {
          finalCode = candidate;
          break;
        }
      }
      if (!finalCode) {
        finalCode = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
      }
    }

    // Check valid assigned book IDs
    const assignedBookIds = input.assignedBookIds || [];
    const validBookAssignments: { bookId: string }[] = [];
    if (classTypeEnum === ClassType.NON_QURAN && assignedBookIds.length > 0) {
      const potentialUuids = assignedBookIds.filter(id => isValidUuid(id));
      if (potentialUuids.length > 0) {
        const existingBooks = await prisma.book.findMany({
          where: { id: { in: potentialUuids } },
          select: { id: true },
        });
        validBookAssignments.push(...existingBooks.map(b => ({ bookId: b.id })));
      }
    }

    const metadataObj = input.assignedBooksData ? { assignedBooksData: input.assignedBooksData } : undefined;

    const created = await prisma.class.create({
      data: {
        teacherId,
        name: input.name.trim(),
        code: finalCode,
        type: classTypeEnum,
        description: input.description?.trim() || '',
        coverUrl: input.coverUrl || null,
        requiredJuzList: classTypeEnum === ClassType.QURAN ? (input.requiredJuzList || [1, 2, 3, 4, 5]) : [],
        assignedBookIds: assignedBookIds,
        metadata: metadataObj,
        status: ClassStatus.ACTIVE,
        assignedBooks: validBookAssignments.length > 0 ? {
          create: validBookAssignments,
        } : undefined,
      },
      include: defaultClassInclude,
    });

    return formatClassResponse(created);
  }

  /**
   * List all classes where the user is the teacher
   */
  async listTeachingClasses(teacherId: string) {
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: defaultClassInclude,
      orderBy: { createdAt: 'desc' },
    });

    return classes.map(formatClassResponse);
  }

  /**
   * List all classes where the user is an enrolled student
   */
  async listJoinedClasses(studentId: string) {
    const memberships = await prisma.classMember.findMany({
      where: { studentId },
      include: {
        class: {
          include: defaultClassInclude,
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => formatClassResponse(m.class));
  }

  /**
   * Find class by class ID
   */
  async getClassById(id: string) {
    const found = await prisma.class.findUnique({
      where: { id },
      include: defaultClassInclude,
    });

    if (!found) {
      throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    }

    return formatClassResponse(found);
  }

  /**
   * Find class by class code
   */
  async getClassByCode(code: string) {
    const cleanCode = code.trim().toUpperCase();
    const found = await prisma.class.findUnique({
      where: { code: cleanCode },
      include: defaultClassInclude,
    });

    if (!found) {
      throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    }

    return formatClassResponse(found);
  }

  /**
   * Join a class using class code
   */
  async joinClassByCode(studentId: string, code: string) {
    const cleanCode = code.trim().toUpperCase();
    const found = await prisma.class.findUnique({
      where: { code: cleanCode },
      include: {
        teacher: {
          select: { id: true, fullName: true, email: true, avatarUrl: true, quranSpaceCode: true },
        },
        members: true,
      },
    });

    if (!found) {
      throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    }

    if (found.status === ClassStatus.CLOSED) {
      throw createError('Kelas ini telah ditutup oleh pengajar.', 400, 'CLASS_CLOSED');
    }

    const alreadyJoined = found.members.some(m => m.studentId === studentId);
    if (alreadyJoined) {
      throw createError('Anda sudah bergabung di kelas ini.', 400, 'ALREADY_JOINED');
    }

    await prisma.classMember.create({
      data: {
        classId: found.id,
        studentId,
      },
    });

    // Fetch and return full updated class
    return this.getClassByCode(cleanCode);
  }

  /**
   * Leave a joined class
   */
  async leaveClass(studentId: string, classId: string) {
    await prisma.classMember.deleteMany({
      where: {
        classId,
        studentId,
      },
    });
    return { success: true };
  }

  /**
   * Update class properties
   */
  async updateClass(userId: string, classId: string, input: UpdateClassInput, userRole: Role) {
    const existing = await prisma.class.findUnique({ where: { id: classId } });
    if (!existing) {
      throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    }

    if (existing.teacherId !== userId && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw createError('Hanya pengajar kelas atau admin yang dapat mengubah kelas ini.', 403, 'FORBIDDEN');
    }

    const statusEnum = input.status 
      ? ((input.status.toLowerCase() === 'closed') ? ClassStatus.CLOSED : ClassStatus.ACTIVE)
      : undefined;

    const currentMeta = (existing.metadata as Record<string, any>) || {};
    const nextMeta = input.assignedBooksData !== undefined
      ? { ...currentMeta, assignedBooksData: input.assignedBooksData }
      : undefined;

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        name: input.name ? input.name.trim() : undefined,
        description: input.description !== undefined ? input.description.trim() : undefined,
        coverUrl: input.coverUrl !== undefined ? input.coverUrl : undefined,
        status: statusEnum,
        closedAt: statusEnum === ClassStatus.CLOSED ? new Date() : (statusEnum === ClassStatus.ACTIVE ? null : undefined),
        requiredJuzList: input.requiredJuzList,
        assignedBookIds: input.assignedBookIds,
        metadata: nextMeta,
      },
      include: defaultClassInclude,
    });

    return formatClassResponse(updated);
  }

  /**
   * Delete class
   */
  async deleteClass(userId: string, classId: string, userRole: Role) {
    const existing = await prisma.class.findUnique({ where: { id: classId } });
    if (!existing) {
      throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    }

    if (existing.teacherId !== userId && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw createError('Hanya pengajar kelas atau admin yang dapat menghapus kelas ini.', 403, 'FORBIDDEN');
    }

    await prisma.class.delete({ where: { id: classId } });
    return { success: true };
  }

  /**
   * Remove student from class
   */
  async removeStudent(userId: string, classId: string, studentId: string, userRole: Role) {
    const existing = await prisma.class.findUnique({ where: { id: classId } });
    if (!existing) {
      throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    }

    if (existing.teacherId !== userId && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw createError('Hanya pengajar kelas atau admin yang dapat mengeluarkan santri.', 403, 'FORBIDDEN');
    }

    await prisma.classMember.deleteMany({
      where: {
        classId,
        studentId,
      },
    });

    return { success: true };
  }

  /**
   * Get student's complete 604 Quran pages with real database progress
   */
  async getStudentQuranPages(teacherId: string, classId: string, studentId: string, userRole: Role) {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        members: { where: { studentId } },
      },
    });

    if (!cls) {
      throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    }

    if (cls.teacherId !== teacherId && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw createError('Hanya pengajar kelas atau admin yang dapat mengakses mushaf santri.', 403, 'FORBIDDEN');
    }

    const pages = await quranService.getUserQuranPages(studentId);
    return buildStudentQuranPages(pages);
  }

  /**
   * Teacher activates page for student
   */
  async activateStudentQuranPage(teacherId: string, classId: string, studentId: string, pageNumber: number, userRole: Role) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    if (cls.teacherId !== teacherId && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw createError('Hanya pengajar kelas atau admin yang dapat mengaktivasi halaman santri.', 403, 'FORBIDDEN');
    }

    return await quranService.activateQuranPage(studentId, pageNumber);
  }

  /**
   * Teacher deactivates page for student
   */
  async deactivateStudentQuranPage(teacherId: string, classId: string, studentId: string, pageNumber: number, userRole: Role) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    if (cls.teacherId !== teacherId && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw createError('Hanya pengajar kelas atau admin yang dapat menonaktifkan halaman santri.', 403, 'FORBIDDEN');
    }

    return await quranService.deactivateQuranPage(studentId, pageNumber);
  }

  /**
   * Teacher conducts tasmi' / murajaah review for student
   */
  async reviewStudentQuranPage(teacherId: string, classId: string, studentId: string, pageNumber: number, input: ReviewQuranPageInput, userRole: Role) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    if (cls.teacherId !== teacherId && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw createError('Hanya pengajar kelas atau admin yang dapat menyimak halaman santri.', 403, 'FORBIDDEN');
    }

    return await quranService.reviewQuranPage(studentId, pageNumber, input);
  }

  /**
   * Teacher conducts review for student's non-Quran book item card
   */
  async reviewStudentBookItem(
    teacherId: string,
    classId: string,
    studentId: string,
    itemId: string,
    rating: 1 | 2 | 3 | 4,
    userRole: Role,
    notes?: string
  ) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw createError('Kelas tidak ditemukan.', 404, 'CLASS_NOT_FOUND');
    if (cls.teacherId !== teacherId && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw createError('Hanya pengajar kelas atau admin yang dapat menyimak kartu materi santri.', 403, 'FORBIDDEN');
    }

    const cleanStudentId = studentId.replace(/^std-user-/, '').replace(/^user-/, '');
    let cleanItemId = itemId;
    if (cleanItemId.startsWith('class-item-')) {
      const parts = cleanItemId.split('-');
      if (parts.length >= 5) {
        cleanItemId = parts.slice(-5).join('-');
      }
    }

    return await learningService.submitReview(cleanItemId, cleanStudentId, rating);
  }
}

export const classService = new ClassService();
