"use client";

import { useActionState } from "react";
import { saveBookingAction, type ActionState } from "@/app/actions/admin";
import SubmitButton from "./SubmitButton";
import type { Booking } from "@/lib/types";

const initial: ActionState = {};

export default function BookingEditForm({
  booking,
  staff,
}: {
  booking: Booking;
  staff: { id: number; name: string }[];
}) {
  const [state, formAction] = useActionState(saveBookingAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={booking.id} />

      {state.message ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            state.ok
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="scheduled_date">
            التاريخ
          </label>
          <input
            id="scheduled_date"
            name="scheduled_date"
            type="date"
            defaultValue={booking.scheduled_date}
            className="field"
          />
          {state.errors?.scheduled_date ? (
            <p className="error-text">{state.errors.scheduled_date}</p>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="scheduled_time">
            الوقت
          </label>
          <input
            id="scheduled_time"
            name="scheduled_time"
            type="time"
            defaultValue={booking.scheduled_time}
            className="field"
          />
          {state.errors?.scheduled_time ? (
            <p className="error-text">{state.errors.scheduled_time}</p>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="price">
            السعر النهائي (ج.م)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={booking.price ?? ""}
            placeholder={String(booking.service_price)}
            className="field tabular-nums"
          />
          {state.errors?.price ? <p className="error-text">{state.errors.price}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="assigned_to">
            الفني المسؤول
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            defaultValue={booking.assigned_to ? String(booking.assigned_to) : ""}
            className="field"
          >
            <option value="">— بدون —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="admin_notes">
          ملاحظات داخلية (لا تظهر للعميل)
        </label>
        <textarea
          id="admin_notes"
          name="admin_notes"
          defaultValue={booking.admin_notes ?? ""}
          className="field min-h-[96px] resize-y"
          placeholder="تفاصيل الفحص، القطع المطلوبة، أي اتفاق جانبي…"
        />
      </div>

      <SubmitButton>💾 حفظ التعديلات</SubmitButton>
    </form>
  );
}
