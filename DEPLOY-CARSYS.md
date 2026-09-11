# ربط الدومين carsys.easychat.cloud

> حالة التحقق من الشبكة (تم فحصها من بيئة التحقق):
> - `carsys.easychat.cloud` → **187.77.71.18** ✅ (مطابق لـ IP السيرفر)
> - المنافذ 80 و 443 على السيرفر: تستجيب ✅
> - لا يوجد موقع منشور بعد على السيرفر

---

## أمر النشر (انسخه كما هو على السيرفر)

```bash
ssh root@187.77.71.18

git clone --depth=1 --branch arena/01a08cd4-carsystem \
  https://github.com/mahamed73/carsystem.git /root/carsystem \
&& DOMAIN=carsys.easychat.cloud \
   ACME_EMAIL=admin@easychat.cloud \
   ADMIN_EMAIL=admin@easychat.cloud \
   bash /root/carsystem/scripts/deploy-remote.sh
```

**ماذا يفعل هذا الأمر؟**

| الخطوة | التفصيل |
|---|---|
| 1 | ينزّل الكود من GitHub إلى `/root/carsystem` |
| 2 | يثبّت Docker + Docker Compose (لو مش موجودين) |
| 3 | يولّد `AUTH_SECRET` وكلمة مرور قاعدة بيانات عشوائية آمنة |
| 4 | ينشئ `.env.docker` بالدومين `carsys.easychat.cloud` وضبط HTTPS |
| 5 | يبني الحاويات ويشغّلها (تطبيق + PostgreSQL + Caddy) |
| 6 | يطلب شهادة SSL مجانية تلقائياً من Let's Encrypt للدومين |
| 7 | يفتح المنافذ 80 و 443 في الجدار الناري |
| 8 | يطبّق مخطط قاعدة البيانات + يُدخل الخدمات وحساب المدير |
| 9 | يطبع الرابط النهائي وبيانات دخول المدير |

⏱️ الزمن المتوقع: **3 – 6 دقائق** (أول مرة فقط).

---

## بعد انتهاء النشر

سيبطبع السكربت في النهاية شيئاً مثل:

```
════════════════════════════════════════════
  ✅ تم النشر بنجاح
════════════════════════════════════════════
  🌍 رابط الموقع:  https://carsys.easychat.cloud
  🔐 لوحة التحكم:  https://carsys.easychat.cloud/login
  👤 بريد المدير:  admin@easychat.cloud
  🔑 كلمة المرور:  Car@xxxxxxxxxx
```

**خطوات بعده:**
1. افتح `https://carsys.easychat.cloud` وتأكد أن الموقع يظهر.
2. اعمل حجزاً تجريبياً من الموقع للتأكد أن الحجز يعمل.
3. ادخل لوحة التحكم ببيانات المدير، وغيّر كلمة المرور من صفحة **المستخدمون**.
4. من **الإعدادات**: عدّل اسم الورشة، الهاتف، واتساب، والعنوان وساعات العمل.
5. فعّل النسخة الاحتياطية اليومية:
   ```bash
   (crontab -l 2>/dev/null; echo '0 3 * * * cd /root/carsystem && bash scripts/backup.sh >> /var/log/carsystem-backup.log 2>&1') | crontab -
   ```

---

## أوامر المتابعة

```bash
cd /root/carsystem

# حالة الحاويات (لازم كلها Up و app healthy)
docker compose --env-file .env.docker ps

# متابعة السجل لحظياً
docker compose --env-file .env.docker logs -f app

# سجل Caddy (مشاكل شهادة SSL تظهر هنا)
docker compose --env-file .env.docker logs caddy | tail -40

# إعادة تشغيل التطبيق
docker compose --env-file .env.docker restart app

# نسخة احتياطية يدوية
bash scripts/backup.sh
```

---

## حل المشاكل

| المشكلة | الحل |
|---|---|
| الموقع لا يفتح والشهادة لم تُصدر | `docker compose --env-file .env.docker logs caddy \| tail -40` — غالباً المنفذ 80 محجوب |
| `port is already allocated` | `systemctl stop nginx apache2 && systemctl disable nginx apache2` ثم أعد التشغيل |
| خطأ `Connection refused` في سجل app | قاعدة البيانات لم تبدأ: `docker compose --env-file .env.docker logs db` |
| الموقع يفتح بالـ IP لكن لا بالدومين | تأكد أن المنافذ 80 و 443 مفتوحة في **جدار hPanel** أيضاً وليس ufw فقط |
| نسيت كلمة مرور المدير | راجع قسم «حل المشاكل» في `DEPLOY.md` — فيه أمر إعادة التعيين |

---

## تحديث الموقع لاحقاً بعد أي تغيير في الكود

```bash
cd /root/carsystem
git pull origin arena/01a08cd4-carsystem
docker compose --env-file .env.docker up -d --build
```

البيانات لا تُفقد — التحديث يطبّق التغييرات فقط.
