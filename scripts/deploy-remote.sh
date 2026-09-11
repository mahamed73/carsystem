# =====================================================================
#  نشر نظام حجز صيانة السيارات — نسخة آمنة تتكامل مع السيرفر الحالي
#
#  تكتشف تلقائياً طريقة استضافة المواقع على السيرفر وتتكيّف:
#    1) nginx مُثبت على النظام (وضع هذا السيرفر) → نضيف موقعاً جديداً فقط
#       ولا نلمس أي موقع قائم، مع شهادة SSL عبر certbot.
#    2) Caddy داخل Docker يشغل 80/443 → نتشارك معه بدون تعطيله.
#    3) لا يوجد أي منهما → نشغّل Caddy خاصاً بنا.
#
#  الاستخدام (أمر واحد على السيرفر بمستخدم root):
#     DOMAIN=carsys.easychat.cloud ACME_EMAIL=admin@easychat.cloud \
#     ADMIN_EMAIL=admin@easychat.cloud bash deploy-remote.sh
# =====================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mahamed73/carsystem.git}"
BRANCH="${BRANCH:-arena/01a08cd4-carsystem}"
APP_DIR="${APP_DIR:-/root/carsystem}"

DOMAIN="${DOMAIN:-carsys.easychat.cloud}"
ACME_EMAIL="${ACME_EMAIL:-admin@easychat.cloud}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@easychat.cloud}"

say()   { printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }
ok()    { printf "\033[1;32m  ✅ %s\033[0m\n" "$1"; }
warn()  { printf "\033[1;33m  ⚠️  %s\033[0m\n" "$1"; }
die()   { printf "\033[1;31m  ✖ %s\033[0m\n" "$1"; exit 1; }
head2() { printf "\n\033[1;35m════ %s ════\033[0m\n" "$1"; }

[ "$(id -u)" -eq 0 ] || die "شغّل السكربت بمستخدم root"

export DEBIAN_FRONTEND=noninteractive

# =====================================================================
say "1/7 التحقق من المتطلبات الأساسية"
for pkg_cmd in "git:git" "curl:curl" "openssl:openssl"; do
  cmd="${pkg_cmd%%:*}"; pkg="${pkg_cmd##*:}"
  command -v "$cmd" >/dev/null 2>&1 || {
    apt-get update -qq || true
    apt-get install -y -qq "$pkg" ca-certificates >/dev/null 2>&1 || true
  }
done
command -v git >/dev/null || die "git غير متاح"
command -v curl >/dev/null || die "curl غير متاح"
command -v openssl >/dev/null || warn "openssl غير متاح — سيتم استخدام كلمة مرور افتراضية آمنة"
ok "الأدوات الأساسية جاهزة"

# =====================================================================
say "2/7 فحص طريقة الاستضافة على السيرفر (بدون أي تعديل)"
SERVER_IP="$(curl -s --max-time 10 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')"

NGINX_RUNNING=false
if systemctl is-active --quiet nginx 2>/dev/null || pgrep -x nginx >/dev/null 2>&1; then
  NGINX_RUNNING=true
fi

CADDY_CONTAINER=""
if command -v docker >/dev/null 2>&1; then
  CADDY_CONTAINER="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i caddy | head -1 || true)"
fi

PROXY_MODE="standalone"
if [ "$NGINX_RUNNING" = true ]; then
  PROXY_MODE="nginx"
elif [ -n "$CADDY_CONTAINER" ]; then
  PROXY_MODE="shared-caddy"
fi

echo "  • IP السيرفر: $SERVER_IP"
echo "  • الدومين: $DOMAIN"
echo "  • nginx يعمل: $NGINX_RUNNING"
echo "  • حاوية Caddy: ${CADDY_CONTAINER:-(لا يوجد)}"
echo "  • أسلوب النشر المختار: $PROXY_MODE"

if [ "$NGINX_RUNNING" = true ]; then
  ok "سنتكامل مع nginx الحالي — لن نوقف أو نعدّل أي موقع قائم"
  for d in /etc/nginx/sites-enabled /etc/nginx/conf.d; do
    [ -d "$d" ] && echo "    المواقع المسجّلة في $d: $(ls -1 "$d" 2>/dev/null | tr '\n' ' ')"
  done
fi

