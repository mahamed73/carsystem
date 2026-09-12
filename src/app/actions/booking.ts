"use server";

import { revalidatePath } from "next/cache";
import { getServiceById, createBooking } from "@/lib/queries";
import { getAvailableSlots } from "@/lib/settings";
import { bookingSchema, fieldErrors } from "@/lib/validation";
import { isClosedDay, todayISO } from "@/lib/format";

export type BookingActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  reference?: string;
};

export async function submitBookingAction(formData: FormData): Promise<BookingActionState> {
  const raw = {
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
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "تأكد من البيانات المدخلة من فضلك.",
      errors: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  try {
    // لا يُقبل حجز في الماضي
    if (data.scheduled_date < todayISO()) {
      return { ok: false, message: "لا يمكن الحجز في تاريخ سابق.", errors: { scheduled_date: "اختر تاريخاً قادماً" } };
    }

    const { settings } = await getAvailableSlots(data.scheduled_date, 60);

    if (isClosedDay(data.scheduled_date, settings.closed_days)) {
      return { ok: false, message: "الورشة مغلقة في هذا اليوم — اختر يوماً آخر." };
    }

    // التأكد من أن الموعد ما زال متاحاً (يُعاد الفحص قبل الحفظ)
    const service = await getServiceById(data.service_id);
    if (!service || !service.is_active) {
      return { ok: false, message: "الخدمة المختارة غير متاحة حالياً." };
    }

    const { closed, slots } = await getAvailableSlots(
      data.scheduled_date,
      service.duration_minutes
    );
    if (closed) {
      return { ok: false, message: "الورشة مغلقة في هذا اليوم — اختر يوماً آخر." };
    }

    const slot = slots.find((s) => s.time === data.scheduled_time);
    if (!slot) {
      return { ok: false, message: "الموعد المختار غير متاح — اختر موعداً آخر." };
    }
    if (!slot.available) {
      return {
        ok: false,
        message: "للأسف تم حجز هذا الموعد للتو — اختر موعداً آخر من فضلك.",
        errors: { scheduled_time: "الموعد لم يعد متاحاً" },
      };
    }

    const { reference } = await createBooking({
      service_id: data.service_id,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email ?? null,
      customer_notes: data.customer_notes ?? null,
      make: data.make,
      model: data.model,
      year: data.year ?? null,
      plate_number: data.plate_number ?? null,
      color: data.color ?? null,
      mileage: data.mileage ?? null,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    return { ok: true, reference };
  } catch (err) {
    console.error("submitBookingAction error:", err);
    return {
      ok: false,
      message: "حدث خطأ غير متوقع أثناء حفظ الحجز. حاول مرة أخرى أو اتصل بنا هاتفياً.",
    };
  }
}
