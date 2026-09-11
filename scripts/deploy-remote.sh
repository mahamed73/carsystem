#!/usr/bin/env bash
# =====================================================================
#  النشر التلقائي الكامل لنظام حجز صيانة السيارات على VPS
#  يُنفَّذ على السيرفر نفسه (root) — يقوم بكل شيء من الصفر:
#    1) تثبيت Docker و git (لو مش موجودين)
#    2) سحب الكود من GitHub
#    3) توليد مفاتيح وكلمات مرور آمنة عشوائياً + ملف .env.docker
#    4) بناء وتشغيل الحاويات (تطبيق + قاعدة بيانات + Caddy للـ HTTPS)
#    5) فتح المنافذ وطباعة النتيجة النهائية
#
#  الاستخدام:
#    بدون دومين (يشتغل على http://IP):
#      bash deploy-remote.sh
#
#    مع دومين و HTTPS تلقائي:
#      DOMAIN=cars.example.com ACME_EMAIL=you@mail.com bash deploy-remote.sh
#
#    مع تحديد بريد/كلمة مرور المدير مسبقاً:
#      DOMAIN=... ACME_EMAIL=... ADMIN_EMAIL=admin@x.com ADMIN_PASSWORD='Str0ng#123' bash deploy-remote.sh
# =====================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mahamed73/carsystem.git}"
BRANCH="${BRANCH:-arena/01a08cd4-carsystem}"
APP_DIR="${APP_DIR:-/root/carsystem}"

say()  { printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }
ok()   { printf "\033[1;32m  ✅ %s\033[0m\n" "$1"; }
warn() { printf "\033[1;33m  ⚠️  %s\033[0m\n" "$1"; }
die()  { printf "\033[1;31m  ✖ %s\033[0m\n" "$1"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "شغّل السكربت بمستخدم root:  bash deploy-remote.sh"

# ---------------------------------------------------------------------
say "1/6 التحقق من الأدوات الأساسية"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>/dev/null || warn "تعذّر تحديث قوائم الحزم — سنحاول المتابعة"
for pkg in curl git ca-certificates; do
  command -v "${pkg%%-*}" >/dev/null 2>&1 || apt-get install -y -qq "$pkg" >/dev/null 2>&1 || true
done
command -v curl >/dev/null || die "curl غير متاح — ثبّته يدوياً: apt-get install -y curl"
command -v git  >/dev/null || die "git غير متاح — ثبّته يدوياً: apt-get install -y git"
ok "curl و git جاهزان"

# ---------------------------------------------------------------------
say "2/6 تثبيت Docker (لو غير مثبت)"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  apt-get install -y -qq docker-compose-plugin >/dev/null 2>&1 \
    || apt-get install -y -qq docker-compose >/dev/null 2>&1 || true
fi
command -v docker >/dev/null || die "فشل تثبيت Docker — راجع https://docs.docker.com/engine/install/"
systemctl enable --now docker >/dev/null 2>&1 || true
ok "$(docker --version)"

COMPOSE="docker compose"
$COMPOSE version >/dev/null 2>&1 || COMPOSE="docker-compose"
$COMPOSE version >/dev/null 2>&1 || die "Docker Compose غير متاح"
ok "Compose: $($COMPOSE version | head -1)"

# ---------------------------------------------------------------------
say "3/6 سحب الكود من GitHub"
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --depth=1 origin "$BRANCH" || { warn "تعذّر جلب الفرع $BRANCH — سنستخدم main"; BRANCH=main; git -C "$APP_DIR" fetch --depth=1 origin main; }
  git -C "$APP_DIR" checkout -q "$BRANCH" 2>/dev/null || git -C "$APP_DIR" checkout -q -b "$BRANCH" "origin/$BRANCH"
  git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
  ok "تم تحديث الكود الموجود في $APP_DIR (فرع $BRANCH)"
else
  git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR" 2>/dev/null || {
    warn "تعذّر استخدام الفرع $BRANCH — سيتم استخدام main"
    BRANCH=main
    git clone --depth=1 --branch main "$REPO_URL" "$APP_DIR"
  }
  ok "تم استنساخ الكود في $APP_DIR (فرع $BRANCH)"
fi
cd "$APP_DIR"