if [ "$PROXY_MODE" = "nginx" ]; then
  getent hosts "$DOMAIN" >/dev/null 2>&1 || warn "لا يوجد سجل DNS للدومين — سيعمل الموقع بالـ IP"
  RESOLVED="$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' | head -1 || true)"
  if [ -n "$RESOLVED" ] && [ "$RESOLVED" != "$SERVER_IP" ]; then
    warn "الدومين يشاور على $RESOLVED بينما IP السيرفر $SERVER_IP"
  fi
fi

# =====================================================================
say "3/7 تجهيز Docker (المستخدم للتطبيق وقاعدة البيانات فقط)"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  apt-get install -y -qq docker-compose-plugin >/dev/null 2>&1 \
    || apt-get install -y -qq docker-compose >/dev/null 2>&1 || true
fi
command -v docker >/dev/null || die "فشل تثبيت Docker"
systemctl enable --now docker >/dev/null 2>&1 || true
ok "$(docker --version)"

COMPOSE="docker compose"
$COMPOSE version >/dev/null 2>&1 || COMPOSE="docker-compose"
$COMPOSE version >/dev/null 2>&1 || die "Docker Compose غير متاح"
ok "Compose جاهز"

# =====================================================================
say "4/7 سحب الكود"
ENV_BACKUP="/root/.carsystem-env.docker"
mkdir -p "$(dirname "$APP_DIR")"

# حماية ملف الإعدادات (فيه كلمة مرور قاعدة البيانات) — لا يجوز فقدانه أبداً
if [ -f "$APP_DIR/.env.docker" ]; then
  cp "$APP_DIR/.env.docker" "$ENV_BACKUP" && chmod 600 "$ENV_BACKUP"
  ok "تم أخذ نسخة أمان من .env.docker"
fi

if [ -d "$APP_DIR/.git" ] && git -C "$APP_DIR" fetch --depth=1 origin "$BRANCH" 2>/dev/null; then
  git -C "$APP_DIR" checkout -q -B "$BRANCH" "origin/$BRANCH"
  git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
  ok "تم تحديث الكود (فرع $BRANCH)"
else
  TMP_DIR="${APP_DIR}.new.$$"
  rm -rf "$TMP_DIR"
  if git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$TMP_DIR" 2>/dev/null; then
    ok "تم سحب نسخة جديدة (فرع $BRANCH)"
  elif BRANCH=main && git clone --depth=1 --branch main "$REPO_URL" "$TMP_DIR" 2>/dev/null; then
    warn "تم استخدام الفرع main"
  else
    rm -rf "$TMP_DIR"
    die "فشل سحب الكود من GitHub — تحقق من اتصال السيرفر بالإنترنت"
  fi
  # نُبقي المجلد القديم كنسخة احتياطية بدل حذفه
  [ -d "$APP_DIR" ] && mv "$APP_DIR" "${APP_DIR}.old.$(date +%s)" 2>/dev/null || true
  mv "$TMP_DIR" "$APP_DIR"
fi
cd "$APP_DIR"

# استرجاع الإعدادات لو ضاعت أثناء التحديث
if [ ! -f .env.docker ] && [ -f "$ENV_BACKUP" ]; then
  cp "$ENV_BACKUP" .env.docker && chmod 600 .env.docker
  warn "تم استرجاع .env.docker من النسخة الاحتياطية"
fi

