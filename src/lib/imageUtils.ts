export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 600; // max dimension for book covers and flashcard images

        if (width > height) {
          if (width > max) {
            height = Math.round((height * max) / width);
            width = max;
          }
        } else {
          if (height > max) {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          // 0.72 quality JPEG produces great clarity while staying well within 40KB - 80KB
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

import { uploadImageFile, uploadImageBase64 } from './imageUploadService';
export { uploadImageFile, uploadImageBase64 };

/**
 * Upload image to Supabase Storage with local compression fallback.
 */
export async function uploadOrCompressImage(file: File, folder: string = 'images'): Promise<string> {
  if (file.size > 3 * 1024 * 1024) {
    throw new Error('Ukuran file gambar melebihi batas maksimal 3MB.');
  }

  try {
    return await uploadImageFile(file, { folder });
  } catch (err: any) {
    if (err?.message?.includes('3MB')) {
      throw err;
    }
    console.warn('[ImageUtils] Direct Supabase upload error, falling back to local compression:', err);
    return await compressImage(file);
  }
}