# ---------------------------------------------------------------------
say "4/6 إعداد ملف الإعدادات .env.docker"
SERVER_IP="$(curl -s --max-time 10 https://api.ipify.org || hostname -I | awk '{print $1}')"

if [ -f .env.docker ]; then
  ok ".env.docker موجود مسبقاً — لن يُعدّل (لإعادة الإعداد: rm .env.docker وأعد التشغيل)"
  DOMAIN_VAL="$(grep -m1 '^DOMAIN=' .env.docker | cut -d= -f2- || true)"
  ADMIN_EMAIL_VAL="$(grep -m1 '^ADMIN_EMAIL=' .env.docker | cut -d= -f2- || true)"
  ADMIN_PASS_VAL="$(grep -m1 '^ADMIN_PASSWORD=' .env.docker | cut -d= -f2- || true)"
else
  # --- الدومين ---
  DOMAIN_VAL="${DOMAIN:-}"
  if [ -z "$DOMAIN_VAL" ]; then
    if [ -t 0 ]; then
      echo "  (اتركه فارغاً واضغط Enter للنشر على IP بدون دومين)"
      read -r -p "  الدومين [بدون الدومين]: " DOMAIN_VAL || true
    fi
  fi
  DOMAIN_VAL="${DOMAIN_VAL#http://}"; DOMAIN_VAL="${DOMAIN_VAL#https://}"; DOMAIN_VAL="${DOMAIN_VAL%/}"

  if [ -n "$DOMAIN_VAL" ]; then
    SITE_ADDRESS="$DOMAIN_VAL"
    AUTH_URL_VAL="https://$DOMAIN_VAL"
    ACME_EMAIL_VAL="${ACME_EMAIL:-admin@$DOMAIN_VAL}"
    ok "وضع الدومين: $DOMAIN_VAL (شهادة SSL تلقائية)"
    RESOLVED="$(getent hosts "$DOMAIN_VAL" | awk '{print $1}' | head -1 || true)"
    if [ -n "$RESOLVED" ] && [ "$RESOLVED" != "$SERVER_IP" ]; then
      warn "الدومين يشاور على $RESOLVED بينما IP السيرفر $SERVER_IP — تأكد من سجل A"
    elif [ -z "$RESOLVED" ]; then
      warn "لم يتم العثور على سجل DNS للدومين بعد — شهادة SSL قد تتأخر حتى ينتشر السجل"
    else
      ok "الدومين موجّه صحيحاً إلى هذا السيرفر"
    fi
  else
    SITE_ADDRESS=":80"
    AUTH_URL_VAL="http://$SERVER_IP"
    ACME_EMAIL_VAL="admin@example.com"
    ok "وضع بدون دومين: الموقع سيعمل على http://$SERVER_IP"
  fi

  # --- بيانات المدير ---
  ADMIN_EMAIL_VAL="${ADMIN_EMAIL:-admin@${DOMAIN_VAL:-carsystem.local}}"
  ADMIN_PASS_VAL="${ADMIN_PASSWORD:-}"
  if [ -z "$ADMIN_PASS_VAL" ]; then
    ADMIN_PASS_VAL="Car@$(openssl rand -base64 12 | tr -d '/+=' | head -c 10)"
    warn "تم توليد كلمة مرور للمدير تلقائياً — ستُطبع في نهاية التنفيذ، احفظها"
  fi

  POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)"
  AUTH_SECRET="$(openssl rand -base64 48 | tr -d '/+=\n' | head -c 44)"

  cat > .env.docker <<ENVFILE
# ملف إعدادات النشر — تم توليده تلقائياً بواسطة deploy-remote.sh
DOMAIN=${SITE_ADDRESS}
ACME_EMAIL=${ACME_EMAIL_VAL}

POSTGRES_USER=carapp
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=carsystem

AUTH_SECRET=${AUTH_SECRET}
AUTH_URL=${AUTH_URL_VAL}
NEXTAUTH_URL=${AUTH_URL_VAL}

NEXT_PUBLIC_WORKSHOP_NAME=مركز الصيانة الذكي

ADMIN_NAME=مدير النظام
ADMIN_EMAIL=${ADMIN_EMAIL_VAL}
ADMIN_PASSWORD=${ADMIN_PASS_VAL}

