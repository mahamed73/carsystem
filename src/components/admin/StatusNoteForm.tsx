"use client";

import { updateStatusAction } from "@/app/actions/admin";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/format";
import SubmitButton from "./SubmitButton";
import type { BookingStatus } from "@/lib/types";

/** تغيير الحالة مع إضافة ملاحظة في سجل الحجز */
export default function StatusNoteForm({
  id,
  status,
}: {
  id: number;
  status: BookingStatus;
}) {
  return (
    <form action={updateStatusAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="label" htmlFor="status">
          حالة الحجز
        </label>
        <select id="status" name="status" defaultValue={status} className="field">
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="note">
          ملاحظة على التحديث (اختياري)
        </label>
        <input
          id="note"
          name="note"
          className="field"
          placeholder="مثال: تم إبلاغ العميل بموعد التسليم"
        />
      </div>
      <SubmitButton pendingText="جارٍ التحديث…">🔄 تحديث الحالة</SubmitButton>
    </form>
  );
}
