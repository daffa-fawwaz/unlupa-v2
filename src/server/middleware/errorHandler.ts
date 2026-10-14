import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function createError(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: any): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  err.details = details;
  return err;
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers have already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data request tidak valid.',
        details: formattedIssues,
      },
    });
    return;
  }

  // 2. Prisma Known Request Error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : String(err.meta?.target || 'data');
      res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `Duplikasi data: ${target} sudah terdaftar.`,
          details: { target: err.meta?.target },
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Data tidak ditemukan.',
        },
      });
      return;
    }
  }

  // 3. Custom AppError
  if (err.statusCode && typeof err.statusCode === 'number') {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'API_ERROR',
        message: err.message || 'Terjadi kesalahan.',
        details: err.details,
      },
    });
    return;
  }

  // 4. Default Internal Server Error
  console.error('[API Error]:', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? (err?.message || 'Internal server error') : 'Terjadi kesalahan internal pada server.',
      ...(isDev && err?.stack ? { stack: err.stack } : {}),
    },
  });
}
