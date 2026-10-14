# Unlupa.id - Panduan Arsitektur Sistem & Struktur Kode (Daleman Aplikasi)

Dokumen ini disusun untuk memudahkan pemahaman menyeluruh terhadap "jeroan" (daleman) teknis aplikasi Unlupa.id, baik pada bagian Front-End, Back-End, Database, Autentikasi, maupun Keamanan Akses (RBAC).

---

## 1. Peta Struktur Folder & Pengalokasian Data (Front-End & Full-Stack)

Aplikasi dibangun menggunakan arsitektur modular berbasis **React + TypeScript + Tailwind CSS** di sisi klien dan **Node.js Express** di sisi server. Setiap ruang fitur utama memiliki foldernya masing-masing:

```
unlupa.id/
├── server.ts                    # Backend Server: Express API, Health checks, AI Proxy
├── firestore.rules              # Aturan Keamanan Database Firestore (RBAC & Isolation)
├── firebase-blueprint.json      # Spesifikasi Skema Database Koleksi Firestore
├── firebase-applet-config.json  # Kredensial Konfigurasi Proyek Firebase
├── ARCHITECTURE.md              # Dokumentasi Jeroan Arsitektur Sistem
│
├── src/
│   ├── App.tsx                  # Root Container, Navigasi Utama, Proteksi Rute Admin
│   ├── main.tsx                 # Entry Point Klien (React DOM render)
│   ├── types.ts                 # Definisi Tipe Data Global (UserProfile, FSRS, Book, dsb)
│   │
│   ├── context/
│   │   └── AppContext.tsx       # State Manager Utama (Auth, Quran, Buku, Kelas, Kuota)
│   │
│   ├── components/              # Komponen Antarmuka yang Terbagi per Ruang Fitur:
│   │   ├── Navigation.tsx       # Baris Navigasi Bawah & Header (Beranda, Quran, Buku, Mengajar, Admin)
│   │   │
│   │   ├── home/                # [RUANG BERANDA]
│   │   │   ├── HomeSpace.tsx           # Tampilan Beranda & Statistik Pengguna
│   │   │   ├── SwipeableReviewQueue.tsx # Kartu Antrean Murajaah Harian Geser
│   │   │   └── index.ts                # Ekspor Publik Modul Beranda
│   │   │
│   │   ├── quran/               # [RUANG AL-QUR'AN]
│   │   │   ├── QuranSpace.tsx          # Halaman Utama Al-Qur'an
│   │   │   ├── QuranJuzBentoHero.tsx   # Dashboard Bento Hero Juz, Proyeksi Beban 7 Hari
│   │   │   ├── QuranJuzSpectrumMap.tsx # Peta Spektrum & Fitur Sapu Halaman (Collapsible)
│   │   │   ├── QuranPageCard.tsx       # Kartu Lembar Halaman Mushaf
│   │   │   ├── MushafPageViewerModal.tsx # Viewer Lembar Mushaf (Ramping & Pas Layar)
│   │   │   ├── QuranReviewModal.tsx    # Modal Uji Hafalan / Murajaah Halaman
│   │   │   ├── QuranPageFeedbackModal.tsx # Catatan Koreksi Tajwid & Evaluasi Ayat
│   │   │   ├── QuranReviewCalendarModal.tsx # Kalender Jadwal Murajaah Quran
│   │   │   └── index.ts                # Ekspor Publik Modul Al-Qur'an
│   │   │
│   │   ├── personal/            # [RUANG BUKU & KITAB]
│   │   │   ├── PersonalSpace.tsx       # Halaman Koleksi Kitab & Flashcard
│   │   │   ├── BookHeroCard.tsx        # Bento Hero Kitab & Switcher Jadwal 7 Hari
│   │   │   ├── BookReviewCalendarModal.tsx # Kalender Evaluasi Buku & Kitab
│   │   │   ├── BookFormModal.tsx       # Form Tambah/Ubah Kitab
│   │   │   ├── ItemFormModal.tsx       # Form Tambah/Ubah Kartu Flashcard
│   │   │   ├── PersonalReviewModal.tsx # Modal Review Flashcard (Uji Ingatan)
│   │   │   ├── PageEditorModal.tsx     # Editor Dokumen / Materi Blok Belajar
│   │   │   └── index.ts                # Ekspor Publik Modul Ruang Buku
│   │   │
│   │   ├── classes/             # [RUANG MENGAJAR / RUANG GURU]
│   │   │   ├── TeachingSpace.tsx       # Dasbor Pengajar & Manajemen Halaqah
│   │   │   ├── StudentDetailModal.tsx  # Pantauan Detil Hafalan Per Santri
│   │   │   ├── StudentProgressReportModal.tsx # Generator Rekap Rapor & WhatsApp Share
│   │   │   ├── PublicReportViewer.tsx  # Tampilan Cetak & Tautan Publik Rapor
│   │   │   └── index.ts                # Ekspor Publik Modul Mengajar
│   │   │
│   │   ├── admin/               # [RUANG ADMIN / SUPER ADMIN]
│   │   │   ├── AdminSpace.tsx          # Panel Kontrol Khusus Admin
│   │   │   ├── SystemLimitsConfigTab.tsx # Pengaturan Batas Kuota Paket (Free/Pro)
│   │   │   ├── AdminTransactionsTab.tsx  # Laporan Pembelian & Langganan
│   │   │   ├── AdminRoadmapTab.tsx     # Roadmap Pengembangan Sistem
│   │   │   └── index.ts                # Ekspor Publik Modul Admin
│   │   │
│   │   ├── auth/                # [AUTENTIKASI]
│   │   │   ├── AuthModal.tsx           # Modal Login Google 1-Klik
│   │   │   └── index.ts
│   │   │
│   │   ├── attendance/          # [ABSENSI & KEHADIRAN]
│   │   │   └── QuranAttendanceModal.tsx
│   │   │
│   │   └── common/              # [KOMPONEN BERSAMA]
│   │       ├── OfflineIndicator.tsx    # Notifikasi Status Koneksi Internet
│   │       ├── PWAInstallButton.tsx    # Tombol Pemasangan Aplikasi PWA
│   │       └── UpgradePlanModal.tsx    # Modal Upgrade Paket Layanan
│   │
│   ├── services/                # Layanan Bisnis & Kontrak Data
│   │   ├── authRbacService.ts          # Logika Penentuan Super Admin & Hak Akses
│   │   ├── classLifecycleService.ts    # Siklus Hidup Kelas & Penutupan Angkatan
│   │   └── index.ts
│   │
│   ├── lib/                     # Modul Utilitas Inti
│   │   ├── firebase.ts                 # Inisialisasi Firebase Client & Auth
│   │   ├── firestore-sync.ts           # Sinkronisasi Data Real-Time ke Firestore
│   │   ├── fsrs.ts                     # Implementasi Algoritma FSRS v6
│   │   ├── offlineStorage.ts           # Manajemen Cache Offline & Backup JSON
│   │   ├── AudioStorageService.ts      # Penyimpanan Audio Rekaman Suara
│   │   └── firestore-quota.ts          # Pelindung Kuota Baca/Tulis Harian
│   │
│   └── data/                    # Data Statis & Data Sampel Awal
│       ├── quranData.ts                # Metadata 604 Halaman & 114 Surah Al-Qur'an
│       ├── sampleBooks.ts              # Sampel Kitab Awal (Jurumiyah, Ushul Tsalatsah, dll)
│       └── sampleClasses.ts            # Sampel Halaqah Kelas
```

