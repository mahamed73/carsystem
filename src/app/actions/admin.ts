"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import {
  deleteService,
  insertService,
  insertUser,
  setServiceActive,
  setUserActive,
  updateBookingDetails,
  updateBookingStatus,
  updateCustomerNotes,
  updateService,
  updateUserPassword,
  createBooking,
} from "@/lib/queries";
import { saveSettings } from "@/lib/settings";
import { requireAdmin, requireUser } from "@/lib/auth";
import {
  bookingAdminSchema,
  bookingSchema,
  customerNoteSchema,
  fieldErrors,
  serviceSchema,
  settingsSchema,
  userSchema,
} from "@/lib/validation";
import type { BookingStatus } from "@/lib/types";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  reference?: string;
};

function fail(error: unknown, fallback = "حدث خطأ غير متوقع، حاول مرة أخرى."): ActionState {
  const code = (error as { message?: string })?.message;
  if (code === "UNAUTHORIZED") return { ok: false, message: "انتهت الجلسة — سجّل الدخول من جديد." };
  if (code === "FORBIDDEN") return { ok: false, message: "هذا الإجراء متاح لمدير النظام فقط." };
  console.error("admin action error:", error);
  return { ok: false, message: fallback };
}

function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/services");
}

/* =====================================================================
 *  الحجوزات
 * ===================================================================== */

export async function updateStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as BookingStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  const allowed: BookingStatus[] = [
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ];
  if (!Number.isInteger(id) || !allowed.includes(status)) return;

  await updateBookingStatus(id, status, note, user.id);
  refreshAdmin();
  revalidatePath(`/admin/bookings/${id}`);
}

export async function saveBookingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const id = Number(formData.get("id"));
    if (!Number.isInteger(id)) return { ok: false, message: "حجز غير صحيح." };

    const parsed = bookingAdminSchema.safeParse({
      scheduled_date: formData.get("scheduled_date") || undefined,
      scheduled_time: formData.get("scheduled_time") || undefined,
      price: formData.get("price"),
      assigned_to: formData.get("assigned_to"),
      admin_notes: formData.get("admin_notes"),
    });
    if (!parsed.success) {
      return { ok: false, message: "راجع البيانات المدخلة.", errors: fieldErrors(parsed.error) };
    }

    await updateBookingDetails(
      id,
      {
        scheduled_date: parsed.data.scheduled_date,
        scheduled_time: parsed.data.scheduled_time,
        price: parsed.data.price ?? null,
        assigned_to: parsed.data.assigned_to ?? null,
        admin_notes: parsed.data.admin_notes ?? null,
      },
      user.id
    );

    refreshAdmin();
    revalidatePath(`/admin/bookings/${id}`);
    return { ok: true, message: "تم حفظ تعديلات الحجز." };
  } catch (error) {
    return fail(error);
  }
}

export async function createManualBookingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const parsed = bookingSchema.safeParse({
      service_id: formData.get("service_id"),
      scheduled_date: formData.get("scheduled_date"),
      scheduled_time: formData.get("scheduled_time"),
      customer_name: formData.get("customer_name"),
      customer_phone: formData.get("customer_phone"),
      customer_email: formData.get("customer_email"),
      customer_notes: formData.get("customer_notes"),
      make: formData.get("make"),
      model: formData.get("model"),
      year: formData.get("year"),
      plate_number: formData.get("plate_number"),
      color: formData.get("color"),
      mileage: formData.get("mileage"),
    });

    if (!parsed.success) {
      return { ok: false, message: "راجع البيانات المدخلة.", errors: fieldErrors(parsed.error) };
    }
    const d = parsed.data;

    const { reference } = await createBooking({
      service_id: d.service_id,
      scheduled_date: d.scheduled_date,
      scheduled_time: d.scheduled_time,
      customer_name: d.customer_name,
      customer_phone: d.customer_phone,
      customer_email: d.customer_email ?? null,
      customer_notes: d.customer_notes ?? null,
      make: d.make,
      model: d.model,
      year: d.year ?? null,
      plate_number: d.plate_number ?? null,
      color: d.color ?? null,
      mileage: d.mileage ?? null,
      created_by: user.id,
    });

    refreshAdmin();
    return { ok: true, message: "تم إنشاء الحجز بنجاح.", reference };
  } catch (error) {
    return fail(error);
  }
}

