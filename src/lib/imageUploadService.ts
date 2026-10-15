import { getAuthToken } from "./api";

interface UploadOptions {
  folder?: "covers" | "cards" | "classes" | "pages" | string;
  maxWidth?: number;
  quality?: number;
}

/**
 * Compresses an image file locally using an offscreen canvas to optimize upload speed and storage usage.
 */
function compressImageToBlob(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.82,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If it's an SVG or already tiny, don't re-compress
    if (file.type === "image/svg+xml" || file.size < 50 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format file gambar tidak valid."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Fill background white in case of transparent PNG/JPEG conversion
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality,
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const MAX_IMAGE_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

/**
 * Uploads an image File to Supabase Storage via /api/v1/upload/image
 * Returns the public CDN URL from Supabase Storage.
 */
export async function uploadImageFile(
  file: File,
  options?: UploadOptions,
): Promise<string> {
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error("Ukuran file gambar melebihi batas maksimal 3MB.");
  }

  const folder = options?.folder || "images";
  const maxWidth = options?.maxWidth || 1200;
  const quality = options?.quality || 0.82;

  // 1. Optimize image before upload
  let blobToUpload: Blob;
  try {
    blobToUpload = await compressImageToBlob(file, maxWidth, quality);
  } catch (err) {
    console.warn("[ImageUpload] Compression error, using original file:", err);
    blobToUpload = file;
  }

  // 2. Prepare FormData
  const formData = new FormData();
  const filename = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
  formData.append("file", blobToUpload, filename);
  formData.append("folder", folder);

  // 3. Send upload request to backend
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/v1/upload/image", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.error || `Upload gagal dengan kode status ${response.status}`;
    console.error("[ImageUpload] Server returned error:", message);
    throw new Error(message);
  }

  const result = await response.json();
  if (!result.success || !result.url) {
    throw new Error(
      "Respon upload dari server tidak memuat URL publik Supabase.",
    );
  }

  return result.url;
}

/**
 * Uploads a base64 / data URL string to Supabase Storage
 */
export async function uploadImageBase64(
  base64Data: string,
  options?: { folder?: string; filename?: string },
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/v1/upload/image", {
    method: "POST",
    headers,
    body: JSON.stringify({
      image: base64Data,
      folder: options?.folder || "images",
      filename: options?.filename || "image.jpg",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `Upload base64 gagal dengan kode status ${response.status}`,
    );
  }

  const result = await response.json();
  if (!result.success || !result.url) {
    throw new Error(
      "Respon upload dari server tidak memuat URL publik Supabase.",
    );
  }

  return result.url;
}
