import { api } from '../lib/api';
import { LeaderboardUserEntry } from '../types';

export const leaderboardApiService = {
  /**
   * Mengambil daftar peringkat global seluruh pengguna Unlupa yang diurutkan berdasarkan akumulasi XP
   */
  async getGlobalLeaderboard(): Promise<LeaderboardUserEntry[]> {
    try {
      const res = await api.get<{ success: boolean; data: LeaderboardUserEntry[]; totalUsers: number }>('/api/v1/leaderboard');
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (err) {
      console.warn('[LeaderboardAPI] Gagal mengambil peringkat dari server:', err);
      return [];
    }
  },
};
