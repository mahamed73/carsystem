#!/usr/bin/env bash
# =====================================================================
#  نسخة احتياطية من قاعدة البيانات (تعمل على الـ VPS بعد النشر بـ Docker)
#  الاستخدام:  bash scripts/backup.sh
#  يُفضّل إضافتها في cron يومياً:
#     0 3 * * * cd /root/carsystem && bash scripts/backup.sh >> /var/log/carsystem-backup.log 2>&1
# =====================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

# قراءة بيانات القاعدة من ملف النشر
ENV_FILE=".env.docker"
[ -f "$ENV_FILE" ] || { echo "✖ ملف .env.docker غير موجود"; exit 1; }
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

STAMP="$(date +%Y-%m-%d_%H-%M)"
FILE="$BACKUP_DIR/carsystem_${STAMP}.sql.gz"

echo "▶ إنشاء نسخة احتياطية: $FILE"
if command -v docker >/dev/null 2>&1; then
  docker compose --env-file "$ENV_FILE" exec -T db \
    pg_dump -U "${POSTGRES_USER:-carapp}" -d "${POSTGRES_DB:-carsystem}" --clean --if-exists \
    | gzip -9 > "$FILE"
else
  echo "✖ docker غير مثبت على السيرفر"
  exit 1
fi

SIZE="$(du -h "$FILE" | cut -f1)"
echo "✅ تم إنشاء النسخة ($SIZE)"

echo "▶ حذف النسخ الأقدم من ${KEEP_DAYS} يوم..."
find "$BACKUP_DIR" -name 'carsystem_*.sql.gz' -type f -mtime "+${KEEP_DAYS}" -delete
echo "✅ انتهى"

echo ""
echo "لاستعادة نسخة:"
echo "  gunzip -c $FILE | docker compose --env-file .env.docker exec -T db psql -U ${POSTGRES_USER:-carapp} -d ${POSTGRES_DB:-carsystem}"
