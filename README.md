# 📖 Unlupa.id — Platform Murajaah & Hafalan Modern

<div align="center">

**Platform Cerdas Menjaga Hafalan Al-Qur'an, Kitab, dan Materi Keilmuan Berbasis Algoritma Spaced Repetition (FSRS)**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## 📌 Tentang Unlupa.id

**Unlupa.id** (*"Dulu tidak tahu, sekarang lupa. Capek menghafal tapi hilang begitu saja"*) adalah aplikasi manajemen hafalan dan murajaah berbasis web modern. Aplikasi ini memadukan algoritma memori ilmiah **FSRS (Free Spaced Repetition Scheduler v5)** dengan antarmuka Mushaf Madinah 604 Halaman, sistem Flashcard Kitab interaktif, dan Ruang Kelas/Mengajar (*Halaqah*) antara Guru dan Santri.

### ✨ Fitur Unggulan

1. **🕌 Ruang Al-Qur'an (604 Halaman Mushaf Standar Madinah):**
   - Aktivasi lembar mushaf per Juz atau per halaman.
   - Penjadwalan murajaah otomatis berbasis retensi daya ingat (*FSRS*).
   - Penilaian hafalan santri (Lancar Mutqin, Lancar, Perlu Ulang).
   - Mode Mapan (>300 hari) dan evaluasi kesalahan tajwid/makhraj.

2. **📚 Ruang Buku & Kitab (Flashcard Keilmuan):**
   - Pembuatan buku materi, bab, dan kartu uji memori.
   - Dukungan AI Gemini untuk ekstraksi kartu otomatis.
   - Pustaka publik (impor materi yang dibagikan pengguna lain).

