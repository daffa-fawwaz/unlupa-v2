# Panduan Deployment Produksi Docker - Unlupa v2

Dokumen ini adalah panduan resmi deployment produksi mandiri untuk aplikasi **Unlupa v2** menggunakan Docker dan Docker Compose.

---

## 1. Arsitektur Deployment Produksi

- **Aplikasi (App Service)**:
  - Frontend: React 19 + TypeScript + Vite (dibundel statis ke `dist/`).
  - Backend: Express 5 + WebSocket (`ws`) + Prisma ORM Client (dibundel via `esbuild` ke `dist/server.js`).
  - Runtime: Node.js 22 LTS Alpine, non-root user (`unlupa`, uid: 1001).
  - Port Internal: `3000`.
  - Port Host: `127.0.0.1:3005` (hanya dapat diakses lokal dari host VPS untuk reverse proxy Nginx).
- **Database (DB Service)**:
  - Database Engine: PostgreSQL 16 Alpine.
  - Data Persistence: Docker Named Volume (`unlupa_v2_pgdata`).
  - Jaringan: Private Bridge Network (`unlupa_v2_network`).
  - Port Database: **TIDAK diekspos ke host maupun internet**, terisolasi penuh hanya untuk container aplikasi.
- **Reverse Proxy**: Nginx pada Host VPS meneruskan traffic port 80/443 ke `http://127.0.0.1:3005` dengan dukungan WebSocket (`/ws`).

---

## 2. Prasyarat Server (VPS Ubuntu 24.04)

- **Spesifikasi Minimum**:
  - RAM: 4 GB (dengan Swap 2 GB aktif).
  - Penyimpanan: Minimal 10 GB disk kosong (direkomendasikan ≥ 20 GB).
  - OS: Ubuntu 24.04 LTS (atau varian Linux modern lainnya).
- **Perangkat Lunak yang Terpasang di VPS**:
  - Docker Engine versi 24+ (`docker --version`).
  - Docker Compose v2 (`docker compose version`).
  - Nginx web server berjalan di port 80 dan 443.
- **Kondisi Alokasi Port VPS**:
  - Port yang **sudah dipakai layanan lain**: `3000`, `3002`, `5432`, `5433`, `5434`, `8000`.
  - Port yang **dialokasikan untuk Unlupa v2**: `3005` (pada `127.0.0.1`).

---

## 3. Struktur File Deployment

Di dalam repository Unlupa v2, file pendukung deployment produksi meliputi:
```
unlupa.id/
├── Dockerfile                  # Multi-stage production build (Node 22 Alpine)
├── compose.yaml                # Konfigurasi Docker Compose production
├── docker-entrypoint.sh        # Startup script (auto migrate deploy & run node)
├── .dockerignore               # Proteksi file rahasia & cache dari image
├── .env.production.example     # Template variabel lingkungan produksi
└── DEPLOYMENT.md               # Panduan deployment ini
```

---

## 4. Langkah Persiapan Environment Produksi (`.env`)

Pada server VPS di direktori kerja project:

1. Salin template `.env.production.example` menjadi `.env`:
   ```bash
   cp .env.production.example .env
   ```

2. Amankan hak akses file `.env` agar hanya dapat dibaca oleh user pemilik:
   ```bash
   chmod 600 .env
   ```

3. Buka file `.env` dan lengkapi nilai variabel penting:
   ```bash
   nano .env
   ```

   **Daftar Variabel Wajib Diisi:**
   - `POSTGRES_PASSWORD`: Buat password acak alfanumerik hex (agar aman dari karakter pemisah URL seperti `@`, `:`, atau `/`):
     ```bash
     openssl rand -hex 24
     ```
   - `JWT_SECRET`: Buat secret acak minimal 32 karakter untuk verifikasi JWT API:
     ```bash
     openssl rand -hex 32
     ```
   - `APP_URL`: Domain resmi produksi Anda (contoh: `https://unlupa.id`).
   - `APP_PORT`: Biarkan `3005` (atau ganti jika port tersebut sudah terpakai).
   - `GEMINI_API_KEY`: Kunci API Google AI Studio untuk fitur AI Generator Flashcard.
   - `FIREBASE_PROJECT_ID`: ID proyek Firebase untuk verifikasi autentikasi santri/guru.
   - `BOOTSTRAP_ADMIN_EMAILS`: Email admin utama yang otomatis berstatus Super Admin.

