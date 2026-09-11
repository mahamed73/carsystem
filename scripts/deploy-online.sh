#!/usr/bin/env bash
# =====================================================================
#  نشر بنقرة واحدة — نظام حجز صيانة السيارات
#  يُنفَّذ على السيرفر بمستخدم root، ويتولى: تجهيز الأدوات ← سحب الكود
#  ← تشغيل سكربت النشر الكامل (Docker + HTTPS تلقائي).
#
#  الاستخدام (أمر واحد):
#     curl -fsSL https://raw.githubusercontent.com/mahamed73/carsystem/arena/01a08cd4-carsystem/scripts/deploy-online.sh | bash
#
#  ويمكن التحكم بالإعدادات عبر متغيرات البيئة قبل التشغيل:
#     DOMAIN=carsys.easychat.cloud ACME_EMAIL=admin@easychat.cloud \
#     ADMIN_EMAIL=admin@easychat.cloud \
#     bash <(curl -fsSL .../scripts/deploy-online.sh)
# =====================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mahamed73/carsystem.git}"
BRANCH="${BRANCH:-arena/01a08cd4-carsystem}"
APP_DIR="${APP_DIR:-/root/carsystem}"

DOMAIN="${DOMAIN:-carsys.easychat.cloud}"
ACME_EMAIL="${ACME_EMAIL:-admin@easychat.cloud}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@easychat.cloud}"

green() { printf "\033[1;32m%s\033[0m\n" "$1"; }
red()   { printf "\033[1;31m%s\033[0m\n" "$1"; }
head2() { printf "\n\033[1;36m═══ %s ═══\033[0m\n" "$1"; }

if [ "$(id -u)" -ne 0 ]; then
  red "✖ شغّل الأمر بمستخدم root (أو أضف sudo قبل bash)"
  exit 1
fi

head2 "تجهيز الأدوات الأساسية"
export DEBIAN_FRONTEND=noninteractive
NEED_INSTALL=""
for c in git curl openssl; do
  command -v "$c" >/dev/null 2>&1 || NEED_INSTALL="$NEED_INSTALL $c"
done
if [ -n "$NEED_INSTALL" ]; then
  echo "  سيتم تثبيت:$NEED_INSTALL"
  apt-get update -qq || true
  # shellcheck disable=SC2086
  apt-get install -y -qq $NEED_INSTALL ca-certificates >/dev/null
fi
green "  ✅ git / curl / openssl جاهزة"

head2 "سحب الكود من GitHub"
if [ -d "$APP_DIR/.git" ] && git -C "$APP_DIR" fetch --depth=1 origin "$BRANCH" 2>/dev/null; then
  git -C "$APP_DIR" checkout -q -B "$BRANCH" "origin/$BRANCH"
  git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
  green "  ✅ تم تحديث الكود في $APP_DIR (فرع $BRANCH)"
else
  mkdir -p "$(dirname "$APP_DIR")"
  rm -rf "$APP_DIR"
  if ! git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR" 2>/dev/null; then
    echo "  ⚠️ تعذّر استخدام الفرع $BRANCH — سيتم استخدام main"
    BRANCH=main
    git clone --depth=1 --branch main "$REPO_URL" "$APP_DIR"
  fi
  green "  ✅ تم سحب الكود إلى $APP_DIR (فرع $BRANCH)"
fi
cd "$APP_DIR"

head2 "بدء النشر الكامل (Docker + قاعدة البيانات + HTTPS)"
exec env DOMAIN="$DOMAIN" ACME_EMAIL="$ACME_EMAIL" ADMIN_EMAIL="$ADMIN_EMAIL" \
  bash scripts/deploy-remote.sh
