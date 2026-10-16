#!/bin/sh
set -e

# Pastikan script keluar jika ada error yang tidak tertangani
echo "=========================================================="
echo " Starting Unlupa v2 Production Container"
echo " Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================================="

# Validasi keberadaan DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "[Unlupa FATAL] DATABASE_URL tidak ditemukan di environment. Startup dibatalkan demi keamanan." >&2
  exit 1
fi

echo "[Unlupa] Menjalankan Prisma Database Migrations (prisma migrate deploy)..."
MAX_RETRIES=15
RETRY_COUNT=0

until npx prisma migrate deploy; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "[Unlupa FATAL] Prisma migration gagal diterapkan setelah $MAX_RETRIES percobaan! Startup aplikasi dibatalkan." >&2
    exit 1
  fi
  echo "[Unlupa] Database belum siap atau koneksi terputus, mencoba kembali dalam 2 detik ($RETRY_COUNT/$MAX_RETRIES)..."
  sleep 2
done
echo "[Unlupa] Migrasi database berhasil diaplikasikan secara konsisten."

echo "[Unlupa] Menjalankan aplikasi utama..."
exec "$@"