/* =====================================================================
 *  العملاء
 * ===================================================================== */

export async function saveCustomerNotesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireUser();
    const id = Number(formData.get("id"));
    const parsed = customerNoteSchema.safeParse({ notes: formData.get("notes") });
    if (!Number.isInteger(id) || !parsed.success) {
      return { ok: false, message: "ملاحظات غير صحيحة." };
    }
    await updateCustomerNotes(id, parsed.data.notes ?? null);
    revalidatePath(`/admin/customers/${id}`);
    return { ok: true, message: "تم حفظ الملاحظات." };
  } catch (error) {
    return fail(error);
  }
}

/* =====================================================================
 *  الخدمات
 * ===================================================================== */

export async function saveServiceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();

    const idRaw = formData.get("id");
    const parsed = serviceSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      duration_minutes: formData.get("duration_minutes"),
      price: formData.get("price"),
      icon: formData.get("icon") || "🔧",
      sort_order: formData.get("sort_order") || 0,
      is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
    });

    if (!parsed.success) {
      return { ok: false, message: "راجع بيانات الخدمة.", errors: fieldErrors(parsed.error) };
    }

    const data = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price,
      icon: parsed.data.icon || "🔧",
      is_active: parsed.data.is_active,
      sort_order: parsed.data.sort_order,
    };

    if (idRaw && String(idRaw).trim() !== "") {
      await updateService(Number(idRaw), data);
      refreshAdmin();
      revalidatePath("/");
      return { ok: true, message: "تم تحديث الخدمة." };
    }

    await insertService(data);
    refreshAdmin();
    revalidatePath("/");
    return { ok: true, message: "تمت إضافة الخدمة." };
  } catch (error) {
    return fail(error);
  }
}

export async function toggleServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  if (!Number.isInteger(id)) return;
  await setServiceActive(id, active);
  refreshAdmin();
  revalidatePath("/");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await deleteService(id);
  refreshAdmin();
  revalidatePath("/");
}

/* =====================================================================
 *  المستخدمون
 * ===================================================================== */

export async function saveUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const parsed = userSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      role: formData.get("role") || "staff",
    });

    if (!parsed.success) {
      return { ok: false, message: "راجع البيانات المدخلة.", errors: fieldErrors(parsed.error) };
    }

    const hash = await bcrypt.hash(parsed.data.password, 10);
    await insertUser({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      password_hash: hash,
      role: parsed.data.role,
    });

    revalidatePath("/admin/users");
    return { ok: true, message: "تم إضافة المستخدم بنجاح." };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "23505") {
      return { ok: false, message: "هذا البريد الإلكتروني مستخدم بالفعل." };
    }
    return fail(error);
  }
}

export async function toggleUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  if (!Number.isInteger(id) || id === admin.id) return; // لا يُعطّل المدير نفسه
  await setUserActive(id, active);
  revalidatePath("/admin/users");
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const password = String(formData.get("password") ?? "");
    if (!Number.isInteger(id) || password.length < 6) {
      return { ok: false, message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." };
    }
    await updateUserPassword(id, await bcrypt.hash(password, 10));
    revalidatePath("/admin/users");
    return { ok: true, message: "تم تعيين كلمة المرور الجديدة." };
  } catch (error) {
    return fail(error);
  }
}

/* =====================================================================
 *  الإعدادات
 * ===================================================================== */

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    const parsed = settingsSchema.safeParse({
      workshop_name: formData.get("workshop_name"),
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp"),
      address: formData.get("address"),
      open_time: formData.get("open_time"),
      close_time: formData.get("close_time"),
      slot_minutes: formData.get("slot_minutes"),
      capacity: formData.get("capacity"),
      closed_days: formData.get("closed_days") ?? "",
      slot_note: formData.get("slot_note"),
    });

    if (!parsed.success) {
      return { ok: false, message: "راجع الإعدادات المدخلة.", errors: fieldErrors(parsed.error) };
    }

    await saveSettings({
      ...parsed.data,
      slot_minutes: String(parsed.data.slot_minutes),
      capacity: String(parsed.data.capacity),
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { ok: true, message: "تم حفظ الإعدادات." };
  } catch (error) {
    return fail(error);
  }
}
