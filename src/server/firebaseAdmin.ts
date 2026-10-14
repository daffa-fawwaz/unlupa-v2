import * as adminApp from 'firebase-admin/app';
import * as adminAuth from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';
import { env } from './env';

let appInstance: adminApp.App | null = null;
let resolvedProjectId: string | null = null;

/**
 * Resolve Firebase Project ID from environment variables or fallback configuration file
 */
export function getFirebaseProjectId(): string | null {
  if (resolvedProjectId) return resolvedProjectId;

  // 1. Check environment variables
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PROJECT_ID.trim()) {
    resolvedProjectId = env.FIREBASE_PROJECT_ID.trim();
    return resolvedProjectId;
  }

  if (env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_PROJECT_ID.trim()) {
    resolvedProjectId = env.VITE_FIREBASE_PROJECT_ID.trim();
    return resolvedProjectId;
  }

  // 2. Check local fallback configuration file (firebase-applet-config.json)
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const fileData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (fileData?.projectId && typeof fileData.projectId === 'string') {
        resolvedProjectId = fileData.projectId.trim();
        return resolvedProjectId;
      }
    }
  } catch (err) {
    console.warn('[FirebaseAdmin] Notice reading fallback config file:', (err as Error)?.message);
  }

  return null;
}

/**
 * Initialize or retrieve the Firebase Admin App singleton instance.
 */
export function getFirebaseAdminApp(): adminApp.App {
  if (appInstance) return appInstance;

  const existingApps = adminApp.getApps();
  if (existingApps.length > 0) {
    appInstance = existingApps[0];
    return appInstance;
  }

  const projectId = getFirebaseProjectId();
  if (!projectId) {
    throw new Error('Firebase Project ID could not be resolved from environment or configuration file.');
  }

  const appOptions: adminApp.AppOptions = {
    projectId: projectId,
  };

  // Check optional service account key path from standard Google env var
  const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (googleCredsPath && fs.existsSync(googleCredsPath)) {
    try {
      appOptions.credential = adminApp.cert(googleCredsPath);
    } catch (certError) {
      console.warn('[FirebaseAdmin] Failed to load custom credentials file, using default credential flow:', (certError as Error)?.message);
    }
  }

  appInstance = adminApp.initializeApp(appOptions);
  return appInstance;
}

/**
 * Retrieve the Firebase Auth service instance.
 */
export function getFirebaseAuth(): adminAuth.Auth {
  const app = getFirebaseAdminApp();
  return adminAuth.getAuth(app);
}

/**
 * Check whether Firebase Admin configuration is available.
 */
export function isFirebaseConfigured(): boolean {
  return !!getFirebaseProjectId();
}
