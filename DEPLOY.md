# دليل النشر على VPS (Docker + HTTPS تلقائي)

هذا الدليل يشرح خطوة بخطوة كيفية نشر **نظام حجز صيانة السيارات** على سيرفر VPS
خاص بك باستخدام **Docker Compose** ودومين بشهادة SSL مجانية تلقائية.

---

## 0. نظرة عامة على المعمارية

```
العميل (المتصفح)
      │  HTTPS (443)
      ▼
   Caddy  ──────────►  تطبيق Next.js (المنفذ 3000 داخلياً)  ──────────►  PostgreSQL 17
(شهادة SSL تلقائية)                                                    (بيانات محفوظة في volume)
```

- **Caddy**: يجلب شهادة SSL مجاناً من Let's Encrypt لدومينك ويوجّه الطلبات للتطبيق.
- **App**: تطبيق Next.js صورة إنتاجية (standalone) — يطبّق الـ migrations تلقائياً عند التشغيل.
- **DB**: PostgreSQL مع تخزين دائم حتى لو أُعيد بناء الحاويات.

لا حاجة لتثبيت Node أو PostgreSQL على السيرفر — كل شيء داخل Docker.

---

## 1. المتطلبات

| المتطلب | التفاصيل |
|---|---|
| VPS | Ubuntu 22.04/24.04 أو Debian (1 GB RAM كافية، 2 GB أفضل) |
| دومين | سجل **A** يشاور على IP السيرفر |
| صلاحية | دخول SSH بحساب root أو مستخدم في مجموعة sudo |
| منافذ | 80 و 443 مفتوحة |

### 1.1 الدومين (مهم قبل أي شيء)

من لوحة تحكم الدومين أضف سجلاً:

```
النوع: A     الاسم: cars      القيمة: IP_السيرفر      TTL: 3600
```

فيصبح الدومين `cars.example.com`. تأكد أن السجل انتشر قبل تشغيل Caddy:

```bash
dig +short cars.example.com
# يجب أن يظهر IP السيرفر
```

### 1.2 تثبيت Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo apt-get install -y docker-compose-plugin || sudo apt-get install -y docker-compose
sudo docker --version
sudo docker compose version     # لو الأمر مش موجود استخدم: docker-compose
```

> لو `docker compose` (بمسافة) غير متاح، استبدله في كل الأوامر التالية بـ `docker-compose`.

### 1.3 الجدار الناري (لو مُفعّل)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2. رفع الكود على السيرفر

**الطريقة الأسهل — من GitHub مباشرة على السيرفر:**

```bash
ssh root@IP_السيرفر
cd /root
git clone https://github.com/mahamed73/carsystem.git
cd carsystem
```

**أو من جهازك عبر SCP:**

```bash
# على جهازك
tar --exclude=node_modules --exclude=.next -czf carsystem.tar.gz .
scp carsystem.tar.gz root@IP_السيرفر:/root/
# على السيرفر
cd /root && mkdir -p carsystem && tar -xzf carsystem.tar.gz -C carsystem && cd carsystem
```

---

## 3. إعداد متغيرات البيئة

```bash
cp .env.docker.example .env.docker
nano .env.docker
```

املأ القيم التالية (الأهم):

```env
DOMAIN=cars.example.com                    # دومينك بدون https://
ACME_EMAIL=your@email.com                  # بريدك

POSTGRES_USER=carapp
POSTGRES_PASSWORD=ضع-كلمة-مرور-قوية         # openssl rand -base64 24
POSTGRES_DB=carsystem

AUTH_SECRET=ضع-مفتاحاً-عشوائياً-طويلاً        # openssl rand -base64 32
AUTH_URL=https://cars.example.com
NEXTAUTH_URL=https://cars.example.com

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=كلمة-مرور-المدير-القوية
```

لتوليد القيم العشوائية:

```bash
openssl rand -base64 24   # لكلمة مرور قاعدة البيانات
openssl rand -base64 32   # لـ AUTH_SECRET
```

> ⚠️ **مهم:** لا تشارك ملف `.env.docker` مع أي شخص، وهو مستثنى من Git تلقائياً.
> إن فقدت `AUTH_SECRET` ستفقد كل جلسات الدخول (يحتاج الجميع لتسجيل الدخول من جديد).

---

## 4. التشغيل

```bash
sudo docker compose --env-file .env.docker up -d --build
```

⏳ أول بناء يستغرق 3–6 دقائق. تابع السجل:

```bash
sudo docker compose --env-file .env.docker logs -f app
```

المفروض تشوف:

```
▶ انتظار قاعدة البيانات وتطبيق المخطط (migrations)...
✅ تم تطبيق مخطط قاعدة البيانات بنجاح.
▶ تهيئة البيانات الأولية (خدمات + مدير النظام)...
✅ تم إنشاء حساب المدير: admin@example.com
✅ جاهز — تشغيل السيرفر على المنفذ 3000
```

ثم افتح المتصفح على: **https://cars.example.com**

---

## 5. التحقق بعد النشر

```bash
# حالة الحاويات (لازم كلها Up)
sudo docker compose --env-file .env.docker ps

