#!/usr/bin/env bash
# =====================================================================
#  نشر تلقائي كامل على سيرفر VPS (يُنفَّذ على السيرفر نفسه)
#
#  الاستخدام على السيرفر:
#     cd /root && bash deploy-remote.sh
#  أو مع الدومين مباشرة:
#     DOMAIN=cars.example.com ACME_EMAIL=me@mail.com bash deploy-remote.sh
#
#  يقوم بـ: تثبيت Docker (لو مش موجود) → سحب الكود → إعداد .env.docker
#            → بناء وتشغيل الحاويات → فتح المنافذ → طباعة الحالة
# =====================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mahamed73/carsystem.git}"
BRANCH="${BRANCH:-arena/01a08cd4-carsystem}"
APP_DIR="${APP_DIR:-/root/carsystem}"

say() { printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }
ok()  { printf "\033[1;32m✅ %s\033[0m\n" "$1"; }
warn(){ printf "\033[1;33m⚠️  %s\033[0m\n" "$1"; }

# ---------------------------------------------------------------------
say "1/6 التحقق من صلاحيات root"
if [ "$(id -u)" -ne 0 ]; then
  echo "شغّل السكربت بمستخدم root أو بـ sudo."
  exit 1
fi

# ---------------------------------------------------------------------
say "2/6 تثبيت Docker (لو غير مثبت)"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  apt-get install -y docker-compose-plugin 2>/dev/null || apt-get install -y docker-compose 2>/dev/null || true
fi
ok "Docker: $(docker --version)"
COMPOSE="docker compose"
$COMPOSE version >/dev/null 2>&1 || COMPOSE="docker-compose"
ok "Compose: $COMPOSE"

# ---------------------------------------------------------------------
say "3/6 سحب الكود من GitHub"
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
ok "الكود جاهز في $APP_DIR"

# ---------------------------------------------------------------------
say "4/6 إعداد ملف الإعدادات .env.docker"
if [ ! -f .env.docker ]; then
  if [ -z "${DOMAIN:-}" ]; then
    read -r -p "اكتب الدومين (مثال: cars.example.com): " DOMAIN
  fi
  if [ -z "${ACME_EMAIL:-}" ]; then
    read -r -p "اكتب بريدك الإلكتروني (لشهادة SSL): " ACME_EMAIL
  fi
  ADMIN_EMAIL_DEFAULT="admin@${DOMAIN}"
  read -r -p "بريد مدير النظام [${ADMIN_EMAIL_DEFAULT}]: " ADMIN_EMAIL_INPUT || true
  ADMIN_EMAIL_INPUT="${ADMIN_EMAIL_INPUT:-$ADMIN_EMAIL_DEFAULT}"
  read -r -p "كلمة مرور مدير النظام: " ADMIN_PASSWORD_INPUT || true
  ADMIN_PASSWORD_INPUT="${ADMIN_PASSWORD_INPUT:-Admin@12345}"

  POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)"
  AUTH_SECRET="$(openssl rand -base64 32)"

  cat > .env.docker <<ENVFILE
DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}

POSTGRES_USER=carapp
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=carsystem

AUTH_SECRET=${AUTH_SECRET}
AUTH_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}

NEXT_PUBLIC_WORKSHOP_NAME=مركز الصيانة الذكي

ADMIN_NAME=مدير النظام
ADMIN_EMAIL=${ADMIN_EMAIL_INPUT}
ADMIN_PASSWORD=${ADMIN_PASSWORD_INPUT}

SEED_ON_START=true
SEED_DEMO=false

TZ=Africa/Cairo
ENVFILE
  chmod 600 .env.docker
  ok "تم إنشاء .env.docker بمفاتيح عشوائية آمنة"
  warn "كلمة مرور قاعدة البيانات والمفتاح محفوظان في $APP_DIR/.env.docker — احتفظ بنسخة"
else
  ok ".env.docker موجود مسبقاً — لن يُعدّل"
fi

# ---------------------------------------------------------------------
say "5/6 بناء وتشغيل الحاويات (قد يستغرق بضع دقائق)"
# إيقاف أي خدمة تشغل المنافذ 80/443
systemctl stop nginx apache2 2>/dev/null || true
systemctl disable nginx apache2 2>/dev/null || true

$COMPOSE --env-file .env.docker up -d --build

# ---------------------------------------------------------------------
say "6/6 فتح المنافذ وحالة النظام"
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 80/tcp  >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

sleep 5
$COMPOSE --env-file .env.docker ps

DOMAIN_VAL="$(grep -m1 '^DOMAIN=' .env.docker | cut -d= -f2-)"
echo ""
ok "تم النشر — افتح: https://${DOMAIN_VAL}"
echo ""
echo "لمتابعة السجل:"
echo "  cd $APP_DIR && $COMPOSE --env-file .env.docker logs -f app"
echo ""
echo "لجدولة نسخة احتياطية يومية (3 صباحاً):"
echo "  (crontab -l 2>/dev/null; echo '0 3 * * * cd $APP_DIR && bash scripts/backup.sh >> /var/log/carsystem-backup.log 2>&1') | crontab -"
