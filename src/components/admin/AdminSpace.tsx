import React, { useState } from "react";
import {
  Users,
  DollarSign,
  BookOpen,
  ShieldAlert,
  Activity,
  TrendingUp,
  CreditCard,
  Sliders,
  Compass,
  UserCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { SystemLimitsConfigTab } from "./SystemLimitsConfigTab";
import { AdminTransactionsTab } from "./AdminTransactionsTab";
import { AdminRoadmapTab } from "./AdminRoadmapTab";
import { AdminUsersTab } from "./AdminUsersTab";
import { AdminBooksTab } from "./AdminBooksTab";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { soundEffects } from "../../lib/soundFeedback";

export const AdminSpace: React.FC = () => {
  const { language, transactions, setActiveSpace } = useApp();
  const [activeTab, setActiveTab] = useState<
    "books" | "users" | "overview" | "limits" | "transactions" | "roadmap"
  >("books");

  useSwipeGesture(null, {
    onSwipeRight: () => {
      soundEffects.playCardFlip("backward");
      setActiveSpace("leaderboard");
    },
    threshold: 40,
    minRatio: 1.15,
  });

  const totalRevenue = transactions.reduce(
    (acc, curr) => acc + (curr.amount || 0),
    0,
  );
  const totalRoyalties = transactions.reduce(
    (acc, curr) => acc + (curr.authorRoyalty || 0),
    0,
  );
  const totalSalesCount = transactions.length;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const stats = [
    {
      title:
        language === "en"
          ? "Gross Platform Revenue"
          : "Total Omset Marketplace",
      value: formatIDR(totalRevenue),
      change: "+28.4%",
      icon: <DollarSign className="w-5 h-5 text-white" />,
      podClass: "clay-icon-pod-orange",
    },
    {
      title:
        language === "en"
          ? "Platform Share (15%)"
          : "Pendapatan Bersih Platform",
      value: formatIDR(totalRevenue - totalRoyalties),
      change: "+18.2%",
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      podClass: "clay-icon-pod-orange",
    },
    {
      title:
        language === "en" ? "Creator Royalties (85%)" : "Hak Royalti Penulis",
      value: formatIDR(totalRoyalties),
      change: "+14.8%",
      icon: <UserCheck className="w-5 h-5 text-white" />,
      podClass: "clay-icon-pod-orange",
    },
    {
      title:
        language === "en" ? "Completed Book Purchases" : "Buku Terbeli & Aktif",
      value: `${totalSalesCount} Kitab`,
      change: "+24.5%",
      icon: <BookOpen className="w-5 h-5 text-[#F27A3D]" />,
      podClass: "clay-icon-pod-neutral",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18234A] dark:text-[#F8FAFC] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span>{language === "en" ? "Super Admin" : "Super Admin"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#687086] dark:text-[#94A3B8] font-medium mt-1">
            {language === "en"
              ? "Manage platform, users, revenues, and royalties."
              : "Kelola platform, pengguna, pendapatan, dan royalti."}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          {
            id: "books",
            labelEn: "Public Library Books",
            labelId: "Buku Publik",
            icon: <BookOpen className="w-4 h-4" />,
          },
          {
            id: "users",
            labelEn: "Users & Roles",
            labelId: "Pengguna & Role",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "overview",
            labelEn: "Overview",
            labelId: "Ringkasan",
            icon: <Activity className="w-4 h-4" />,
          },
          {
            id: "transactions",
            labelEn: "Transactions & Marketplace",
            labelId: "Transaksi & Marketplace",
            icon: <CreditCard className="w-4 h-4" />,
          },
          {
            id: "limits",
            labelEn: "Tier & Feature Limits",
            labelId: "Batas Fitur & Paket",
            icon: <Sliders className="w-4 h-4" />,
          },
          {
            id: "roadmap",
            labelEn: "Development Roadmap",
            labelId: "Roadmap Pengembangan",
            icon: <Compass className="w-4 h-4 text-[#F27A3D]" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === tab.id
                ? "clay-btn-primary"
                : "clay-pill text-[#687086] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-[#F8FAFC]"
            }`}
          >
            {tab.icon}
            {language === "en" ? tab.labelEn : tab.labelId}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "books" && <AdminBooksTab />}

      {activeTab === "limits" && <SystemLimitsConfigTab />}

      {activeTab === "transactions" && <AdminTransactionsTab />}

      {activeTab === "roadmap" && <AdminRoadmapTab />}

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="clay-card p-5 rounded-3xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${stat.podClass}`}
                  >
                    {stat.icon}
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-[#687086] dark:text-[#94A3B8] text-xs font-bold uppercase tracking-wider">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-[#18234A] dark:text-[#F8FAFC] mt-1">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions List */}
            <div className="clay-card p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#18234A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#F27A3D]" />
                  <span>
                    {language === "en"
                      ? "Recent Transactions"
                      : "Transaksi Terakhir"}
                  </span>
                </h3>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="text-xs font-bold text-[#F27A3D] hover:underline cursor-pointer"
                >
                  {language === "en" ? "View All" : "Lihat Semua"} →
                </button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="clay-card-subtle flex items-center justify-between p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center text-white font-bold text-xs shrink-0">
                        IDR
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] line-clamp-1">
                          {tx.bookTitle}
                        </p>
                        <p className="text-[11px] text-[#687086] dark:text-[#94A3B8] font-medium">
                          {tx.userName} • {tx.id}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      +{formatIDR(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Author Royalties Summary */}
            <div className="clay-card p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#18234A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#F27A3D]" />
                  <span>
                    {language === "en"
                      ? "Author Royalties (85%)"
                      : "Distribusi Royalti Penulis"}
                  </span>
                </h3>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="text-xs font-bold text-[#F27A3D] hover:underline cursor-pointer"
                >
                  {language === "en" ? "Manage" : "Kelola"} →
                </button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((tx) => (
                  <div
                    key={tx.id}
                    className="clay-card-subtle flex items-center justify-between p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center text-white shrink-0">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#18234A] dark:text-[#F8FAFC] line-clamp-1">
                          {tx.authorName}
                        </p>
                        <p className="text-[11px] text-[#687086] dark:text-[#94A3B8] font-medium">
                          {tx.bookTitle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-[#F27A3D] block">
                        {formatIDR(tx.authorRoyalty)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Telah Ditransfer
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && <AdminUsersTab />}
    </div>
  );
};