---

## 2. Arsitektur Back-End (`server.ts`)

Server berjalan menggunakan Node.js dan Express pada port `3000`:
1. **Health Check Probes**: Endpoint `/api/health`, `/health`, `/healthz` merespons status `200 OK` untuk memastikan kesiapan deployment di Google Cloud Run.
2. **Proxy AI Gemini**: Endpoint aman `/api/generate-cards` dan `/api/generate-book` untuk membangun materi kitab dan flashcard secara cerdas via `@google/genai` tanpa mengekspos API key ke browser pengguna.
3. **Pembersihan Cache Service Worker**: Menyediakan skrip pembersih otomatis agar pengguna selalu mendapatkan versi aplikasi terkini tanpa tertahan cache lawas.
4. **Vite Middleware Integration**: Pada mode pengembangan (development), server menjalankan middleware Vite untuk kompilasi modul instan. Pada mode produksi, server menyajikan berkas statis dari direktori `dist/`.

---

## 3. Sistem Autentikasi & Hak Akses (RBAC)

### A. Login Google Satu-Klik (Zero Password Friction)
Pengguna tidak perlu mengingat sandi rumit. Autentikasi dilakukan langsung menggunakan **Google Sign-In** melalui Firebase Auth (`loginWithGoogle`).

### B. Aturan Penentuan Super Admin Otomatis (Bootstrap Rule)
Untuk mempermudah pemilik aplikasi tanpa perlu pengaturan manual di console:
1. **Akun Pertama yang Login**: Akun Google pertama yang berhasil masuk ke aplikasi saat database masih kosong secara otomatis diangkat menjadi **Super Admin** (`role: 'superadmin'`). Sistem akan:
   - Mencatat UID dan email akun tersebut di dokumen Firestore `system_meta/auth_setup`.
   - Mendaftarkannya ke koleksi `admins/{uid}` dengan peran `superadmin`.
   - Mengaktifkan status admin lokal di browser (`localStorage.getItem('unlupa_is_admin') === 'true'`).
