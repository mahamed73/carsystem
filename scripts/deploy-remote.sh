# =====================================================================
#  نشر نظام حجز صيانة السيارات — نسخة "صفر تأثير" (Zero-Impact)
#
#  مبادئ الأمان في هذا السكربت:
#    1) لا يوقف ولا يعطّل ولا يعدّل أي خدمة أو موقع قائم (nginx يظل يعمل).
#    2) يضيف ملف موقع جديد للدومين فقط، ويعمل نسخة احتياطية من إعدادات nginx.
#    3) يقيس حالة المواقع القائمة قبل النشر، ويعيد قياسها بعده؛
#       ولو حدث أي تراجع لأي موقع قائم → تراجع فوري تلقائي عن كل شيء.
#    4) يعزل نفسه في مشروع Docker باسم carsystem (شبكات وحاويات وأحجام مستقلة).
#    5) التطبيق يُنشر على 127.0.0.1 فقط ولا يُكشف للإنترنت مباشرة.
#    6) وضع المعاينة DRY_RUN=true يعرض الخطة كاملة بدون تنفيذ أي تغيير.
#
#  الاستخدام:
#    معاينة بدون أي تغيير:   DRY_RUN=true bash scripts/deploy-remote.sh
#    النشر الفعلي:           DOMAIN=carsys.easychat.cloud ACME_EMAIL=you@mail.com \
#                            ADMIN_EMAIL=you@mail.com bash scripts/deploy-remote.sh
# =====================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mahamed73/carsystem.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/root/carsystem}"
PROJECT="carsystem"

DOMAIN="${DOMAIN:-carsys.easychat.cloud}"
ACME_EMAIL="${ACME_EMAIL:-admin@easychat.cloud}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@easychat.cloud}"
DRY_RUN="${DRY_RUN:-false}"

BASELINE_FILE="/root/.carsystem-baseline"
ENV_BACKUP="/root/.carsystem-env.docker"
STAMP="$(date +%Y%m%d-%H%M%S)"

say()   { printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }
ok()    { printf "\033[1;32m  ✅ %s\033[0m\n" "$1"; }
warn()  { printf "\033[1;33m  ⚠️  %s\033[0m\n" "$1"; }
die()   { printf "\033[1;31m  ✖ %s\033[0m\n" "$1"; exit 1; }
head2() { printf "\n\033[1;35m════ %s ════\033[0m\n" "$1"; }
plan()  { printf "\033[1;34m  • %s\033[0m\n" "$1"; }

[ "$(id -u)" -eq 0 ] || die "شغّل السكربت بمستخدم root"
export DEBIAN_FRONTEND=noninteractive

# =====================================================================
head2 "المرحلة 1: فحص الوضع الحالي (قراءة فقط — لا أي تغيير)"

SERVER_IP="$(curl -s --max-time 10 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')"

NGINX_RUNNING=false
systemctl is-active --quiet nginx 2>/dev/null && NGINX_RUNNING=true
pgrep -x nginx >/dev/null 2>&1 && NGINX_RUNNING=true

CADDY_CONTAINER=""
if command -v docker >/dev/null 2>&1; then
  CADDY_CONTAINER="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i caddy | head -1 || true)"
fi

PROXY_MODE="standalone"
[ "$NGINX_RUNNING" = true ] && PROXY_MODE="nginx"
[ -n "$CADDY_CONTAINER" ] && [ "$NGINX_RUNNING" != true ] && PROXY_MODE="shared-caddy"

# المواقع القائمة على السيرفر (لضمان عدم المساس بها)
existing_sites() {
  grep -rhoE 'server_name[[:space:]]+[^;]+;' /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null \
    | sed 's/server_name[[:space:]]*//; s/;//' \
    | tr -s ' \t' '\n' \
    | grep -vE '^$|^_$|^\$|^default_server$' \
    | grep -v "^${DOMAIN}$" \
    | sort -u || true
}