# =====================================================================
say "5/7 اختيار منفذ التطبيق وإعداد الإعدادات"
# اختيار منفذ حر غير مستخدم (بعيداً عن أي خدمة قائمة مثل موقع العيادة)
is_free_port() {
  ! (ss -tln 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$1\$")
}
APP_PORT=""
for p in $(seq 3001 3050); do
  if is_free_port "$p"; then APP_PORT="$p"; break; fi
done
[ -n "$APP_PORT" ] || die "لا يوجد منفذ حر في النطاق 3001-3050"
ok "منفذ التطبيق الداخلي: 127.0.0.1:$APP_PORT (غير مكشوف للإنترنت)"

if [ -f .env.docker ]; then
  ok ".env.docker موجود — لن نُعدّله"
  # نحدّث منفذ التطبيق فقط
  if grep -q '^APP_PORT=' .env.docker; then
    sed -i "s/^APP_PORT=.*/APP_PORT=$APP_PORT/" .env.docker
  else
    echo "APP_PORT=$APP_PORT" >> .env.docker
  fi
  ADMIN_EMAIL_VAL="$(grep -m1 '^ADMIN_EMAIL=' .env.docker | cut -d= -f2- || echo "$ADMIN_EMAIL")"
  ADMIN_PASS_VAL="$(grep -m1 '^ADMIN_PASSWORD=' .env.docker | cut -d= -f2- || echo '(الموجودة سابقاً)')"
  DOMAIN_VAL="$(grep -m1 '^DOMAIN=' .env.docker | cut -d= -f2- || echo "$DOMAIN")"
  PROXY_MODE_SAVED="$(grep -m1 '^PROXY_MODE=' .env.docker | cut -d= -f2- || echo "$PROXY_MODE")"
  PROXY_MODE="$PROXY_MODE_SAVED"
  ok "أسلوب النشر المحفوظ: $PROXY_MODE"
else
  ADMIN_PASS_VAL="${ADMIN_PASSWORD:-}"
  if [ -z "$ADMIN_PASS_VAL" ]; then
    ADMIN_PASS_VAL="Car@$(openssl rand -base64 12 | tr -d '/+=' | head -c 10)"
    warn "تم توليد كلمة مرور للمدير — ستُعرض في نهاية التنفيذ"
  fi
  POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)"
  AUTH_SECRET="$(openssl rand -base64 48 | tr -d '/+=\n' | head -c 44)"

  cat > .env.docker <<ENVFILE
# ملف إعدادات النشر — تم توليده تلقائياً
DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
PROXY_MODE=${PROXY_MODE}
APP_PORT=${APP_PORT}

POSTGRES_USER=carapp
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=carsystem

AUTH_SECRET=${AUTH_SECRET}
AUTH_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}

NEXT_PUBLIC_WORKSHOP_NAME=مركز الصيانة الذكي

ADMIN_NAME=مدير النظام
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASS_VAL}

SEED_ON_START=true
SEED_DEMO=false

TZ=Africa/Cairo
ENVFILE
  chmod 600 .env.docker
  DOMAIN_VAL="$DOMAIN"; ADMIN_EMAIL_VAL="$ADMIN_EMAIL"
  ok "تم إنشاء .env.docker (صلاحيات 600)"
fi

# =====================================================================
say "6/7 تشغيل التطبيق وقاعدة البيانات"
if [ "$PROXY_MODE" = "standalone" ]; then
  $COMPOSE --env-file .env.docker --profile caddy up -d --build
else
  # بدون Caddy: nginx (أو Caddy القائم) هو من يستقبل الزوار
  $COMPOSE --env-file .env.docker up -d --build db app
fi

# انتظار جاهزية التطبيق
echo "  في انتظار جاهزية التطبيق..."
APP_OK=false
for i in $(seq 1 24); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${APP_PORT}/" 2>/dev/null || true)"
  if [ "$CODE" = "200" ]; then APP_OK=true; break; fi
  sleep 5
done
$APP_OK && ok "التطبيق يستجيب على المنفذ الداخلي $APP_PORT" || warn "التطبيق لم يستجب بعد — سنكمل إعداد الويب"

# =====================================================================
say "7/7 ربط الدومين بشهادة SSL"

if [ "$PROXY_MODE" = "nginx" ]; then
  VHOST="/etc/nginx/sites-available/${DOMAIN}.conf"
  ENABLED="/etc/nginx/sites-enabled/${DOMAIN}.conf"

  if [ -f "$VHOST" ]; then
    ok "إعداد nginx للدومين موجود — سنحدّثه"
  else
    ok "إنشاء إعداد nginx جديد للدومين (بدون لمس أي موقع آخر)"
  fi

  cat > "$VHOST" <<NGINXCONF
