/**
 * إدخال البيانات الأولية:
 *   - حساب مدير النظام
 *   - قائمة خدمات الصيانة الأساسية
 * الملف آمن للتشغيل أكثر من مرة (لا يكرر البيانات).
 *
 *   node scripts/seed.js
 */
"use strict";

try {
  // dotenv غير مطلوب في Docker — القيم تأتي من متغيرات البيئة
  require("dotenv").config();
} catch {
  /* لا شيء */
}
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

const SERVICES = [
  {
    name: "تغيير زيت وفلتر",
    description: "تغيير زيت المحرك والفلتر مع فحص مستوى السوائل والتأكد من عدم وجود تسريبات.",
    duration_minutes: 45,
    price: 450,
    icon: "🛢️",
    sort_order: 1,
  },
  {
    name: "صيانة دورية شاملة",
    description: "فحص كامل للمحرك والفرامل والتعليق والإطارات والسوائل مع تقرير مفصل بحالة السيارة.",
    duration_minutes: 120,
    price: 1200,
    icon: "🧰",
    sort_order: 2,
  },
  {
    name: "فحص وتصليح الفرامل",
    description: "فحص تيل الفرامل والأقراص والزيت، وتغيير الأجزاء المتآكلة وضبط نظام الفرملة.",
    duration_minutes: 90,
    price: 700,
    icon: "🛑",
    sort_order: 3,
  },
  {
    name: "إصلاح تكييف السيارة",
    description: "فحص دائرة التكييف والغاز والكمبروسر، وتنظيف الفلاتر وإعادة شحن الفريون.",
    duration_minutes: 90,
    price: 850,
    icon: "❄️",
    sort_order: 4,
  },
  {
    name: "ترصيص وضبط زوايا",
    description: "ترصيص الإطارات إلكترونياً وضبط زوايا العجلات لضمان ثبات السيارة وتقليل استهلاك الوقود.",
    duration_minutes: 60,
    price: 500,
    icon: "🛞",
    sort_order: 5,
  },
  {
    name: "فحص كمبيوتر (تشخيص أعطال)",
    description: "قراءة أكواد الأعطال بجهاز التشخيص الإلكتروني وتحليل الأعراض مع تقرير بالمشاكل.",
    duration_minutes: 30,
    price: 300,
    icon: "💻",
    sort_order: 6,
  },
  {
    name: "بطارية وكهرباء السيارة",
    description: "فحص البطارية والدينامو والمشغّل ودائرة الكهرباء العامة وتغيير ما يلزم.",
    duration_minutes: 60,
    price: 600,
    icon: "🔋",
    sort_order: 7,
  },
  {
    name: "غسيل وتلميع احترافي",
    description: "غسيل خارجي وداخلي وتلميع كامل للسيارة مع تنظيف الموتور من الخارج.",
    duration_minutes: 60,
    price: 350,
    icon: "🧼",
    sort_order: 8,
  },
];

async function seedServices(client) {
  let inserted = 0;
  for (const s of SERVICES) {
    const { rowCount } = await client.query(
      `INSERT INTO services (name, description, duration_minutes, price, icon, sort_order)
       SELECT $1::varchar, $2::text, $3::int, $4::numeric, $5::varchar, $6::int
       WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.name = $1::varchar)`,
      [s.name, s.description, s.duration_minutes, s.price, s.icon, s.sort_order]
    );
    inserted += rowCount;
  }
  console.log(
    inserted > 0
      ? `✅ تمت إضافة ${inserted} خدمة جديدة.`
      : "ℹ️  الخدمات موجودة بالفعل — لم يُضف شيء."
  );
}

async function seedAdmin(client) {
  const email = (process.env.ADMIN_EMAIL || "admin@carsystem.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_NAME || "مدير النظام";

  const { rows } = await client.query("SELECT id FROM users WHERE email = $1", [email]);
  if (rows.length > 0) {
    console.log(`ℹ️  حساب المدير موجود بالفعل (${email}) — لم يُعدّل شيء.`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await client.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')`,
    [name, email, hash]
  );
  console.log(`✅ تم إنشاء حساب المدير: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log("⚠️  كلمة المرور الافتراضية: Admin@12345 — غيّرها فوراً بعد أول دخول.");
  }
}

async function seedDemoData(client) {
  if (process.env.SEED_DEMO !== "true") return;

  const { rows: existing } = await client.query("SELECT count(*)::int AS c FROM customers");
  if (existing[0].c > 0) {
    console.log("ℹ️  يوجد عملاء بالفعل — تم تخطي البيانات التجريبية.");
    return;
  }

  const demo = [
    ["أحمد محمود", "01011112222", "تويوتا", "كورولا", 2019, "د ا ر 1234", "أبيض", 84000],
    ["منى إبراهيم", "01022223333", "هيونداي", "إلنترا", 2021, "ر س ب 5678", "رمادي", 32000],
    ["خالد السيد", "01033334444", "نيسان", "صني", 2017, "ب ن ج 9012", "فضي", 156000],
    ["سارة عبد الله", "01044445555", "كيا", "سيراتو", 2022, "ط ع م 3456", "أسود", 18000],
  ];

  for (const [name, phone, make, model, year, plate, color, mileage] of demo) {
    const { rows } = await client.query(
      `INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id`,
      [name, phone]
    );
    await client.query(
      `INSERT INTO vehicles (customer_id, make, model, year, plate_number, color, mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [rows[0].id, make, model, year, plate, color, mileage]
    );
  }

  // حجوزات تجريبية على أيام قادمة
  const { rows: cars } = await client.query(
    "SELECT id, customer_id FROM vehicles ORDER BY id LIMIT 4"
  );
  const { rows: services } = await client.query("SELECT id FROM services ORDER BY id LIMIT 4");
  const statuses = ["pending", "confirmed", "completed", "in_progress"];

  for (let i = 0; i < cars.length; i++) {
    await client.query(
      `INSERT INTO bookings
         (reference, customer_id, vehicle_id, service_id, scheduled_date, scheduled_time, status, customer_notes)
       VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::int, $6, $7, $8)`,
      [
        `CR-DEMO-${1000 + i}`,
        cars[i].customer_id,
        cars[i].id,
        services[i % services.length].id,
        i + 1,
        `${String(9 + i).padStart(2, "0")}:00`,
        statuses[i % statuses.length],
        "أرجو مراجعة السيارة قبل السفر.",
      ]
    );
  }
  console.log("✅ تم إدخال بيانات تجريبية (عملاء + سيارات + حجوزات).");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("✖ متغير DATABASE_URL غير موجود في البيئة.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await seedAdmin(client);
    await seedServices(client);
    await seedDemoData(client);
    console.log("🎉 اكتملت تهيئة البيانات.");
  } catch (err) {
    console.error("✖ فشل إدخال البيانات:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
