import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabaseStorageService } from '../services/supabaseStorageService';

export const uploadRouter = Router();

// Multer memory storage (files stored in memory buffer for fast direct upload to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan (JPG, PNG, WebP, GIF, SVG).'));
    }
  },
});

/**
 * Handle single image upload via multipart/form-data OR base64 JSON payload
 * POST /api/v1/upload/image
 */
uploadRouter.post(
  '/upload/image',
  (req: Request, res: Response, next: NextFunction) => {
    // If request is multipart/form-data, process with multer
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'image', maxCount: 1 },
      ])(req, res, (err: any) => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Ukuran file gambar melebihi batas maksimal 3MB.' });
          }
          return res.status(400).json({ error: err.message || 'Gagal memproses file unggahan.' });
        }
        next();
      });
    } else {
      // JSON body parser handles base64
      next();
    }
  },
  async (req: Request, res: Response) => {
    try {
      if (!supabaseStorageService.isConfigured()) {
        return res.status(503).json({
          error: 'Supabase Storage belum dikonfigurasi. Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY tersedia di .env.',
        });
      }

      const folder = (req.body.folder || (req.query.folder as string) || 'images') as string;

      // Case 1: Multipart file upload
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedFile = req.file || files?.file?.[0] || files?.image?.[0];

      if (uploadedFile) {
        const result = await supabaseStorageService.uploadImageBuffer(
          uploadedFile.buffer,
          uploadedFile.originalname,
          uploadedFile.mimetype,
          folder
        );

        return res.status(200).json({
          success: true,
          url: result.url,
          path: result.path,
          size: result.size,
          mimeType: result.mimeType,
        });
      }

      // Case 2: Base64 or Data URI string in JSON body
      const imagePayload = req.body.image || req.body.base64 || req.body.data;
      if (typeof imagePayload === 'string' && imagePayload.trim()) {
        const approxSize = (imagePayload.length * 3) / 4;
        if (approxSize > 3 * 1024 * 1024) {
          return res.status(400).json({ error: 'Ukuran file gambar melebihi batas maksimal 3MB.' });
        }
        const filename = (req.body.filename as string) || 'image.jpg';
        const result = await supabaseStorageService.uploadImageBase64(
          imagePayload,
          filename,
          folder
        );

        return res.status(200).json({
          success: true,
          url: result.url,
          path: result.path,
          size: result.size,
          mimeType: result.mimeType,
        });
      }

      return res.status(400).json({
        error: 'Tidak ada file gambar yang dikirimkan. Gunakan form-data dengan field "file" / "image" atau JSON body { image: "<base64>" }.',
      });
    } catch (err: any) {
      console.error('[UploadRoute] Error uploading image to Supabase:', err);
      return res.status(500).json({
        error: err.message || 'Terjadi kesalahan saat mengunggah gambar ke Supabase Storage.',
      });
    }
  }
);