# فحص الصحة
curl -I https://cars.example.com

# تجربة الحجز
# افتح الموقع ← اختر خدمة ← اختر موعد ← أكمل البيانات ← يجب أن يظهر رقم مرجعي CR-XXXXXX-XXXX

# لوحة التحكم
# https://cars.example.com/login  ← دخول بالبريد وكلمة المرور من .env.docker
```

شهادة SSL تُصدر تلقائياً خلال أول دقيقة. لو ظهرت مشكلة:

```bash
sudo docker compose --env-file .env.docker logs caddy | tail -30
```

---

## 6. النسخ الاحتياطي (لا تتجاهله)

```bash
# نسخة احتياطية يدوية
bash scripts/backup.sh

# جدولة يومية 3 صباحاً
crontab -e
# أضف السطر:
0 3 * * * cd /root/carsystem && bash scripts/backup.sh >> /var/log/carsystem-backup.log 2>&1
```

النسخ تُخزَّن في `backups/` وتُحذف تلقائياً بعد 14 يوماً.

**الاستعادة:**

```bash
gunzip -c backups/carsystem_2026-09-10_03-00.sql.gz | \
  sudo docker compose --env-file .env.docker exec -T db \
  psql -U carapp -d carsystem
```

> 💡 نصيحة: انقل مجلد `backups/` لخدمة تخزين خارجية (Google Drive / S3) مرة أسبوعياً.

---

## 7. التحديث لنسخة جديدة من الكود

```bash
cd /root/carsystem
git pull
sudo docker compose --env-file .env.docker up -d --build
```

التحديث يطبّق أي migrations جديدة تلقائياً، والبيانات تبقى كما هي.

---

## 8. الأوامر اليومية السريعة

| الغرض | الأمر |
|---|---|
| عرض الحالة | `sudo docker compose --env-file .env.docker ps` |
| متابعة السجل | `sudo docker compose --env-file .env.docker logs -f app` |
| إيقاف | `sudo docker compose --env-file .env.docker stop` |
| تشغيل | `sudo docker compose --env-file .env.docker start` |
| إعادة تشغيل التطبيق فقط | `sudo docker compose --env-file .env.docker restart app` |
| نسخة احتياطية | `bash scripts/backup.sh` |
| دخول psql | `sudo docker compose --env-file .env.docker exec db psql -U carapp -d carsystem` |
| تصدير Excel لكل الحجوزات | من لوحة التحكم ← التقارير ← «تصدير كل الحجوزات» |

---

## 9. حل المشاكل الشائعة

### الشهادة لم تُصدر / الموقع لا يفتح بـ HTTPS
1. تأكد أن الدومين يشاور على IP السيرفر: `dig +short your-domain.com`
2. تأكد أن المنفذين 80 و 443 مفتوحان: `sudo ss -tlnp | grep -E ':80|:443'`
3. راجع سجل Caddy: `sudo docker compose --env-file .env.docker logs caddy`

### `port is already allocated`
هناك خدمة تشغل 80 أو 443 (Apache/Nginx):

```bash
sudo systemctl stop nginx apache2 2>/dev/null
sudo systemctl disable nginx apache2 2>/dev/null
sudo docker compose --env-file .env.docker up -d
```

### التطبيق يعيد التشغيل باستمرار (Restarting)
غالباً مشكلة في قاعدة البيانات أو `DATABASE_URL`:

```bash
sudo docker compose --env-file .env.docker logs app | tail -40
sudo docker compose --env-file .env.docker logs db  | tail -40
```

### نسيت كلمة مرور المدير
```bash
sudo docker compose --env-file .env.docker exec app \
  node -e "
const bcrypt=require('bcryptjs');const {Client}=require('pg');
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
const h=await bcrypt.hash('NewPass@123',10);
await c.query('UPDATE users SET password_hash=\$1 WHERE email=\$2',[h,'admin@example.com']);
console.log('تم التغيير');await c.end();})();"
```

### أريد إعادة تعيين كل شيء (حذف البيانات!)
```bash
sudo docker compose --env-file .env.docker down -v   # ⚠️ يحذف قاعدة البيانات بالكامل
sudo docker compose --env-file .env.docker up -d --build
```

---

## 10. ملاحظات أمنية

- غيّر `ADMIN_PASSWORD` فور أول دخول من صفحة **المستخدمون**.
- عطّل أي حساب موظف تركه العمل (لا تحذفه) من صفحة المستخدمين.
- لا تفتح المنفذ 5432 (قاعدة البيانات) على الإنترنت — في هذا الإعداد لا تُنشر أصلاً.
- حدّث السيرفر دورياً: `sudo apt update && sudo apt upgrade -y` ثم إعادة التشغيل.
- فعّل التسجيل في الـ cron للنسخ الاحتياطي وتابع ملف السجل أسبوعياً.
