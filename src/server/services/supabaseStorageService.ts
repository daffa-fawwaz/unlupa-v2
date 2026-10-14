import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import path from 'path';
import { env } from '../env';

export class SupabaseStorageService {
  private client: SupabaseClient | null = null;
  private bucketName: string;
  private bucketChecked = false;

  constructor() {
    this.bucketName = env.SUPABASE_BUCKET || 'unlupa-storage';
  }

  public isConfigured(): boolean {
    return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      if (!this.isConfigured()) {
        throw new Error('Supabase Storage is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.');
      }
      this.client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
    return this.client;
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketChecked) return;
    try {
      const supabase = this.getClient();
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (!listError && buckets) {
        const exists = buckets.some(b => b.name === this.bucketName);
        if (!exists) {
          console.log(`[Supabase Storage] Bucket '${this.bucketName}' not found. Creating public bucket...`);
          await supabase.storage.createBucket(this.bucketName, {
            public: true,
            fileSizeLimit: 25 * 1024 * 1024, // 25MB
          });
        }
      }
      this.bucketChecked = true;
    } catch (err) {
      console.warn('[Supabase Storage] Notice checking bucket (non-fatal):', err);
      this.bucketChecked = true;
    }
  }

  /**
   * Determine file extension and MIME type
   */
  private getExtensionFromMime(mimeType: string, filename?: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/avif': 'avif',
    };

    if (mimeMap[mimeType.toLowerCase()]) {
      return mimeMap[mimeType.toLowerCase()];
    }

    if (filename) {
      const ext = path.extname(filename).replace('.', '').toLowerCase();
      if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(ext)) {
        return ext;
      }
    }

    return 'webp';
  }

  /**
   * Upload an image buffer to Supabase Storage
   */
  public async uploadImageBuffer(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    folder: string = 'images'
  ): Promise<{ url: string; path: string; size: number; mimeType: string }> {
    await this.ensureBucket();
    const supabase = this.getClient();

    const cleanFolder = folder.replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/^\/+|\/+$/g, '') || 'images';
    const ext = this.getExtensionFromMime(mimeType, originalFilename);
    const uniqueId = crypto.randomUUID().slice(0, 12);
    const timestamp = Date.now();
    const storagePath = `${cleanFolder}/${timestamp}-${uniqueId}.${ext}`;

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(storagePath, buffer, {
        contentType: mimeType || 'image/jpeg',
        cacheControl: '31536000', // 1 year cache
        upsert: true,
      });

    if (error) {
      console.error('[Supabase Storage] Upload error:', error);
      throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(storagePath);

    return {
      url: urlData.publicUrl,
      path: storagePath,
      size: buffer.length,
      mimeType,
    };
  }

  /**
   * Upload base64 / data-URI image to Supabase Storage
   */
  public async uploadImageBase64(
    base64Data: string,
    filename: string = 'upload',
    folder: string = 'images'
  ): Promise<{ url: string; path: string; size: number; mimeType: string }> {
    let cleanBase64 = base64Data;
    let mimeType = 'image/jpeg';

    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      cleanBase64 = matches[2];
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    return this.uploadImageBuffer(buffer, filename, mimeType, folder);
  }
}

export const supabaseStorageService = new SupabaseStorageService();
