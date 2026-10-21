import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  BookOpen,
  Trash2,
  Crown,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  adminUserApiService,
  AdminUserItem,
} from "../../services/adminUserApiService";

export const AdminUsersTab: React.FC = () => {
  const { language, userProfile } = useApp();

  // Users Directory State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userPlanFilter, setUserPlanFilter] = useState<string>("ALL");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AdminUserItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await adminUserApiService.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      setUpdatingUserId(targetUserId);
      await adminUserApiService.updateAdminUserRole(targetUserId, newRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId ? { ...u, role: newRole as any } : u,
        ),
      );
      setFeedbackMsg({
        text: `Role pengguna berhasil diubah menjadi ${newRole}.`,
        isError: false,
      });
    } catch (err: any) {
      setFeedbackMsg({
        text: err?.message || "Gagal memperbarui role pengguna.",
        isError: true,
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUpdatePlan = async (targetUserId: string, newPlan: string) => {
    try {
      setUpdatingUserId(targetUserId);
      await adminUserApiService.updateAdminUserPlan(targetUserId, newPlan);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId ? { ...u, plan: newPlan as any } : u,
        ),
      );
      setFeedbackMsg({
        text: `Paket pengguna berhasil diubah menjadi ${newPlan}.`,
        isError: false,
      });
    } catch (err: any) {
      setFeedbackMsg({
        text: err?.message || "Gagal memperbarui paket pengguna.",
        isError: true,
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (targetUser: AdminUserItem) => {
    try {
      setUpdatingUserId(targetUser.id);
      const res = await adminUserApiService.deleteAdminUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      setConfirmDeleteUser(null);
      setFeedbackMsg({
        text: res.message || `Akun pengguna ${targetUser.fullName || targetUser.email} berhasil dihapus.`,
        isError: false,
      });
    } catch (err: any) {
      setFeedbackMsg({
        text: err?.message || "Gagal menghapus pengguna.",
        isError: true,
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || "")
        .toLowerCase()
        .includes(userSearchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.quranSpaceCode || "")
        .toLowerCase()
        .includes(userSearchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (userRoleFilter !== "ALL" && u.role.toUpperCase() !== userRoleFilter.toUpperCase()) return false;
    if (userPlanFilter !== "ALL" && u.plan.toUpperCase() !== userPlanFilter.toUpperCase()) return false;
    return true;
  });

  const totalUsers = users.length;
  const regularUsersCount = users.filter((u) => u.role === "USER").length;
  const adminUsersCount = users.filter(
    (u) => u.role === "ADMIN" || u.role === "SUPERADMIN",
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all ${
            feedbackMsg.isError
              ? "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.isError ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="clay-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl clay-icon-pod-orange text-white flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8]">
              Total Pengguna
            </p>
            <p className="text-lg font-black text-[#18234A] dark:text-[#F8FAFC]">
              {totalUsers}
            </p>
          </div>
        </div>

        <div className="clay-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8]">
              Akun Pengguna (User)
            </p>
            <p className="text-lg font-black text-[#18234A] dark:text-[#F8FAFC]">
              {regularUsersCount}
            </p>
          </div>
        </div>

        <div className="clay-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#687086] dark:text-[#94A3B8]">
              Admin & Super Admin
            </p>
            <p className="text-lg font-black text-[#18234A] dark:text-[#F8FAFC]">
              {adminUsersCount}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, email, atau kode Al-Qur'an..."
            className="w-full pl-10 pr-4 py-2.5 clay-inset rounded-2xl text-xs sm:text-sm text-[#18234A] dark:text-[#F8FAFC] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3 py-2 clay-pill rounded-xl text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Role</option>
              <option value="USER">User (Pengguna Biasa)</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN">Super Admin</option>
            </select>
          </div>

          {/* Plan Filter */}
          <select
            value={userPlanFilter}
            onChange={(e) => setUserPlanFilter(e.target.value)}
            className="px-3 py-2 clay-pill rounded-xl text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Paket</option>
            <option value="FREE">FREE</option>
            <option value="PREMIUM">PREMIUM</option>
            <option value="INSTITUTIONAL">INSTITUTIONAL</option>
          </select>

          <button
            onClick={loadUsers}
            className="px-3 py-2 clay-pill rounded-xl text-xs font-bold text-[#F27A3D] hover:bg-orange-500/10 cursor-pointer flex items-center gap-1.5"
            title="Segarkan daftar pengguna"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Users List */}
      {usersLoading ? (
        <div className="py-16 text-center text-[#687086] dark:text-[#94A3B8] flex flex-col items-center gap-2.5">
          <RefreshCw className="w-6 h-6 animate-spin text-[#F27A3D]" />
          <p className="text-xs font-semibold">Memuat direktori pengguna...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="clay-card p-10 rounded-3xl text-center space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-[#687086] dark:text-[#94A3B8]">
            Tidak ada pengguna yang cocok dengan pencarian.
          </p>
        </div>
      ) : (
        <div className="clay-card rounded-3xl overflow-hidden divide-y divide-black/5 dark:divide-white/5">
          {filteredUsers.map((user) => {
            const isCurrent = user.id === userProfile.id;
            const isBusy = updatingUserId === user.id;

            return (
              <div
                key={user.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* User Identity */}
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      user.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    }
                    alt={user.fullName || "User"}
                    className="w-11 h-11 rounded-full object-cover border border-black/10 dark:border-white/10 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#18234A] dark:text-[#F8FAFC]">
                        {user.fullName || "Tanpa Nama"}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-[#F27A3D]">
                          Anda
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {user.quranSpaceCode}
                      </span>
                    </div>
                    <p className="text-xs text-[#687086] dark:text-[#94A3B8]">
                      {user.email || "Tanpa Email"} • Bergabung:{" "}
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>

                {/* Meta stats & Controls */}
                <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
                  <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-[#687086] dark:text-[#94A3B8]">
                    <span title="Buku pribadi dibuat">
                      📚 {user._count?.books || 0} Buku
                    </span>
                    <span title="Kelas yang dibuat/diajar">
                      👨‍🏫 {user._count?.teachingClasses || 0} Kelas
                    </span>
                  </div>

                  {/* Plan Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#687086] dark:text-[#94A3B8]">
                      Paket:
                    </span>
                    <select
                      disabled={isBusy}
                      value={user.plan}
                      onChange={(e) => handleUpdatePlan(user.id, e.target.value)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer ${
                        user.plan === "PREMIUM"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                          : user.plan === "INSTITUTIONAL"
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <option value="FREE">FREE</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="INSTITUTIONAL">INSTITUTIONAL</option>
                    </select>
                  </div>

                  {/* Role Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#687086] dark:text-[#94A3B8]">
                      Role:
                    </span>
                    <select
                      disabled={
                        isBusy || (isCurrent && user.role === "SUPERADMIN")
                      }
                      value={user.role}
                      onChange={(e) =>
                        handleUpdateRole(user.id, e.target.value)
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer ${
                        user.role === "ADMIN" || user.role === "SUPERADMIN"
                          ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  </div>

                  {/* Delete User Button */}
                  {!isCurrent && (
                    <button
                      onClick={() => setConfirmDeleteUser(user)}
                      disabled={isBusy}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Hapus akun pengguna ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {isBusy && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F27A3D]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {confirmDeleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setConfirmDeleteUser(null)}
        >
          <div
            className="clay-card rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#18234A] dark:text-[#F8FAFC]">
                Hapus Akun Pengguna?
              </h3>
              <p className="text-xs text-[#687086] dark:text-[#94A3B8] leading-relaxed">
                Anda akan menghapus akun{" "}
                <strong className="text-rose-600 dark:text-rose-400">
                  {confirmDeleteUser.fullName || confirmDeleteUser.email}
                </strong>{" "}
                secara permanen dari Unlupa. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 py-2.5 px-4 rounded-xl clay-pill text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDeleteUser)}
                disabled={updatingUserId === confirmDeleteUser.id}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-bold cursor-pointer hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {updatingUserId === confirmDeleteUser.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Hapus Pengguna</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

