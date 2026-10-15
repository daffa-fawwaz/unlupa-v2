// Re-export backend authentication middleware for backward compatibility
export {
  authenticate,
  authenticate as requireAuth,
  requireRole,
} from "../server/middleware/auth";