SEED_ON_START=true
SEED_DEMO=false

TZ=Africa/Cairo
ENVFILE
  chmod 600 .env.docker
  ok "تم إنشاء .env.docker بمفاتيح عشوائية آمنة (صلاحيات 600)"
fi

# ---------------------------------------------------------------------
say "5/6 بناء وتشغيل الحاويات (3–6 دقائق في أول مرة)"
# تحرير المنفذين 80 و 443 من أي خدمة قديمة
systemctl stop nginx apache2 httpd 2>/dev/null || true
systemctl disable nginx apache2 httpd 2>/dev/null || true

$COMPOSE --env-file .env.docker up -d --build

# فتح المنافذ في الجدار الناري
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 22/tcp   >/dev/null 2>&1 || true
  ufw allow 80/tcp   >/dev/null 2>&1 || true
  ufw allow 443/tcp  >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------------
say "6/6 التحقق من حالة النظام"
echo "  في انتظار جاهزية التطبيق وقاعدة البيانات..."
for i in $(seq 1 20); do
  STATE="$(docker inspect -f '{{.State.Health.Status}}' carsystem-app 2>/dev/null || echo starting)"
  [ "$STATE" = "healthy" ] && break
  sleep 4
done

echo ""
$COMPOSE --env-file .env.docker ps
echo ""
echo "  آخر سطور سجل التطبيق:"
$COMPOSE --env-file .env.docker logs --tail=15 app 2>&1 | sed 's/^/    /'

HEALTH_URL="http://localhost/"
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$HEALTH_URL" 2>/dev/null || true)"
HTTP_CODE="${HTTP_CODE:-000}"

# ---------------------------------------------------------------------
echo ""
printf '\033[1;35m════════════════════════════════════════════════════════════\033[0m\n'
printf '\033[1;32m  ✅ تم النشر بنجاح\033[0m\n'
printf '\033[1;35m════════════════════════════════════════════════════════════\033[0m\n'
if [ "$HTTP_CODE" = "200" ]; then
  printf '  🌐 الموقع يعمل داخلياً (HTTP %s)\n' "$HTTP_CODE"
else
  printf '  ⚠️  الاستجابة الداخلية: HTTP %s — راجع السجلات بالأعلى\n' "$HTTP_CODE"
fi
echo ""
FV="$(grep -m1 '^DOMAIN=' .env.docker | cut -d= -f2-)"
if [ "$FV" = ":80" ]; then
  printf '  🌍 رابط الموقع:  \033[1;36mhttp://%s\033[0m\n' "$SERVER_IP"
  printf '     (لتفعيل HTTPS: rm .env.docker ثم أعد التشغيل مع DOMAIN=your-domain.com)\n'
else
  printf '  🌍 رابط الموقع:  \033[1;36mhttps://%s\033[0m\n' "$FV"
fi
printf '  🔐 لوحة التحكم:  %s/login\n' "$(grep -m1 '^AUTH_URL=' .env.docker | cut -d= -f2-)"
printf '  👤 بريد المدير:  %s\n' "$ADMIN_EMAIL_VAL"
printf '  🔑 كلمة المرور:  \033[1;33m%s\033[0m\n' "$ADMIN_PASS_VAL"
echo "     ⚠️  غيّرها من صفحة «المستخدمون» بعد أول دخول."
echo ""
echo "  ملف الإعدادات (فيه كلمات المرور — لا تشاركه): $APP_DIR/.env.docker"
echo ""
echo "  أوامر مفيدة:"
echo "    cd $APP_DIR && $COMPOSE --env-file .env.docker logs -f app      # متابعة السجل"
echo "    cd $APP_DIR && $COMPOSE --env-file .env.docker restart app      # إعادة تشغيل"
echo "    cd $APP_DIR && bash scripts/backup.sh                          # نسخة احتياطية"
echo ""
echo "  لجدولة نسخة احتياطية يومية 3 صباحاً:"
echo "    (crontab -l 2>/dev/null; echo '0 3 * * * cd $APP_DIR && bash scripts/backup.sh >> /var/log/carsystem-backup.log 2>&1') | crontab -"
printf '\033[1;35m════════════════════════════════════════════════════════════\033[0m\n'
