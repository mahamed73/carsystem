import { z } from "zod";

/** يحوّل الحقول الفارغة القادمة من النماذج إلى undefined */
const blank = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

const optionalText = (max: number) =>
  z.preprocess(blank, z.string().trim().max(max, `الحد الأقصى ${max} حرف`).optional());

const optionalInt = (min: number, max: number) =>
  z.preprocess(blank, z.coerce.number().int().min(min).max(max).optional());

export const egyptPhone = z
  .string()
  .trim()
  .regex(/^01[0125][0-9]{8}$/, "رقم الهاتف غير صحيح — اكتب رقماً مصرياً مثل 01012345678");

const toDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صحيح");

const timeHM = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "وقت غير صحيح");

export const bookingSchema = z.object({
  service_id: z.coerce.number().int().positive("اختر الخدمة المطلوبة"),
  scheduled_date: toDate,
  scheduled_time: timeHM,
  customer_name: z
    .string()
    .trim()
    .min(3, "اكتب الاسم بالكامل (3 أحرف على الأقل)")
    .max(120, "الاسم طويل جداً"),
  customer_phone: egyptPhone,
  customer_email: z.preprocess(
    blank,
    z.string().trim().email("البريد الإلكتروني غير صحيح").optional()
  ),
  customer_notes: optionalText(1000),
  make: z.string().trim().min(2, "اكتب ماركة السيارة").max(80),
  model: z.string().trim().min(1, "اكتب موديل السيارة").max(80),
  year: optionalInt(1950, 2100),
  plate_number: optionalText(40),
  color: optionalText(40),
  mileage: optionalInt(0, 2_000_000),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "اكتب اسم الخدمة").max(160),
  description: optionalText(2000),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(15, "أقل مدة 15 دقيقة")
    .max(600, "أقصى مدة 600 دقيقة"),
  price: z.coerce.number().min(0, "السعر لا يكون بالسالب").max(1_000_000),
  icon: z.string().trim().max(16).default("🔧"),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.coerce.boolean().default(true),
});

export const userSchema = z.object({
  name: z.string().trim().min(3, "اكتب اسم المستخدم").max(120),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  phone: z.preprocess(blank, z.string().trim().max(30).optional()),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(200),
  role: z.enum(["admin", "staff"]).default("staff"),
});

export const settingsSchema = z.object({
  workshop_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  address: z.string().trim().max(300),
  open_time: timeHM,
  close_time: timeHM,
  slot_minutes: z.coerce.number().int().min(15).max(240),
  capacity: z.coerce.number().int().min(1).max(50),
  closed_days: z.string().trim().max(40),
  slot_note: z.string().trim().max(500),
});

export const customerNoteSchema = z.object({
  notes: optionalText(2000),
});

export const bookingAdminSchema = z.object({
  scheduled_date: toDate.optional(),
  scheduled_time: timeHM.optional(),
  price: z.preprocess(blank, z.coerce.number().min(0).max(1_000_000).nullable().optional()),
  assigned_to: z.preprocess(blank, z.coerce.number().int().positive().nullable().optional()),
  admin_notes: optionalText(2000),
});

/** تحويل أخطاء Zod إلى كائن {اسم الحقل: رسالة} لعرضه في النموذج */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
