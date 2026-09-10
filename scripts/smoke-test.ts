/**
 * اختبار سريع لمنطق النظام على قاعدة بيانات حقيقية.
 * يعمل على نسخة تجريبية/تطويرية فقط — ينشئ حجزاً تجريبياً ثم يحذفه.
 *
 *   npx tsx scripts/smoke-test.ts
 */
import "dotenv/config";
import { pool, query, queryOne } from "../src/lib/db";
import {
  createBooking,
  getActiveServices,
  getBookingByReference,
  getBookingEvents,
  getDashboardStats,
  getReports,
  updateBookingStatus,
} from "../src/lib/queries";
import { getAvailableSlots } from "../src/lib/settings";
import { todayISO } from "../src/lib/format";

let failures = 0;

function check(label: string, condition: boolean, extra = "") {
  if (condition) {
    console.log(`  ✅ ${label}${extra ? ` — ${extra}` : ""}`);
  } else {
    failures += 1;
    console.error(`  ❌ ${label}${extra ? ` — ${extra}` : ""}`);
  }
}

function nextOpenDate(daysAhead = 3): string {
  const d = new Date(`${todayISO()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("▶ 1) الخدمات");
  const services = await getActiveServices();
  check("يوجد خدمات مفعّلة", services.length > 0, `${services.length} خدمة`);

  const service = services[0];
  const date = nextOpenDate();
  console.log(`▶ 2) المواعيد المتاحة ليوم ${date} لخدمة «${service.name}»`);
  const { closed, slots, settings } = await getAvailableSlots(date, service.duration_minutes);
  check("اليوم مفتوح", !closed);
  check("تم توليد مواعيد", slots.length > 0, `${slots.length} فترة`);
  const free = slots.filter((s) => s.available);
  check("يوجد مواعيد متاحة", free.length > 0, `${free.length} متاح`);
  check("سعة الاستقبال مضبوطة", Number(settings.capacity) >= 1, `capacity=${settings.capacity}`);

  const chosen = free[0];
  console.log(`▶ 3) إنشاء حجز على الموعد ${chosen.time}`);
  const { id, reference } = await createBooking({
    service_id: service.id,
    scheduled_date: date,
    scheduled_time: chosen.time,
    customer_name: "عميل اختبار آلي",
    customer_phone: "01099998888",
    customer_email: "smoke@test.local",
    customer_notes: "حجز آلي للاختبار — سيتم حذفه",
    make: "تويوتا",
    model: "كورولا",
    year: 2020,
    plate_number: "ت س ت 1234",
    color: "أبيض",
    mileage: 45000,
  });
  check("تم إنشاء الحجز", /^CR-\d{6}-[A-Z0-9]{4}$/.test(reference), reference);

  const booking = await getBookingByReference(reference);
  check("يمكن استرجاع الحجز بالمرجع", booking !== null);
  check("اسم العميل صحيح", booking?.customer_name === "عميل اختبار آلي");
  check("اسم الخدمة مرتبط", booking?.service_name === service.name);
  check("الحالة الابتدائية pending", booking?.status === "pending");
  check("رقم اللوحة محفوظ", booking?.vehicle_plate === "ت س ت 1234");

  console.log("▶ 4) احتساب السعة بعد الحجز");
  const after = await getAvailableSlots(date, service.duration_minutes);
  const sameSlot = after.slots.find((s) => s.time === chosen.time);
  check("تم احتساب الحجز على الفترة", (sameSlot?.taken ?? 0) >= 1, `taken=${sameSlot?.taken}`);
  const capacity = Number(settings.capacity);
  check(
    "حالة الإتاحة متسقة مع السعة",
    sameSlot?.available === (sameSlot?.taken ?? 0) < capacity,
    `taken=${sameSlot?.taken}/${capacity}`
  );

  console.log("▶ 5) تحديث الحالة وسجل الأحداث");
  await updateBookingStatus(id, "confirmed", "تأكيد آلي أثناء الاختبار", null);
  await updateBookingStatus(id, "completed", "إتمام آلي أثناء الاختبار", null);
  const updated = await getBookingByReference(reference);
  check("الحالة تغيّرت إلى completed", updated?.status === "completed");
  check("تاريخ الإتمام مسجّل", Boolean(updated?.completed_at));
  const events = await getBookingEvents(id);
  check("سجل الأحداث يحتوي التحديثات", events.length >= 3, `${events.length} حدث`);

  console.log("▶ 6) الإحصائيات والتقارير");
  const stats = await getDashboardStats();
  check("إحصائيات لوحة التحكم تعمل", typeof stats.customers_total === "number");
  check("عدد العملاء > 0", stats.customers_total > 0, `${stats.customers_total} عميل`);
  const reports = await getReports();
  check("تقرير الخدمات يعمل", reports.byService.length > 0);
  check("توزيع الحالات يعمل", reports.byStatus.length > 0);

  console.log("▶ 7) تنظيف بيانات الاختبار");
  await query("DELETE FROM bookings WHERE reference = $1", [reference]);
  const customer = await queryOne<{ id: number }>(
    "SELECT id FROM customers WHERE phone = $1",
    ["01099998888"]
  );
  if (customer) {
    const remaining = await queryOne<{ c: number }>(
      "SELECT count(*)::int AS c FROM bookings WHERE customer_id = $1",
      [customer.id]
    );
    if ((remaining?.c ?? 0) === 0) {
      await query("DELETE FROM customers WHERE id = $1", [customer.id]);
    }
  }
  const gone = await getBookingByReference(reference);
  check("تم حذف بيانات الاختبار", gone === null);

  await pool.end();
  console.log(
    failures === 0
      ? "\n🎉 كل الاختبارات نجحت."
      : `\n⚠️ فشل ${failures} اختبار — راجع الرسائل بالأعلى.`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error("✖ خطأ غير متوقع:", err);
  await pool.end().catch(() => {});
  process.exit(1);
});
