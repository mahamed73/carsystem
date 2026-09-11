# نشر `carsys.easychat.cloud` — جنباً إلى جنب مع موقع العيادة

## ⚠️ مهم: لا يمكن نشر النظام من بيئة الوكيل مباشرة

بيئة العمل التي أُشرف منها **تحجب اتصالات SSH الصادرة بالكامل** (تم اختبارها مع أكثر من
سيرفر ومع GitHub نفسه). لذلك خطوة واحدة فقط يجب أن تُنفَّذ من عندك: **سطر واحد على السيرفر**.
كل ما تبقّى (البناء، الإعداد، الشهادة، التحقق) يتم تلقائياً.

---

## 🔎 ما اكتشفته على سيرفرك قبل النشر

| العنصر | الحالة |
|---|---|
| خادم الويب | **nginx/1.24.0 (Ubuntu)** — خدمة نظام، وليس Docker |
| موقع قائم | **clinic1.easychat.cloud** (نظام العيادة) يعمل بـ NextAuth على المنفذ 443 |
| النطاق الأب | `easychat.cloud` يحوّل لصفحة دخول العيادة |
| `carsys.easychat.cloud` | DNS ➜ `187.77.71.18` ✅ لكن لا يوجد إعداد له على السيرفر (يُلتقط من الإعداد الافتراضي) |
| الشهادات | Let's Encrypt (يُدار بـ certbot على الأرجح) |

> 🛑 **لهذا السبب تحديداً** لم أستخدم الخطة الأصلية (Docker + Caddy على المنفذين 80 و 443):
> كانت **ستوقف nginx وتُسقط موقع العيادة**. النظام الآن يُنشر كموقع إضافي داخل نفس nginx.

---

## 🏗️ المعمارية الجديدة

```
                      ┌── nginx (المنفذان 80/443) ──┐
الإنترنت ─────────────┤                             │
                      │  clinic1.easychat.cloud ────┼──► تطبيق العيادة (كما هو، بدون أي تغيير)
                      │                             │
                      │  carsys.easychat.cloud ─────┼──► حاوية التطبيق الجديدة: 127.0.0.1:3001
                      └─────────────────────────────┘         │
                                                              ▼
                                                    PostgreSQL (حاوية داخلية)
```

- **لا يُعدَّل أي ملف** من إعدادات موقع العيادة — نضيف ملفاً جديداً فقط
  `/etc/nginx/sites-enabled/carsys.easychat.cloud.conf`.
- التطبيق يُنشر على `127.0.0.1:3001` (منفذ داخلي غير مكشوف) — ويُختار تلقائياً أول منفذ حر.
- قبل تفعيل الإعداد يُختبر بـ `nginx -t`، ولو فشل يتم **التراجع تلقائياً** بدون أي تأثير.
- شهادة SSL تُصدر بأمر certbot مخصص للدومين الجديد فقط — لا يمس شهادة العيادة.
- نسخة أمان من `.env.docker` (فيه كلمة مرور قاعدة البيانات) تُحفظ في `/root/.carsystem-env.docker`.

---

## 🚀 التنفيذ — سطر واحد

ادخل على السيرفر:

```bash
ssh root@187.77.71.18
```

ثم الصق هذا السطر كما هو:

```bash
curl -fsSL https://raw.githubusercontent.com/mahamed73/carsystem/arena/01a08cd4-carsystem/scripts/deploy-online.sh | bash
```

**بديل لو حبّيت تشوف السكربت قبل تشغيله** (نفس النتيجة):

```bash
git clone --depth=1 --branch arena/01a08cd4-carsystem https://github.com/mahamed73/carsystem.git /root/carsystem
bash /root/carsystem/scripts/deploy-remote.sh
```

⏱️ **الزمن المتوقع:** 4 – 8 دقائق (أول مرة — بناء صورة Docker).

### ما الذي سيحدث بالترتيب
1. تثبيت Docker إن لم يكن موجوداً (لن يمسّ nginx أو موقع العيادة).
2. سحب الكود من GitHub إلى `/root/carsystem`.
3. اختيار أول منفذ حر (3001 وغيره) للتطبيق الجديد.
4. توليد كلمة مرور عشوائية للمدير + مفتاح تشفير + كلمة مرور لقاعدة البيانات.
5. بناء وتشغيل حاويتين: التطبيق + PostgreSQL (بقاعدة بيانات مستقلة تماماً عن قاعدة العيادة).
6. إنشاء إعداد nginx للدومين الجديد + اختباره + إعادة تحميل nginx.
7. إصدار شهادة SSL للدومين الجديد عبر certbot.
8. طباعة الروابط وبيانات دخول المدير في النهاية.

### النتيجة المتوقعة في نهاية التنفيذ

```
════ تم النشر ════
  🌐 رابط الموقع:        https://carsys.easychat.cloud
  🔐 لوحة التحكم:        https://carsys.easychat.cloud/login
  👤 بريد المدير:        admin@easychat.cloud
  🔑 كلمة مرور المدير:   Car@xxxxxxxxxx

  ⚙️  أسلوب النشر:        nginx
  📡 التطبيق داخلياً:     http://127.0.0.1:3001 → HTTP 200
  🌍 من الإنترنت:         https://carsys.easychat.cloud → HTTP 200
```

---

## ✅ بعد التنفيذ: أرسل لي الناتج وسأتحقق بنفسي

عندي workflow على GitHub يفحص الموقع من الخارج تلقائياً (DNS + HTTPS + الشهادة + كل الصفحات
+ أن موقع العيادة **لم يتأثر**). أرسل لي آخر 15 سطراً من ناتج التنفيذ، أو قل لي «تم» وسأشغّل
الفحص وأراجع النتيجة سطراً سطراً.

خطوات مقترحة بعد نجاح النشر:
1. افتح الموقع واعمل حجزاً تجريبياً.
2. ادخل لوحة التحكم وغيّر كلمة مرور المدير من صفحة **المستخدمون**.
3. من **الإعدادات**: اسم الورشة، الهاتف، واتساب، العنوان، ساعات العمل.
4. فعّل النسخة الاحتياطية اليومية:
   ```bash
   (crontab -l 2>/dev/null; echo '0 3 * * * cd /root/carsystem && bash scripts/backup.sh >> /var/log/carsystem-backup.log 2>&1') | crontab -
   ```

---

## 🔧 أوامر المتابعة والصيانة

```bash
cd /root/carsystem

docker compose --env-file .env.docker ps        # حالة الحاويات
docker compose --env-file .env.docker logs -f app   # سجل التطبيق
nginx -t                                        # اختبار إعداد nginx
systemctl reload nginx                          # إعادة تحميل nginx
certbot certificates                            # كل الشهادات وتواريخ انتهائها
bash scripts/backup.sh                          # نسخة احتياطية فورية
```

## 🆘 حل المشاكل

| المشكلة | الحل |
|---|---|
| الموقع يعمل بالـ IP ولا بالدومين | تأكد أن `carsys.easychat.cloud` يشاور على `187.77.71.18` |
| خطأ شهادة SSL | `certbot --nginx -d carsys.easychat.cloud --non-interactive --agree-tos -m بريدك` |
| التطبيق لا يستجيب | `docker compose --env-file .env.docker logs app \| tail -40` |
| تعطّل شيء في العيادة (يُفترض ألا يحدث) | `ls /etc/nginx/sites-enabled/` ثم احذف ملف `carsys...conf` و`systemctl reload nginx` — سيعود كل شيء كما كان |
| إعادة النشر من الصفر | `cd /root/carsystem && rm .env.docker && docker compose --env-file .env.docker down && bash scripts/deploy-remote.sh` |
