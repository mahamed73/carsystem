import type { BookingStatus } from "./types";

export const TIMEZONE = "Africa/Cairo";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  in_progress: "جاري التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  no_show: "لم يحضر",
};

export const STATUS_CLASSES: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-200",
  confirmed: "bg-blue-100 text-blue-800 ring-blue-200",
  in_progress: "bg-violet-100 text-violet-800 ring-violet-200",
  completed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 ring-rose-200",
  no_show: "bg-slate-200 text-slate-700 ring-slate-300",
};

export const STATUS_DOTS: Record<BookingStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  in_progress: "bg-violet-500",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-500",
  no_show: "bg-slate-500",
};

export const ALL_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

/** تاريخ اليوم بتوقيت القاهرة بصيغة YYYY-MM-DD */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** الساعة الحالية بتوقيت القاهرة بصيغة HH:MM */
export function nowHM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** 2026-09-12  ➜  السبت 12 سبتمبر 2026 */
export function formatDateAr(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** 2026-09-12  ➜  12 سبتمبر */
export function formatShortDateAr(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  }).format(d);
}

/** '14:30'  ➜  '2:30 م' */
export function formatTimeAr(time: string | null | undefined): string {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return String(time);
  const period = h < 12 ? "ص" : "م";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

/** 1200  ➜  '1,200 ج.م' */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("ar-EG-u-nu-latn", {
    maximumFractionDigits: 2,
  }).format(value)} ج.م`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("ar-EG-u-nu-latn").format(value);
}

export function formatDateTimeAr(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** 'اسم السيارة كامل' — يقبل كائن السيارة أو صف حجز (بحقول vehicle_*) */
export function vehicleLabel(v: {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
}): string {
  return [v.make ?? v.vehicle_make, v.model ?? v.vehicle_model, v.year ?? v.vehicle_year]
    .filter(Boolean)
    .join(" ");
}

/** أيام الأسبوع المفتوحة من إعداد closed_days ('5' = الجمعة) */
export function isClosedDay(dateISO: string, closedDays: string): boolean {
  const days = String(closedDays || "")
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => !Number.isNaN(d));
  if (days.length === 0) return false;
  const dow = new Date(`${dateISO}T12:00:00Z`).getUTCDay(); // 0=الأحد ... 5=الجمعة
  return days.includes(dow);
}
