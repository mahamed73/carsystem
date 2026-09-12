/**
 * تطبيق مخطط قاعدة البيانات (schema.sql) على قاعدة البيانات.
 * يُستخدم محلياً وفي حاويات Docker عند بدء التشغيل.
 *
 *   node scripts/migrate.js
 */
"use strict";

try {
  // dotenv غير مطلوب في Docker — القيم تأتي من متغيرات البيئة
  require("dotenv").config();
} catch {
  /* لا شيء */
}
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("✖ متغير DATABASE_URL غير موجود في البيئة.");
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  const client = new Client({ connectionString });

  // إعادة المحاولة — قاعدة البيانات قد تحتاج ثواني إضافية لتكون جاهزة
  let lastError;
  let connected = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      await client.connect();
      connected = true;
      break;
    } catch (err) {
      lastError = err;
      console.log(`… في انتظار قاعدة البيانات (محاولة ${attempt}/20)`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (!connected) {
    console.error("✖ تعذّر الاتصال بقاعدة البيانات:", lastError?.message);
    process.exit(1);
  }

  try {
    await client.query(sql);
    console.log("✅ تم تطبيق مخطط قاعدة البيانات بنجاح.");
  } catch (err) {
    console.error("✖ فشل تطبيق المخطط:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
