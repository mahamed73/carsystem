#!/usr/bin/env bash
# =====================================================================
#  تجهيز قاعدة بيانات PostgreSQL محلياً (للتطوير على السيرفر أو اللابتوب)
#  الاستخدام:  bash scripts/setup-db.sh
# =====================================================================
set -euo pipefail

DB_NAME="${DB_NAME:-carsystem}"
DB_USER="${DB_USER:-car_app}"
DB_PASS="${DB_PASS:-car_app_pw}"

echo "▶ التحقق من تثبيت PostgreSQL..."
if ! command -v psql >/dev/null 2>&1; then
  echo "  PostgreSQL غير مثبت — جاري التثبيت..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq postgresql postgresql-contrib >/dev/null
fi

echo "▶ تشغيل خدمة PostgreSQL..."
sudo service postgresql start >/dev/null 2>&1 || sudo pg_ctlcluster "$(ls /etc/postgresql | head -1)" main start >/dev/null 2>&1 || true
sleep 2

echo "▶ إنشاء المستخدم وقاعدة البيانات (إن لم تكن موجودة)..."
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" >/dev/null

sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" >/dev/null

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >/dev/null
sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" >/dev/null

echo "▶ تطبيق مخطط قاعدة البيانات (migrations)..."
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
node scripts/migrate.js

echo "▶ إدخال البيانات الأولية (خدمات + مدير)..."
node scripts/seed.js

echo ""
echo "✅ تم تجهيز قاعدة البيانات بنجاح: ${DB_NAME}"
echo "   DATABASE_URL=${DATABASE_URL}"
