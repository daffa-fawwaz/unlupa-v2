# Panduan Lengkap Deployment & Pemindahan Server (UnLupa)

Dokumen ini ditujukan bagi tim developer untuk menduplikasi, memindahkan (*copy-paste*), atau men-deploy seluruh codebase aplikasi **UnLupa** ke server independen (VPS Linux, Docker, PaaS, atau Cloud Run) dengan domain kustom dan database mandiri tanpa ketergantungan pada lingkungan preview AI Studio.

---

## 1. Arsitektur Aplikasi

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Vite.
- **Backend**: Express.js (Node.js v20+) melayani API proxy AI dan *static single-page application* (`dist/index.html`).
- **Database & Auth**: Google Cloud Firestore & Firebase Authentication (Email/Password, Google OAuth, Magic Link).
- **Spaced Repetition Engine**: Algoritma FSRS (*Free Spaced Repetition Scheduler*) berjalan di memori lokal (*local-first*), disinkronkan secara asinkron ke Firestore.

---

## 2. Persyaratan Server (Prerequisites)

- **Node.js**: Versi `20.x` atau `22.x` LTS.
- **NPM**: Versi `10.x` ke atas.
- **Akun Firebase**: Proyek Firebase baru (Aktifkan Authentication & Firestore Database).
- **Google Gemini API Key**: Dari Google AI Studio.

---

## 3. Langkah Cepat Deployment (Step-by-Step)

### Langkah 1: Kloning / Salin Seluruh Kode
Salin seluruh direktori proyek ini ke direktori server tujuan Anda (misalnya `/var/www/unlupa` atau container Docker).

### Langkah 2: Buat File Lingkungan (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka file `.env` dan isi kredensial proyek Firebase dan kunci API Anda:
```env
PORT=3000
APP_URL="https://domainanda.com"
GEMINI_API_KEY="AIzaSy..."

# Firebase Client (Frontend)
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="proyek-anda.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="proyek-anda"
VITE_FIREBASE_STORAGE_BUCKET="proyek-anda.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
VITE_FIREBASE_FIRESTORE_DATABASE_ID="(default)"

# Firebase Admin (Backend)
FIREBASE_PROJECT_ID="proyek-anda"
```

### Langkah 3: Install Dependensi & Build
Jalankan perintah standar berikut:
```bash
# 1. Install seluruh dependensi
npm install

# 2. Build frontend dan server bundle
npm run build
```
Hasil build akan terkumpul secara bersih di folder `dist/` (`dist/index.html`, aset statis, dan `dist/server.cjs`).

### Langkah 4: Jalankan Server Produksi
```bash
npm start
```
Aplikasi akan aktif dan mendengarkan port yang Anda tentukan (default: `http://localhost:3000`).

---

## 4. Konfigurasi Deployment di VPS (Nginx + PM2)

Jika menggunakan VPS (Ubuntu / Debian):

### 1. Menjalankan Proses di Latar Belakang (PM2)
```bash
npm install -g pm2
pm2 start dist/server.cjs --name "unlupa-app"
pm2 save
pm2 startup
```

### 2. Reverse Proxy Nginx & Domain Kustom
Buat file konfigurasi Nginx di `/etc/nginx/sites-available/unlupa`:
```nginx
server {
    server_name domainanda.com www.domainanda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Aktifkan dan pasang SSL gratis (Let's Encrypt Certbot):
```bash
sudo ln -s /etc/nginx/sites-available/unlupa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d domainanda.com -d www.domainanda.com
```

---

## 5. Deployment Menggunakan Docker

File build aplikasi ini sudah mandiri. Contoh `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

Build dan jalankan:
```bash
docker build -t unlupa .
docker run -p 3000:3000 --env-file .env unlupa
```

---

## 6. Aturan Keamanan Database (Firestore Rules)

Pastikan file `firestore.rules` yang ada di root direktori proyek ini telah di-deploy ke Firebase Console proyek Anda:
1. Buka [Firebase Console](https://console.firebase.google.com).
2. Pilih proyek Anda > **Firestore Database** > tab **Rules**.
3. Salin dan tempel isi file `firestore.rules` dari repositori ini, lalu klik **Publish**.

---

## 7. Catatan Portabilitas Sistem Penyimpanan

1. **Bebas Kloning Server**: Sistem penyimpanan menggunakan pendekatan *in-place mutation*. Evaluasi hafalan (*review*) tidak membuat salinan dokumen baru, melainkan hanya memperbarui status kartu yang bersangkutan.
2. **Riwayat Evaluasi Terbatas (Sliding Window)**: `reviewLogs` dipangkas otomatis maksimal 50 entri terbaru per kartu, menjamin kapasitas penyimpanan database tetap ramping dan tidak pernah membengkak (*no server bloat*).
3. **Database Agnostik**: Database dapat dialihkan ke project Firebase mana saja cukup dengan mengganti `VITE_FIREBASE_PROJECT_ID` di file `.env`.
