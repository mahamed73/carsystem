# تقرير فحص الموقع — carsys.easychat.cloud

- التاريخ: 2026-09-11 20:31:52 UTC

## 1) سجلات DNS
```
187.77.71.18    carsys.easychat.cloud
```

## 2) الصفحة الرئيسية (HTTPS)
- كود الاستجابة: **000000**

## 3) بقية الصفحات
```
/login  → HTTP 000000
/track  → HTTP 000000
/admin  → HTTP 000000
```

## 4) واجهة المواعيد المتاحة
- التاريخ المفحوص: 2026-09-14
- عدد المواعيد: **0**
```json
{}

```

## 5) شهادة SSL
```
subject=CN = clinic1.easychat.cloud
issuer=C = US, O = Let's Encrypt, CN = YE2
notBefore=Aug 19 08:51:47 2026 GMT
notAfter=Nov 17 08:51:46 2026 GMT
```

## 6) استكشاف السيرفر الحالي (مهم: لا نريد تعطيل مواقع قائمة)
```
--- www/clinic1.easychat.cloud ---
HTTP/2 307 
server: nginx/1.24.0 (Ubuntu)
date: Fri, 11 Sep 2026 20:31:56 GMT
location: https://clinic1.easychat.cloud/login?callbackUrl=https%3A%2F%2Fclinic1.easychat.cloud%2F
set-cookie: __Host-authjs.csrf-token=f2becdc70a77627845543e26d8a8ecee58375da48510c75bed95bc1406c6548e%7C2b8b9703e2dde91a4d4c6a2f04cbd1739244a445ff544efbca7f288e64188f69; Path=/; HttpOnly; Secure; SameSite=Lax
set-cookie: __Secure-authjs.callback-url=https%3A%2F%2Fclinic1.easychat.cloud; Path=/; HttpOnly; Secure; SameSite=Lax


--- الكود الفعلي لموقع العيادة ---
https://clinic1.easychat.cloud → HTTP 307
http://clinic1.easychat.cloud  → HTTP 301

--- apex easychat.cloud ---
https://easychat.cloud → HTTP 307 (server: server: nginx/1.24.0 (Ubuntu))

--- http://carsys.easychat.cloud (المنفذ 80) ---
HTTP/1.1 404 Not Found
Server: nginx/1.24.0 (Ubuntu)
Date: Fri, 11 Sep 2026 20:31:58 GMT
Content-Type: text/html
Content-Length: 162
Connection: keep-alive


--- https://carsys مع تجاهل الشهادة (-k) ---
HTTP/2 307 
server: nginx/1.24.0 (Ubuntu)
date: Fri, 11 Sep 2026 20:31:59 GMT
location: https://clinic1.easychat.cloud/login?callbackUrl=https%3A%2F%2Fclinic1.easychat.cloud%2F
set-cookie: __Host-authjs.csrf-token=6cfbec9a26bcc3a60e8a0650a0549b79fcd5150ca6cb47cf157fd78f21c81f2b%7C3b69a9d9d390a468c919f4eae4a5d5ba25315a331ef0e8aec96744a012707616; Path=/; HttpOnly; Secure; SameSite=Lax
set-cookie: __Secure-authjs.callback-url=https%3A%2F%2Fclinic1.easychat.cloud; Path=/; HttpOnly; Secure; SameSite=Lax

```

## الخلاصة
❌ **الموقع لا يستجيب (HTTP 000000)** — تحقق من النشر على السيرفر
