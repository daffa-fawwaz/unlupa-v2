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

  /**
   * Admin updates a user's plan directly (FREE, PREMIUM, INSTITUTIONAL)
   */
  async updateAdminUserPlan(id: string, plan: string): Promise<{ id: string; plan: string }> {
    const res = await api.patch<{ id: string; plan: string }>(`/api/v1/admin/users/${id}/plan`, {
      plan,
    });
    return res.data;
  },

  /**
   * Admin deletes a user account permanently
   */
  async deleteAdminUser(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/v1/admin/users/${id}`);
    return {
      success: true,
      message: res.message || 'Pengguna berhasil dihapus.',
    };
  },
};