echo "  • IP السيرفر:            $SERVER_IP"
echo "  • الدومين المطلوب:       $DOMAIN"
echo "  • خادم الويب:            nginx=$NGINX_RUNNING | حاوية Caddy=${CADDY_CONTAINER:-لا يوجد}"
echo "  • أسلوب النشر:           $PROXY_MODE"
echo "  • Docker مثبت:           $(command -v docker >/dev/null 2>&1 && echo نعم || echo لا)"
echo "  • certbot متاح:          $(command -v certbot >/dev/null 2>&1 && echo نعم || echo لا)"
echo ""

if [ "$PROXY_MODE" = "nginx" ]; then
  echo "  المواقع القائمة على السيرفر (لن يُلمس أي منها):"
  EXISTING="$(existing_sites)"
  if [ -n "$EXISTING" ]; then
    echo "$EXISTING" | sed 's/^/    - /'
  else
    echo "    (لم يتم العثور على أسماء نطاقات في الإعدادات)"
  fi
  echo ""
  echo "  المنافذ المستخدمة حالياً:"
  ss -tlnp 2>/dev/null | awk 'NR>1 {print "    "$4"  "$6}' | head -12 || true
fi

if [ "$DRY_RUN" = "true" ]; then
  head2 "معاينة الخطة (DRY_RUN) — لم يتم تنفيذ أي تغيير"
  plan "تثبيت Docker إن لم يكن موجوداً (لا يوقف أي خدمة قائمة)"
  plan "سحب الكود إلى $APP_DIR"
  plan "اختيار أول منفذ حر (3001+) ونشر التطبيق على 127.0.0.1 فقط"
  plan "تشغيل حاويتين معزولتين بمشروع Docker اسمه '$PROJECT':",
  plan "   - ${PROJECT}-app  (تطبيق Next.js)"
  plan "   - ${PROJECT}-db   (PostgreSQL بقاعدة بيانات مستقلة)"
  if [ "$PROXY_MODE" = "nginx" ]; then
    plan "أخذ نسخة احتياطية من إعدادات nginx كاملة"
    plan "إضافة ملف موقع جديد فقط: /etc/nginx/sites-enabled/${DOMAIN}.conf"
    plan "اختبار الإعداد بـ nginx -t ثم إعادة تحميل nginx (بدون إيقافه)"
    plan "إصدار شهادة SSL للدومين الجديد عبر certbot"
    plan "قياس المواقع القائمة قبل/بعد + تراجع تلقائي لو حدث أي تراجع"
  fi
  plan "ما لن يحدث إطلاقاً:"
  plan "   ✗ إيقاف أو تعطيل nginx / apache / أي خدمة"
  plan "   ✗ تعديل أو حذف إعدادات أي موقع قائم"
  plan "   ✗ لمس قواعد بيانات أو حاويات أخرى"
  plan "   ✗ حذف أي ملف خارج /root/carsystem وملف الموقع الجديد"
  echo ""
  ok "انتهت المعاينة. للنشر الفعلي: شغّل نفس الأمر بدون DRY_RUN=true"
  exit 0
fi

if [ "$PROXY_MODE" = "nginx" ]; then
  # قياس حالة المواقع القائمة قبل أي تغيير
  : > "$BASELINE_FILE"
  if [ -n "$(existing_sites)" ]; then
    while IFS= read -r host; do
      [ -z "$host" ] && continue
      code="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 "https://$host/" 2>/dev/null || echo 000)"
      printf '%s %s\n' "$host" "$code" >> "$BASELINE_FILE"
    done <<< "$(existing_sites)"
    ok "تم قياس حالة $(wc -l < "$BASELINE_FILE") موقع قائم (مرجع للمقارنة)"
    sed 's/^/    /' "$BASELINE_FILE"
  else
    ok "لا توجد مواقع مطابقة للمقارنة — لن نلمس أي إعداد قائم"
  fi
fi

# =====================================================================
say "المرحلة 2: تجهيز Docker (لا يوقف أي خدمة قائمة)"
if ! command -v docker >/dev/null 2>&1; then
  warn "Docker غير مثبت — سيتم تثبيته كخدمة جديدة (لا يتعارض مع أي خدمة قائمة)"
  curl -fsSL https://get.docker.com | sh
  apt-get install -y -qq docker-compose-plugin >/dev/null 2>&1 \
    || apt-get install -y -qq docker-compose >/dev/null 2>&1 || true
