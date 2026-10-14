import { api } from '../lib/api';

export interface AdminUserItem {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  quranSpaceCode: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  plan: 'FREE' | 'PREMIUM' | 'INSTITUTIONAL';
  createdAt: string;
  _count?: {
    teachingClasses: number;
    classMemberships: number;
    books: number;
  };
}

export const adminUserApiService = {
  /**
   * Admin retrieves directory of all registered users
   */
  async getAdminUsers(): Promise<AdminUserItem[]> {
    const res = await api.get<AdminUserItem[]>('/api/v1/admin/users');
    return res.data || [];
  },

  /**
   * Admin updates a user's role directly (USER, ADMIN, SUPERADMIN)
   */
  async updateAdminUserRole(id: string, role: string): Promise<{ id: string; role: string }> {
    const res = await api.patch<{ id: string; role: string }>(`/api/v1/admin/users/${id}/role`, {
      role,
    });
    return res.data;
  },
};
