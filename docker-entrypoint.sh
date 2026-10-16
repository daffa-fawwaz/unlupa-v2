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
if ! npx prisma migrate deploy; then
  echo "[Unlupa FATAL] Prisma migration gagal diterapkan! Startup aplikasi dibatalkan untuk mencegah inkonsistensi skema." >&2
  exit 1
fi
echo "[Unlupa] Migrasi database berhasil diaplikasikan secara konsisten."

echo "[Unlupa] Menjalankan aplikasi utama..."
exec "$@"
