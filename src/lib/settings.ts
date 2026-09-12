import { query } from "./db";
import { nowHM, todayISO } from "./format";
import type { Slot, WorkshopSettings } from "./types";

const DEFAULTS: WorkshopSettings = {
  workshop_name: process.env.NEXT_PUBLIC_WORKSHOP_NAME || "مركز الصيانة الذكي",
  phone: "01000000000",
  whatsapp: "201000000000",
  address: "المنصورة — الدقهلية، مصر",
  open_time: "09:00",
  close_time: "18:00",
  slot_minutes: "60",
  capacity: "2",
  closed_days: "5",
  slot_note: "يرجى الحضور قبل الموعد بـ 10 دقائق ومع بطاقة السيارة.",
};

/** تحويل 'HH:MM' إلى عدد الدقائق منذ منتصف الليل */
export function toMinutes(time: string): number {
  const [h, m] = String(time).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** قراءة إعدادات الورشة — لا ترمي خطأ لو قاعدة البيانات غير متاحة */
export async function getSettings(): Promise<WorkshopSettings> {
  try {
    const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULTS, ...map } as WorkshopSettings;
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(patch: Partial<WorkshopSettings>): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined && v !== null);
  for (const [key, value] of entries) {
    await query(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, String(value)]
    );
  }
}

/**
 * توليد المواعيد المتاحة ليوم معيّن.
 * يُراعي: ساعات العمل، مدة الخدمة، عدد الآليات العاملة (capacity)،
 * الحجوزات القائمة، والأيام المغلقة.
 */
export async function getAvailableSlots(
  dateISO: string,
  durationMinutes = 60
): Promise<{ closed: boolean; slots: Slot[]; settings: WorkshopSettings }> {
  const settings = await getSettings();

  const dow = new Date(`${dateISO}T12:00:00Z`).getUTCDay();
  const closedDays = settings.closed_days
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => !Number.isNaN(d));
  if (closedDays.includes(dow)) {
    return { closed: true, slots: [], settings };
  }

  const slotMinutes = Math.max(15, Number(settings.slot_minutes) || 60);
  const capacity = Math.max(1, Number(settings.capacity) || 1);
  const openMin = toMinutes(settings.open_time);
  const closeMin = toMinutes(settings.close_time);

  const booked = await query<{ start: string; duration: number }>(
    `SELECT to_char(b.scheduled_time, 'HH24:MI') AS start,
            COALESCE(s.duration_minutes, 60)      AS duration
       FROM bookings b
       JOIN services s ON s.id = b.service_id
      WHERE b.scheduled_date = $1
        AND b.status NOT IN ('cancelled','no_show')`,
    [dateISO]
  );

  const isToday = dateISO === todayISO();
  const nowMin = toMinutes(nowHM());

  const slots: Slot[] = [];
  for (let start = openMin; start + durationMinutes <= closeMin; start += slotMinutes) {
    const end = start + durationMinutes;

    // عدد السيارات المتداخلة مع هذا الموعد
    let taken = 0;
    for (const b of booked) {
      const bStart = toMinutes(b.start);
      const bEnd = bStart + (Number(b.duration) || 60);
      if (bStart < end && start < bEnd) taken += 1;
    }

    const tooLate = isToday && start <= nowMin + 60; // مهلة ساعة قبل الموعد
    slots.push({
      time: toHM(start),
      taken,
      capacity,
      available: taken < capacity && !tooLate,
    });
  }

  return { closed: false, slots, settings };
}

/** أقرب المواعيد المتاحة بدءاً من تاريخ معيّن (تُستخدم في الصفحة الرئيسية) */
export async function getNextAvailable(
  durationMinutes = 60,
  daysAhead = 14
): Promise<{ date: string; times: string[] } | null> {
  const base = new Date(`${todayISO()}T12:00:00Z`);
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const { slots, closed } = await getAvailableSlots(iso, durationMinutes);
    if (closed) continue;
    const free = slots.filter((s) => s.available).map((s) => s.time);
    if (free.length > 0) return { date: iso, times: free.slice(0, 4) };
  }
  return null;
}