2. **Akun Default Terdaftar**: Email `admin@anlupa.id` dan pemilik akun developer selalu memiliki status Super Admin secara bawaan.
3. **Pengguna Setelahnya**: Semua akun Google yang mendaftar atau login setelahnya secara otomatis mendapatkan peran **User Biasa** (`role: 'user'`).

### C. Pembatasan Menu Navigasi Bawah
- **User Biasa**: Hanya melihat 4 menu utama:
  1. 🏠 **Beranda**
  2. 📖 **Al-Qur'an**
  3. 📚 **Ruang Buku**
  4. 👥 **Mengajar**
  *(Menu Admin tidak ditampilkan sama sekali)*.
- **Admin & Super Admin**: Mendapatkan menu tambahan ke-5 yaitu 🛡️ **Admin** di baris navigasi, yang memberikan akses penuh ke pengelolaan limit kuota sistem, riwayat transaksi, dan manajemen pengguna.
- **Proteksi Rute Klien (`App.tsx`)**: Jika ada pengguna non-admin yang mencoba mengakses ruang admin secara paksa, sistem secara otomatis mengalihkannya kembali ke Beranda (`dashboard`).

---

## 4. Keamanan Database Firestore (`firestore.rules`)

Aturan keamanan Firestore dirancang dengan prinsip *least privilege* (hak akses seminimal mungkin):
- `users/{userId}`: Pengguna hanya dapat membaca dan memperbarui profil mereka sendiri. Perubahan peran (`role`) atau paket (`plan`) dikunci agar tidak dapat ditingkatkan secara sepihak oleh pengguna biasa.
- `books/{bookId}` & sub-koleksinya: Buku privat hanya dapat diakses oleh pemiliknya; buku publik dapat dibaca oleh seluruh pengguna terdaftar.
- `classes/{classId}`: Hanya guru pemilik kelas yang dapat mengedit kelas atau mengelola data santri.
- `system_meta/auth_setup`: Hanya dapat dibuat sekali oleh user pertama (bootstrap), dan setelah itu hanya dapat diperbarui oleh Super Admin atau `admin@anlupa.id`.
- `admins/{adminId}`: Hanya dapat dikelola oleh Super Admin.

---

## 5. Optimalisasi Halaman Al-Qur'an & Fitur Sapu Halaman

1. **Peta Spektrum Halaman Tergulung (Collapsible)**:
   - Baris sapu halaman 1–20 sekarang **tersembunyi/tergulung secara default**.
   - Yang nampak di awal hanyalah baris ringkas: `[ Semua ▾ ] [ Hal 1-5 ] [ Hal 6-10 ] [ Hal 11-15 ] [ Hal 16-20 ] [ 📥 ]`.
   - Mengklik tombol **"Semua"** akan membuka/menggulung petak 20 halaman secara mulus.
   - Peta menggunakan `touch-pan-y` sehingga gestur geser jari pengguna untuk *scroll* vertikal ke bawah tidak akan tersenggol atau terblokir.
2. **Tampilan Halaman Mushaf Ramping & Pas Layar**:
   - Menghapus label duplikat nomor halaman di header kiri; kini hanya fokus menampilkan nama Surah yang jelas dan rapi (misal: `Surah Al-Baqarah`).
   - Ikon koreksi dibuat simpel menyerupai ikon pesan pada kartu flashcard (`MessageSquare`).
   - Bingkai atas dan bawah dibuat ultra-ramping sehingga seluruh lembar mushaf Al-Qur'an tampil utuh dari atas ke bawah tanpa perlu digulir naik-turun.
