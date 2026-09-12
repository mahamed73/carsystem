"use client";

import { useActionState } from "react";
import { saveCustomerNotesAction, type ActionState } from "@/app/actions/admin";
import SubmitButton from "./SubmitButton";

export default function CustomerNotesForm({
  customerId,
  notes,
}: {
  customerId: number;
  notes: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveCustomerNotesAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={customerId} />
      <textarea
        name="notes"
        defaultValue={notes ?? ""}
        className="field min-h-[120px] resize-y"
        placeholder="ملاحظات عن العميل: تفضيلاته، تاريخ التعامل، أي شكاوى أو اتفاق خاص…"
      />
      <div className="flex items-center gap-3">
        <SubmitButton>💾 حفظ الملاحظات</SubmitButton>
        {state.message ? (
          <span
            className={`text-xs font-bold ${state.ok ? "text-emerald-700" : "text-rose-700"}`}
          >
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
