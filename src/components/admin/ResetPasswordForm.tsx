"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ActionState } from "@/app/actions/admin";
import SubmitButton from "./SubmitButton";

export default function ResetPasswordForm({ userId }: { userId: number }) {
  const [state, formAction] = useActionState<ActionState, FormData>(resetPasswordAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <input
        name="password"
        type="password"
        dir="ltr"
        placeholder="كلمة مرور جديدة"
        className="field !w-44 !py-2 text-xs"
        minLength={6}
        required
      />
      <SubmitButton className="btn-ghost !px-3 !py-2 text-xs" pendingText="…">
        🔑 تعيين
      </SubmitButton>
      {state.message ? (
        <span className={`text-xs font-bold ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
