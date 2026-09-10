# =====================================================================
#  صورة إنتاجية متعددة المراحل لنظام حجز صيانة السيارات
#  تعتمد على مخرجات Next.js standalone لتقليل حجم الصورة وسرعة التشغيل
# =====================================================================

# ---------- 1) تثبيت الحزم ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- 2) البناء ----------
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# متغيرات وهمية وقت البناء فقط (القيم الحقيقية تُمرّر وقت التشغيل)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV AUTH_SECRET=build-time-placeholder-secret-not-used-in-runtime
RUN npm run build

# ---------- 3) التشغيل ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Africa/Cairo

RUN apk add --no-cache tzdata curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

# حزم يحتاجها سكربتا التهيئة (migrate.js / seed.js) ولا تُدرجها مخرجات standalone
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv

RUN chmod +x ./docker-entrypoint.sh && \
    # لا نريد أي ملفات .env محلية داخل الصورة — الإعدادات تُمرَّر من docker compose
    rm -f ./.env ./.env.local ./.env.production ./.env.development

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ > /dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
