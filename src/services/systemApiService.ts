import { api } from '../lib/api';
import { SystemTierConfig } from '../types';

export const systemApiService = {
  /**
   * Mengambil konfigurasi batasan akun (tier config) aktif dari server
   */
  async getTierConfig(): Promise<SystemTierConfig | null> {
    try {
      const res = await api.get<{ success: boolean; data: SystemTierConfig }>('/api/v1/system/tier-config');
      if (res && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.warn('[SystemAPI] Gagal mengambil konfigurasi tier dari server:', err);
      return null;
    }
  },

  /**
   * Menyimpan pembaruan konfigurasi batasan akun ke server (Khusus Admin/Superadmin)
   */
  async updateTierConfig(newConfig: Partial<SystemTierConfig>): Promise<SystemTierConfig> {
    const res = await api.put<{ success: boolean; message: string; data: SystemTierConfig }>(
      '/api/v1/system/tier-config',
      newConfig
    );
    if (!res || !res.data) {
      throw new Error('Gagal memperbarui konfigurasi batasan tier di server.');
    }
    return res.data;
  },
};