3. **👥 Ruang Mengajar (Halaqah Guru & Santri):**
   - Pembuatan kelas Al-Qur'an dan Non-Qur'an dengan kode unik kelas.
   - Guru dapat membuka langsung mushaf riil santri (*Buka Mushaf Santri*).
   - Guru dapat menyimak (*tasmi'*), mengaktifkan halaman baru, dan mencetak rapor berkala santri.

4. **📊 Dasbor & Analitik Memori:**
   - Antrean murajaah harian adaptif (*Due Today*).
   - Piramida stabilitas memori (Mapan, Kokoh, Konsolidasi, Kritis).
   - Papan peringkat (*Leaderboard*) dan streak harian.

5. **🔐 Sistem Autentikasi & Database Mandiri:**
   - Login & Registrasi aman menggunakan JWT (*JSON Web Token*) dan bcrypt.
   - Database relasional PostgreSQL dengan Prisma ORM.

---

## 🛠️ Teknologi yang Digunakan

| Sektor | Teknologi |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Vite |
| **Backend** | Node.js, Express.js 5, TypeScript (`tsx`) |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Spaced Repetition** | `ts-fsrs` (Free Spaced Repetition Scheduler) |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Export & Reporting** | jsPDF, html2canvas, Canvas Confetti |

---

## 📋 Persyaratan Sistem (Prerequisites)

Sebelum menjalankan aplikasi di komputer lokal Anda, pastikan telah menginstal:

1. **Node.js**: Versi **v20.x** atau **v22.x** (LTS disarankan).
   - Cek dengan: `node -v`
2. **NPM**: Versi **v10.x** ke atas (biasanya terinstal bersama Node.js).
   - Cek dengan: `npm -v`
3. **PostgreSQL**: Server PostgreSQL aktif berjalan di lokal (port default `5432`) atau layanan cloud (Supabase / Neon / Railway).
   - Pastikan telah membuat database baru, misalnya bernama `unlupa_db`.

---

## 🚀 Panduan Menjalankan di Komputer Lokal

Ikuti langkah-langkah mudah berikut untuk menjalankan project dari awal:

### 1. Kloning atau Buka Direktori Project
Buka terminal dan masuk ke folder project:
```bash
cd /path/to/unlupa-v2
```

---

### 2. Install Dependensi (Packages)
Jalankan perintah berikut untuk mengunduh seluruh library yang dibutuhkan:
```bash
npm install
```

---

### 3. Buat File Konfigurasi Lingkungan (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka file `.env` dengan text editor (misal VS Code atau nano), lalu sesuaikan konfigurasi database dan API Anda:

```env
# Port aplikasi backend Express
PORT=3000

# URL koneksi database PostgreSQL
DATABASE_URL="postgresql://postgres:password_anda@localhost:5432/unlupa_db?schema=public"

# Kunci rahasia JWT untuk autentikasi (minimal 32 karakter bebas)
JWT_SECRET="kunci-rahasia-jwt-unlupa-super-aman-dan-panjang-12345"
JWT_EXPIRES_IN="7d"

# Kunci API Google Gemini (untuk fitur asisten AI & ekstraksi kartu)
GEMINI_API_KEY="AIzaSy..."

# Konfigurasi Frontend API
VITE_API_BASE_URL=""
```

> **Catatan Penting:** 
> Ganti `postgres:password_anda@localhost:5432/unlupa_db` sesuai username, password, dan nama database PostgreSQL di komputer Anda.

---

### 4. Sinkronisasi Skema Database (Prisma)
Jalankan generator dan migrasi skema database Prisma ke PostgreSQL:

```bash
# 1. Generate Prisma Client TypeScript
npx prisma generate

# 2. Sinkronkan skema ke database PostgreSQL
npx prisma db push
```

*(Opsional)* Anda dapat membuka antarmuka visual tabel database menggunakan Prisma Studio:
```bash
npx prisma studio
```

---

### 5. Jalankan Server Development
Jalankan server aplikasi (Express Backend + Vite Frontend terintegrasi):

```bash
npm run dev
```

Jika berhasil, terminal akan menampilkan:
```
[Server] Express listening on port 3000
[Vite] dev server running at: http://localhost:3000
```

---

### 6. Buka di Browser
Buka browser Anda dan akses tautan berikut:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔄 Alur Navigasi Aplikasi

- **Akses Pertama Kali (`http://localhost:3000`):**
  - Mengarahkan langsung ke **Landing Page** yang elegan.
  - **Jika Belum Login:** Header & Hero menampilkan tombol **"Login"** dan **"Mulai Sekarang"** yang akan membuka modal autentikasi.
  - **Jika Sudah Login:** Tombol di Landing Page otomatis berganti menjadi **"Ke Dashboard"** lengkap dengan badge nama pengguna.
- **Masuk ke Dashboard:**
  - Klik **"Ke Dashboard"** atau lakukan login untuk masuk ke workspace aplikasi.
  - Sesi kerja di tab browser akan otomatis diingat (*session persistence*).
- **Kembali ke Landing Page:**
  - Pengguna yang sedang berada di Dashboard dapat membuka Landing Page kapan saja melalui menu Profil pojok kanan atas > **Halaman Depan**.
  - Saat pengguna mengklik **Keluar (Sign Out)**, sistem akan membersihkan sesi dan mengarahkan kembali ke Landing Page dengan tombol "Login".

---

## 📜 Daftar Perintah NPM (Scripts)

| Perintah | Keterangan |
| :--- | :--- |
| `npm run dev` | Menjalankan server development lokal (Express + Vite HMR) di port 3000 |
| `npm run build` | Melakukan kompilasi produksi bundle frontend ke direktori `dist/` |
| `npm run start` | Menjalankan server mode production |
| `npm run lint` | Menjalankan pengecekan tipe data TypeScript (`tsc --noEmit`) |
| `npm run test:quran` | Menjalankan skrip validasi persistensi murajaah Al-Qur'an |
| `npx prisma db push` | Menerapkan perubahan skema Prisma ke database PostgreSQL |
| `npx prisma studio` | Membuka antarmuka GUI browser untuk melihat data database |

---

## 📂 Struktur Direktori Project

```text
├── prisma/
│   └── schema.prisma         # Skema database relasional PostgreSQL (User, Class, QuranPage, dsb)
├── public/                   # Asset statis publik (ikon, gambar mushaf, logo)
├── src/
│   ├── components/           # Komponen UI React terisolasi per fitur:
│   │   ├── admin/            # Ruang manajemen sistem & admin
│   │   ├── auth/             # Modal login & registrasi (AuthModal)
│   │   ├── classes/          # Ruang Mengajar, daftar santri, dan StudentQuranView
│   │   ├── common/           # Komponen bersama (kartu murajaah, offline indicator, dialog)
│   │   ├── home/             # Ruang Beranda & antrean murajaah harian
│   │   ├── landing/          # Halaman depan (LandingPage)
│   │   ├── leaderboard/      # Ruang Peringkat & streak santri
│   │   ├── personal/         # Ruang Buku & Flashcard kitab
│   │   ├── profile/          # Modal pengaturan profil & preferensi
│   │   └── quran/            # Ruang Al-Qur'an 604 halaman & mushaf viewer
│   ├── context/
│   │   └── AppContext.tsx    # State management utama (Auth, Quran, Buku, Kelas)
│   ├── data/                 # Data statis (daftar surat 1-114, juz 1-30, data sampel)
│   ├── lib/                  # Library pembantu (FSRS engine, sound effects, client API)
│   ├── server/               # Backend Express.js modular:
│   │   ├── middlewares/      # Auth JWT middleware, error handler, CORS
│   │   ├── routes/           # Endpoint API RESTful (/api/v1/auth, /classes, /books)
│   │   └── services/         # Business logic layer (userService, classService, dsb)
│   ├── App.tsx               # Root view router & error boundary
│   └── main.tsx              # Entry point klien React
├── .env.example              # Template variabel lingkungan
├── package.json              # Daftar dependensi & script NPM
├── server.ts                 # Server entry point Express + Vite middleware
├── tsconfig.json             # Konfigurasi TypeScript
└── vite.config.ts            # Konfigurasi bundler Vite & PWA
```

---

## ❓ FAQ & Solusi Masalah Umum

### 1. Error: `P1001: Can't reach database server at localhost:5432`
- **Penyebab:** Server PostgreSQL di komputer Anda belum aktif atau port berbeda.
- **Solusi:**
  - Di Mac: Jalankan `brew services start postgresql` atau buka Postgres.app.
  - Di Linux: Jalankan `sudo systemctl start postgresql`.
  - Di Windows: Buka Services > cari `postgresql-x64` > klik Start.

### 2. Error: `EADDRINUSE: address already in use :::3000`
- **Penyebab:** Port 3000 sedang digunakan oleh aplikasi lain atau instance server sebelumnya.
- **Solusi:**
  - Cari proses yang memakai port 3000 dan matikan:
    ```bash
    # Di Mac / Linux:
    lsof -i :3000
    kill -9 <PID>
    ```
  - Atau ubah `PORT=3001` pada file `.env`.

### 3. Halaman Terlihat Kosong / Cache Browser Lama
- Bersihkan cache browser Anda atau tekan tombol `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac) untuk melakukan *hard refresh*.

---

<div align="center">
  <sub>Dibangun dengan dedikasi untuk memudahkan ummat menjaga hafalan Al-Qur'an & ilmu agama.</sub>
</div>