> [!IMPORTANT]
> Jangan pernah meng-commit file `.env` asli ke repository Git. Pastikan file `.env` selalu masuk dalam `.gitignore`.

---

## 5. Cara Build dan Menjalankan Aplikasi

1. **Build Docker Image Produksi**:
   ```bash
   docker compose build
   ```

2. **Jalankan Layanan di Latar Belakang (Detached Mode)**:
   ```bash
   docker compose up -d
   ```

3. Container database (`db`) akan menyala terlebih dahulu. Setelah healthcheck PostgreSQL lulus (`healthy`), container aplikasi (`app`) akan otomatis menyala dan menjalankan `prisma migrate deploy` sebelum server Express aktif.

---

## 6. Pemeriksaan Status, Health Check, dan Log

### 1. Periksa Status Container:
```bash
docker compose ps
```
Pastikan kedua service menampilkan status `Up` dan `(healthy)`.

### 2. Pantau Log Aplikasi Secara Realtime:
```bash
# Log seluruh layanan
docker compose logs -f

# Khusus log aplikasi Express & WebSocket
docker compose logs -f app

# Khusus log database PostgreSQL
docker compose logs -f db
```

### 3. Uji Endpoint Health Check dari Host VPS:
```bash
curl -i http://127.0.0.1:3005/health
```
Respons yang diharapkan (HTTP 200 OK):
```json
{"status":"ok","timestamp":"2026-10-15T14:00:00.000Z","database":"connected"}
```

---

## 7. Prosedur Migrasi Database Prisma

Container aplikasi Unlupa v2 telah dilengkapi `docker-entrypoint.sh` yang secara otomatis menjalankan:
```bash
npx prisma migrate deploy
```
setiap kali container dinyalakan.

### Menjalankan Migrasi Secara Manual (Bila Diperlukan):
Jika Anda ingin menerapkan migrasi tanpa me-restart container aplikasi:
```bash
docker compose exec app npx prisma migrate deploy
```

### Memeriksa Status Migrasi:
```bash
docker compose exec app npx prisma migrate status
```

> [!CAUTION]
> **Dilarang** menjalankan `prisma migrate dev` atau `prisma db push` di lingkungan produksi karena berpotensi mereset tabel atau menyebabkan inkonsistensi skema.

---

## 8. Pembaruan Aplikasi (Update / Redeploy)

Ketika ada update kode terbaru dari repository Git:

1. Ambil kode terbaru:
   ```bash
   git pull origin main
   ```

2. Buat backup database terlebih dahulu sebelum menerapkan update (lihat Bagian 9).

3. Build ulang image container dengan kode baru:
   ```bash
   docker compose build
   ```

4. Terapkan container baru dengan **minimal downtime** (~2–5 detik selama proses recreate container):
   ```bash
   docker compose up -d
   ```
   Docker Compose akan mengganti container aplikasi lama dengan image baru tanpa menghapus persistent volume database (`unlupa_v2_pgdata`).

5. Bersihkan image build usang yang tidak terpakai:
   ```bash
   docker image prune -f
   ```

---

## 9. Backup dan Restore Database PostgreSQL

### 1. Backup Database (Dump):
Jalankan perintah ini di host VPS untuk membuat salinan terkompresi:
```bash
mkdir -p ~/backups/unlupa
BACKUP_FILE=~/backups/unlupa/backup_$(date +%Y%m%d_%H%M%S).sql.gz
docker compose exec -T db pg_dump -U unlupa_user unlupa | gzip > "$BACKUP_FILE"
```

### 2. Verifikasi Integritas File Backup (Wajib):
Pastikan file backup tidak kosong dan dapat diekstrak tanpa korupsi:
```bash
gzip -t "$BACKUP_FILE" && ls -lh "$BACKUP_FILE"
```
Jika tidak ada error dan ukuran file masuk akal (non-zero), backup terverifikasi valid.

