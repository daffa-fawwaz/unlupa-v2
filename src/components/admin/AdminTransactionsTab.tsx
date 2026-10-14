import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookTransaction, PaymentMethod, TransactionStatus } from '../../types';
import { 
  ReceiptText, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  QrCode, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Send,
  ExternalLink
} from 'lucide-react';

export const AdminTransactionsTab: React.FC = () => {
  const { transactions, language, userProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending'>('all');
  const [selectedTx, setSelectedTx] = useState<BookTransaction | null>(null);
  const [disbursedAuthors, setDisbursedAuthors] = useState<Set<string>>(new Set());

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Metrics Calculation
  const successfulTx = transactions.filter(t => t.status === 'success');
  const totalGMV = successfulTx.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPlatformRevenue = successfulTx.reduce((sum, t) => sum + (t.platformFee || 0), 0);
  const totalAuthorRoyalties = successfulTx.reduce((sum, t) => sum + (t.authorRoyalty || 0), 0);

  // Author Royalties Breakdown
  const authorEarningsMap = new Map<string, { name: string; totalSales: number; totalEarnings: number; transactionsCount: number }>();
  successfulTx.forEach(t => {
    if (t.type === 'book_purchase') {
      const authorKey = t.authorName || 'Kurator Komunitas';
      const existing = authorEarningsMap.get(authorKey) || { name: authorKey, totalSales: 0, totalEarnings: 0, transactionsCount: 0 };
      existing.totalSales += t.amount || 0;
      existing.totalEarnings += t.authorRoyalty || 0;
      existing.transactionsCount += 1;
      authorEarningsMap.set(authorKey, existing);
    }
  });

  const authorEarningsList = Array.from(authorEarningsMap.values());

  // Filtered Transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      (t.id || '').toLowerCase().includes(q) ||
      (t.bookTitle || '').toLowerCase().includes(q) ||
      (t.userName || '').toLowerCase().includes(q) ||
      (t.userEmail || '').toLowerCase().includes(q) ||
      (t.authorName || '').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const handleDisburseRoyalty = (authorName: string) => {
    setDisbursedAuthors(prev => new Set(prev).add(authorName));
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'qris': return <QrCode className="w-3.5 h-3.5 text-indigo-500" />;
      case 'bca_va':
      case 'mandiri_va':
      case 'bri_va': return <Building2 className="w-3.5 h-3.5 text-blue-500" />;
      case 'gopay':
      case 'shopeepay': return <Wallet className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <CreditCard className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Gross Merchandise (GMV)</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {formatIDR(totalGMV)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{successfulTx.length} Transaksi Terverifikasi</span>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pendapatan Platform (15%)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatIDR(totalPlatformRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Biaya pemeliharaan & infrastruktur
          </div>
        </div>

        {/* Author Royalties Disbursed */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Royalti Penulis (85%)</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatIDR(totalAuthorRoyalties)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Hak kreator & lembaga kurasi kitab
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Tingkat Kelunasan</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {transactions.length > 0 ? Math.round((successfulTx.length / transactions.length) * 100) : 100}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Instant settlement via QRIS & VA
          </div>
        </div>
      </div>

      {/* Author Royalties Disbursement Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Bagi Hasil & Royalti Penulis Kitab
            </h3>
            <p className="text-xs text-slate-500">
              Rekapitulasi penjualan karya kurasi dan penyaluran bagi hasil kepada ustadz/lembaga
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            {authorEarningsList.length} Penulis Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Nama Penulis / Lembaga</th>
                <th className="px-5 py-3">Volume Penjualan</th>
                <th className="px-5 py-3">Bagi Hasil Penulis (85%)</th>
                <th className="px-5 py-3">Status Pencairan</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {authorEarningsList.length > 0 ? (
                authorEarningsList.map((author, idx) => {
                  const isDisbursed = disbursedAuthors.has(author.name);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {author.name}
                        <span className="block text-[11px] font-normal text-slate-500">
                          {author.transactionsCount} eksemplar terjual
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        {formatIDR(author.totalSales)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatIDR(author.totalEarnings)}
                      </td>
                      <td className="px-5 py-3.5">
                        {isDisbursed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Tersalurkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Siap Dicairkan
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={isDisbursed}
                          onClick={() => handleDisburseRoyalty(author.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                            isDisbursed
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isDisbursed ? 'Sudah Ditransfer' : 'Kirim Royalti'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                    Belum ada data penjualan kitab berbayar saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs space-y-4 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Buku Kas & Log Transaksi Sistem
            </h3>
            <p className="text-xs text-slate-500">
              Audit menyeluruh setiap pembayaran, metode gateway, dan pembagian royalti
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('success')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'success'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Lunas ({successfulTx.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari invoice / pembeli..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">No. Invoice</th>
                <th className="px-4 py-3">Pembeli</th>
                <th className="px-4 py-3">Item / Layanan</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Royalti (85%)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {tx.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{tx.userName}</div>
                      <div className="text-[10px] text-slate-400">{tx.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{tx.bookTitle}</div>
                      <div className="text-[10px] text-slate-400">{tx.authorName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 uppercase font-semibold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {getPaymentIcon(tx.paymentMethod)}
                        <span>{tx.paymentMethod.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {formatIDR(tx.amount)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatIDR(tx.authorRoyalty)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Lunas
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(tx.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    Tidak ada catatan transaksi yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
