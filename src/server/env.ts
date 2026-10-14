import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for database operations'),
  APP_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  BOOTSTRAP_ADMIN_EMAILS: z.string().optional().default(''),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('unlupa-development-jwt-secret-min-32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().optional().default('unlupa-storage'),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Only print variable names that failed validation, never print values or secrets
    const invalidVars = error.issues.map((i) => i.path.join('.')).join(', ');
    
    if (process.env.NODE_ENV === 'production') {
      console.error(`[Fatal] Production startup aborted: Invalid or missing environment variable(s): ${invalidVars}`);
      process.exit(1);
    } else {
      console.warn(`[Config Notice] Environment validation issue for variable(s): ${invalidVars}`);
      if (!process.env.DATABASE_URL) {
        console.error('[Config Error] DATABASE_URL is not set. Database connections will not function until DATABASE_URL is configured in .env.');
      }
    }
  }

  // Safe fallback for development/test environment
  parsedEnv = {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    DATABASE_URL: process.env.DATABASE_URL || '',
    APP_URL: process.env.APP_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
    BOOTSTRAP_ADMIN_EMAILS: process.env.BOOTSTRAP_ADMIN_EMAILS || '',
    JWT_SECRET: process.env.JWT_SECRET || 'unlupa-development-jwt-secret-min-32chars',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || 'unlupa-storage',
  };
}

export const env = parsedEnv;