### 3. Restore Database dari File Backup:
```bash
# Ekstrak dan masukkan file backup ke database container
gunzip -c ~/backups/unlupa/backup_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T db psql -U unlupa_user -d unlupa
```

---

## 10. Penanganan Kegagalan & Rollback

> [!WARNING]
> **PENTING**: Me-rollback commit Git dan image Docker **TIDAK** membatalkan perubahan skema atau data di PostgreSQL jika migrasi telah dieksekusi. Pisahkan antara Rollback Aplikasi dan Pemulihan Database.

### Skenario A: Masalah Kode / Frontend / Backend (Skema Database Masih Kompatibel)
Jika bug hanya terjadi di logika kode aplikasi tanpa perubahan skema database yang merusak:
1. Revert ke commit Git stabil sebelumnya:
   ```bash
   git checkout <COMMIT_HASH_SEBELUMNYA>
   ```
2. Rebuild dan jalankan ulang container:
   ```bash
   docker compose build
   docker compose up -d
   ```

### Skenario B: Masalah Migrasi Database Rusak / Data Corrupt
Jika update menyebabkan kegagalan database atau kehilangan data:
1. Hentikan container aplikasi agar tidak ada transaksi baru:
   ```bash
   docker compose stop app
   ```
2. Pulihkan database dari file backup terakhir yang sudah diverifikasi:
   ```bash
   gunzip -c ~/backups/unlupa/backup_SEBELUM_MIGRASI.sql.gz | docker compose exec -T db psql -U unlupa_user -d unlupa
   ```
3. Checkout kode ke versi sebelum migrasi bermasalah, rebuild, lalu jalankan kembali:
   ```bash
   git checkout <COMMIT_HASH_SEBELUMNYA>
   docker compose build app
   docker compose up -d app
   ```

---

## 11. Konfigurasi Reverse Proxy Nginx pada Host VPS

> [!CAUTION]
> **PERINGATAN SEBELUM MENGUBAH NGINX VPS**:
> VPS Anda saat ini menjalankan beberapa aplikasi lain dalam Docker. Sebelum memperbarui virtual host Nginx untuk `unlupa.id`, pastikan Anda telah memverifikasi apakah domain tersebut saat ini masih aktif melayani pengguna di container atau port lama (misal port 3000 atau 3002).
> Uji container Unlupa v2 terlebih dahulu di port lokal `3005` via:
> ```bash
> curl -i http://127.0.0.1:3005/health
> ```
> Setelah container v2 dipastikan berstatus healthy, baru ubah virtual host Nginx berikut.

Tambahkan atau sesuaikan konfigurasi virtual host Nginx di `/etc/nginx/sites-available/unlupa`:

```nginx
server {
    listen 80;
    server_name unlupa.id www.unlupa.id;

    # Redirect seluruh HTTP ke HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name unlupa.id www.unlupa.id;

    # Sertifikat SSL (Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/unlupa.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/unlupa.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Batas ukuran upload dokumen/materi (sesuai limit Express 10MB)
    client_max_body_size 15M;

    # Reverse proxy ke container Unlupa v2
    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;

        # Header WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Forwarding header client
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout WebSocket (menjaga koneksi realtime tetap stabil)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Uji dan muat ulang Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 12. Pengujian Menyeluruh (Verifikasi Pasca Deploy)

1. **Akses Frontend**:
   Buka `https://unlupa.id` pada browser. Pastikan antarmuka termuat dengan cepat tanpa error konsol.
2. **Akses API**:
   Buka `https://unlupa.id/api/health`. Pastikan status mengembalikan `"status":"ok"` dan `"database":"connected"`.
3. **Koneksi Realtime WebSocket**:
   Buka Developer Tools (F12) > tab **Network** > filter **WS**. Pastikan koneksi ke `wss://unlupa.id/ws` berstatus `101 Switching Protocols`.

---

## 13. Menghentikan Layanan Secara Aman

Untuk menghentikan aplikasi tanpa menghapus data PostgreSQL:
```bash
docker compose down
```

> [!WARNING]
> **JANGAN PERNAH** menambahkan flag `-v` (`docker compose down -v`) pada perintah di atas, karena flag `-v` akan menghapus persistent volume database PostgreSQL (`unlupa_v2_pgdata`)!