# نظام حجز صيانة السيارات — ${DOMAIN}
# تم إنشاؤه تلقائياً. لا يؤثر على أي موقع آخر على السيرفر.
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    client_max_body_size 10m;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
NGINXCONF

  if [ -d /etc/nginx/sites-enabled ]; then
    ln -sfn "$VHOST" "$ENABLED"
  else
    cp "$VHOST" /etc/nginx/conf.d/"${DOMAIN}.conf"
  fi

  if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx && ok "تم تفعيل الموقع في nginx بنجاح"
  else
    err_line="$(nginx -t 2>&1 | tail -3)"
    rm -f "$ENABLED" /etc/nginx/conf.d/"${DOMAIN}.conf"
    nginx -t >/dev/null 2>&1 || true
    warn "فشل اختبار إعداد nginx — تم التراجع بدون أي تغيير"
    echo "$err_line" | sed 's/^/    /'
  fi

  # شهادة SSL تلقائية عبر certbot
  if command -v certbot >/dev/null 2>&1 || apt-get install -y -qq certbot python3-certbot-nginx >/dev/null 2>&1; then
    ok "certbot جاهز — طلب شهادة SSL للدومين"
    if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$ACME_EMAIL" --redirect --keep-until-expiring 2>&1 | tail -6 | sed 's/^/    /'; then
      ok "تم إعداد شهادة SSL"
    else
      warn "تعذّر إصدار الشهادة الآن — الموقع يعمل على HTTP ويمكن إعادة المحاولة لاحقاً"
    fi
  else
    warn "certbot غير متاح — الموقع يعمل على HTTP فقط"
  fi

elif [ "$PROXY_MODE" = "shared-caddy" ]; then
  NET="$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' "$CADDY_CONTAINER" 2>/dev/null | head -1 || true)"
  ok "سنتشارك Caddy القائم ($CADDY_CONTAINER) على الشبكة: ${NET:-—}"
  if [ -n "$NET" ]; then
    docker network connect --alias carsys-app "$NET" carsystem-app 2>/dev/null || warn "التطبيق متصل بالشبكة مسبقاً"
    CADDYFILE_PATH="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' "$CADDY_CONTAINER" 2>/dev/null || true)"
    BLOCK="
${DOMAIN} {
	encode gzip
	reverse_proxy carsys-app:3000
}"
    if [ -n "$CADDYFILE_PATH" ] && [ -f "$CADDYFILE_PATH" ] && ! grep -q "server_name\|${DOMAIN} {" "$CADDYFILE_PATH" 2>/dev/null; then
      cp "$CADDYFILE_PATH" "${CADDYFILE_PATH}.bak.$(date +%s)"
      printf '%s\n' "$BLOCK" >> "$CADDYFILE_PATH"
      if docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile 2>&1 | tail -3; then
        ok "تمت إضافة الدومين إلى Caddy القائم وإعادة التحميل"
      else
        warn "فشلت إعادة تحميل Caddy — راجع الملف: $CADDYFILE_PATH (نسخة احتياطية موجودة)"
      fi
    else
      warn "تعذّر تحديد ملف Caddyfile على المضيف — أضف المقطع التالي يدوياً:"
      printf '%s\n' "$BLOCK" | sed 's/^/    /'
    fi
  fi
fi

# فتح المنافذ
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 22/tcp >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

# =====================================================================
EXT_CODE="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 20 "https://${DOMAIN_VAL}/" 2>/dev/null || true)"
INT_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:${APP_PORT}/" 2>/dev/null || true)"

head2 "تم النشر"
echo "  🌐 رابط الموقع:        https://${DOMAIN_VAL}"
echo "  🔐 لوحة التحكم:        https://${DOMAIN_VAL}/login"
echo "  👤 بريد المدير:        ${ADMIN_EMAIL_VAL}"
echo "  🔑 كلمة مرور المدير:   ${ADMIN_PASS_VAL}"
echo ""
echo "  ⚙️  أسلوب النشر:        ${PROXY_MODE}"
echo "  📡 التطبيق داخلياً:     http://127.0.0.1:${APP_PORT} → HTTP ${INT_CODE:-?}"
echo "  🌍 من الإنترنت:         https://${DOMAIN_VAL} → HTTP ${EXT_CODE:-?}"
echo ""
echo "  ⚠️  غيّر كلمة مرور المدير من صفحة «المستخدمون» بعد أول دخول."
echo ""
echo "  الأوامر المفيدة:"
echo "    cd $APP_DIR && $COMPOSE --env-file .env.docker logs -f app"
echo "    cd $APP_DIR && $COMPOSE --env-file .env.docker restart app"
echo "    cd $APP_DIR && bash scripts/backup.sh"
printf '\033[1;35m════════════════════════════════════════════\033[0m\n'
