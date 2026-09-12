"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "جارٍ الدخول…" : "دخول لوحة التحكم"}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          ⚠️ {state.error}
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="email">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          dir="ltr"
          autoComplete="username"
          defaultValue={state.email ?? ""}
          className="field"
          placeholder="admin@carsystem.local"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          dir="ltr"
          autoComplete="current-password"
          className="field"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />

      <p className="text-center text-xs text-slate-500">
        هل نسيت كلمة المرور؟ راجع مدير النظام لإعادة تعيينها من صفحة المستخدمين.
      </p>
    </form>
  );
}
