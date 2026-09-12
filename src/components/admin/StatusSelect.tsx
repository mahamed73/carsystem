"use client";

import { updateStatusAction } from "@/app/actions/admin";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

/** قائمة تغيير حالة الحجز — تُحفظ تلقائياً عند الاختيار */
export default function StatusSelect({
  id,
  status,
  compact = false,
}: {
  id: number;
  status: BookingStatus;
  compact?: boolean;
}) {
  return (
    <form action={updateStatusAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="تغيير حالة الحجز"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`cursor-pointer rounded-xl border border-slate-300 bg-white font-bold text-slate-700 shadow-sm
                    transition hover:border-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25
                    focus:outline-none ${compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"}`}
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="btn-ghost !px-2 !py-1 text-xs">
          حفظ
        </button>
      </noscript>
    </form>
  );
}