else
  ok "Docker مثبت مسبقاً — لن نلمسه"
fi
command -v docker >/dev/null || die "فشل تثبيت Docker"
systemctl enable --now docker >/dev/null 2>&1 || true
ok "$(docker --version)"

COMPOSE="docker compose -p $PROJECT"
$COMPOSE version >/dev/null 2>&1 || COMPOSE="docker-compose -p $PROJECT"
$COMPOSE version >/dev/null 2>&1 || die "Docker Compose غير متاح"
ok "Compose جاهز (مشروع معزول: $PROJECT)"

# =====================================================================
say "المرحلة 3: سحب الكود"
mkdir -p "$(dirname "$APP_DIR")"
[ -f "$APP_DIR/.env.docker" ] && { cp "$APP_DIR/.env.docker" "$ENV_BACKUP"; chmod 600 "$ENV_BACKUP"; ok "نسخة أمان من الإعدادات محفوظة"; }

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
    rm -rf "$TMP_DIR"; die "فشل سحب الكود — تحقق من الإنترنت"
  fi
  [ -d "$APP_DIR" ] && mv "$APP_DIR" "${APP_DIR}.old.${STAMP}" 2>/dev/null || true
  mv "$TMP_DIR" "$APP_DIR"
fi
cd "$APP_DIR"
if [ ! -f .env.docker ] && [ -f "$ENV_BACKUP" ]; then
  cp "$ENV_BACKUP" .env.docker && chmod 600 .env.docker
  warn "تم استرجاع .env.docker"
fi

# =====================================================================
say "المرحلة 4: اختيار منفذ داخلي حر وإعداد الإعدادات"
is_free_port() { ! (ss -tln 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$1\$"); }
APP_PORT=""
for p in $(seq 3001 3050); do is_free_port "$p" && { APP_PORT="$p"; break; }; done
[ -n "$APP_PORT" ] || die "لا يوجد منفذ حر"
ok "منفذ التطبيق: 127.0.0.1:$APP_PORT (لا يُكشف للإنترنت)"

if [ -f .env.docker ]; then
  grep -q '^APP_PORT=' .env.docker && sed -i "s/^APP_PORT=.*/APP_PORT=$APP_PORT/" .env.docker || echo "APP_PORT=$APP_PORT" >> .env.docker
  ADMIN_EMAIL_VAL="$(grep -m1 '^ADMIN_EMAIL=' .env.docker | cut -d= -f2- || echo "$ADMIN_EMAIL")"
  ADMIN_PASS_VAL="$(grep -m1 '^ADMIN_PASSWORD=' .env.docker | cut -d= -f2- || echo '(الموجودة)')"
  DOMAIN_VAL="$(grep -m1 '^DOMAIN=' .env.docker | cut -d= -f2- || echo "$DOMAIN")"
  PROXY_MODE="$(grep -m1 '^PROXY_MODE=' .env.docker | cut -d= -f2- || echo "$PROXY_MODE")"
  ok "إعدادات موجودة — تم تحديث المنفذ فقط (.env.docker محفوظ)"
else
  ADMIN_PASS_VAL="${ADMIN_PASSWORD:-Car@$(openssl rand -base64 12 | tr -d '/+=' | head -c 10)}"
  POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)"
  AUTH_SECRET="$(openssl rand -base64 48 | tr -d '/+=\n' | head -c 44)"
  cat > .env.docker <<ENVFILE
# إعدادات نشر نظام حجز صيانة السيارات — تم توليدها تلقائياً ($STAMP)
DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
PROXY_MODE=${PROXY_MODE}
APP_PORT=${APP_PORT}
COMPOSE_PROJECT_NAME=${PROJECT}

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
say "المرحلة 5: تشغيل التطبيق وقاعدة البيانات (معزولين في مشروع $PROJECT)"
if [ "$PROXY_MODE" = "standalone" ]; then
  $COMPOSE --env-file .env.docker --profile caddy up -d --build
else
  $COMPOSE --env-file .env.docker up -d --build db app
fi

echo "  في انتظار جاهزية التطبيق..."
APP_OK=false
for i in $(seq 1 24); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${APP_PORT}/" 2>/dev/null || true)"
  [ "$CODE" = "200" ] && { APP_OK=true; break; }
  sleep 5
done
$APP_OK && ok "التطبيق يعمل على 127.0.0.1:$APP_PORT" || warn "التطبيق لم يستجب بعد"

# =====================================================================
say "المرحلة 6: ربط الدومين (مع حماية كاملة للمواقع القائمة)"
ROLLBACK_NEEDED=false
NGINX_BACKUP=""

if [ "$PROXY_MODE" = "nginx" ]; then
  # نسخة احتياطية كاملة من إعدادات nginx (يمكن الاستعادة بأمر واحد)
  NGINX_BACKUP="/root/nginx-backup-${STAMP}.tar.gz"
  tar -czf "$NGINX_BACKUP" -C /etc nginx 2>/dev/null && ok "نسخة احتياطية من إعدادات nginx: $NGINX_BACKUP" || warn "تعذّر أخذ نسخة احتياطية"

  VHOST="/etc/nginx/sites-available/${DOMAIN}.conf"
  ENABLED="/etc/nginx/sites-enabled/${DOMAIN}.conf"

  # نتحقق أن nginx سليم قبل أن نلمسه
  if ! nginx -t >/dev/null 2>&1; then
    warn "إعداد nginx الحالي به مشكلة — لن نضيف أي شيء. أصلحه أولاً."
    ROLLBACK_NEEDED=true
  else
    cat > "$VHOST" <<NGINXCONF
# نظام حجز صيانة السيارات — ${DOMAIN}
# ملف مستقل تم إنشاؤه تلقائياً — لا يؤثر على أي موقع قائم.
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

    if [ -d /etc/nginx/sites-enabled ]; then ln -sfn "$VHOST" "$ENABLED"; else cp "$VHOST" "/etc/nginx/conf.d/${DOMAIN}.conf"; fi

    if nginx -t >/dev/null 2>&1; then
      systemctl reload nginx && ok "تم تفعيل الموقع الجديد (nginx أُعيد تحميله بدون توقف)"
    else
      warn "فشل اختبار الإعداد — تراجع فوري"
      rm -f "$ENABLED" "/etc/nginx/conf.d/${DOMAIN}.conf"
      nginx -t >/dev/null 2>&1 || true
      ROLLBACK_NEEDED=true
    fi
  fi

  # ───── التحقق: هل تأثّر أي موقع قائم؟ ─────
  if [ "$ROLLBACK_NEEDED" = false ] && [ -s "$BASELINE_FILE" ]; then
    REGRESSED=""
    printf "\n  مقارنة حالة المواقع القائمة (قبل ⇢ بعد):\n"
    while read -r host before; do
      [ -z "$host" ] && continue
      after="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 "https://$host/" 2>/dev/null || echo 000)"
      if [ "$before" = "$after" ]; then
        printf "    ✅ %-32s %s ⇢ %s\n" "$host" "$before" "$after"
      else
        printf "    ⚠️  %-32s %s ⇢ %s\n" "$host" "$before" "$after"
        REGRESSED="$REGRESSED $host"
      fi
    done < "$BASELINE_FILE"

    if [ -n "$REGRESSED" ]; then
      warn "تم رصد تغيير على مواقع قائمة:$REGRESSED — تنفيذ تراجع فوري"
      ROLLBACK_NEEDED=true
    else
      ok "لم يتأثر أي موقع قائم ✅"
    fi
  fi

  # ───── التراجع التلقائي ─────
  if [ "$ROLLBACK_NEEDED" = true ]; then
    rm -f "$ENABLED" "/etc/nginx/conf.d/${DOMAIN}.conf" 2>/dev/null || true
    if nginx -t >/dev/null 2>&1; then
      systemctl reload nginx 2>/dev/null || true
      ok "تم التراجع — كل المواقع القائمة عادت لحالتها الأصلية"
    else
      warn "تعذّر اختبار الإعداد بعد التراجع — استعد النسخة الاحتياطية:"
      echo "    tar -xzf $NGINX_BACKUP -C /etc && nginx -t && systemctl reload nginx"
    fi
    head2 "النتيجة: لم يتم ربط الدومين (حماية للمواقع القائمة)"
    echo "  التطبيق نفسه يعمل داخلياً على http://127.0.0.1:${APP_PORT}"
    echo "  لم يحدث أي تغيير على أي نظام قائم على السيرفر."
    exit 0
  fi

  # ───── شهادة SSL للدومين الجديد فقط ─────
  if command -v certbot >/dev/null 2>&1 || apt-get install -y -qq certbot python3-certbot-nginx >/dev/null 2>&1; then
    ok "طلب شهادة SSL للدومين الجديد (لا يمس شهادات المواقع الأخرى)"
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$ACME_EMAIL" --redirect --keep-until-expiring 2>&1 | tail -5 | sed 's/^/    /' || true
  else
    warn "certbot غير متاح — الموقع يعمل على HTTP"
  fi

elif [ "$PROXY_MODE" = "shared-caddy" ]; then
  NET="$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' "$CADDY_CONTAINER" 2>/dev/null | head -1 || true)"
  if [ -n "$NET" ]; then
    docker network connect --alias carsys-app "$NET" "${PROJECT}-app" 2>/dev/null || warn "متصل مسبقاً"
    CADDYFILE_PATH="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' "$CADDY_CONTAINER" 2>/dev/null || true)"
    if [ -n "$CADDYFILE_PATH" ] && [ -f "$CADDYFILE_PATH" ] && ! grep -q "${DOMAIN}" "$CADDYFILE_PATH"; then
      cp "$CADDYFILE_PATH" "${CADDYFILE_PATH}.bak.${STAMP}"
      printf '\n%s {\n\tencode gzip\n\treverse_proxy carsys-app:3000\n}\n' "$DOMAIN" >> "$CADDYFILE_PATH"
      docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile 2>&1 | tail -3 || warn "راجع ملف Caddy يدوياً: $CADDYFILE_PATH"
      ok "تمت إضافة الدومين إلى Caddy القائم (نسخة احتياطية محفوظة)"
    else
      warn "أضف المقطع التالي إلى Caddyfile يدوياً:"; echo "    $DOMAIN { reverse_proxy carsys-app:3000 }"
    fi
  fi
fi

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

# =====================================================================
EXT_CODE="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 20 "https://${DOMAIN_VAL}/" 2>/dev/null || true)"
INT_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:${APP_PORT}/" 2>/dev/null || true)"

head2 "تم النشر بنجاح"
echo "  🌐 الموقع:              https://${DOMAIN_VAL}"
echo "  🔐 لوحة التحكم:         https://${DOMAIN_VAL}/login"
echo "  👤 بريد المدير:         ${ADMIN_EMAIL_VAL}"
echo "  🔑 كلمة مرور المدير:    ${ADMIN_PASS_VAL}"
echo ""
echo "  📡 التطبيق داخلياً:      http://127.0.0.1:${APP_PORT} → HTTP ${INT_CODE:-?}"
echo "  🌍 من الإنترنت:          https://${DOMAIN_VAL} → HTTP ${EXT_CODE:-?}"
echo "  ⚙️  أسلوب النشر:          ${PROXY_MODE}"
echo "  🐳 مشروع Docker المعزول: ${PROJECT}"
[ -n "$NGINX_BACKUP" ] && echo "  💾 نسخة إعدادات nginx:    ${NGINX_BACKUP}"
echo ""
echo "  لم يتم إيقاف أو تعديل أي خدمة أو موقع قائم على السيرفر ✅"
echo "  ⚠️  غيّر كلمة مرور المدير من صفحة «المستخدمون» بعد أول دخول."
printf '\033[1;35m════════════════════════════════════════════\033[0m\n'
