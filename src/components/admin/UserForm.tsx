"use client";

import { useActionState } from "react";
import { saveUserAction, type ActionState } from "@/app/actions/admin";
import SubmitButton from "./SubmitButton";

export default function UserForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(saveUserAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <div
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
            state.ok
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="label" htmlFor="user-name">
            الاسم *
          </label>
          <input id="user-name" name="name" className="field" required placeholder="محمد الفني" />
          {state.errors?.name ? <p className="error-text">{state.errors.name}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="user-email">
            البريد الإلكتروني *
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            dir="ltr"
            className="field"
            required
            placeholder="tech@carsystem.local"
          />
          {state.errors?.email ? <p className="error-text">{state.errors.email}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="user-phone">
            الهاتف
          </label>
          <input id="user-phone" name="phone" dir="ltr" className="field" placeholder="01xxxxxxxxx" />
        </div>
        <div>
          <label className="label" htmlFor="user-password">
            كلمة المرور *
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            dir="ltr"
            className="field"
            required
            minLength={6}
          />
          {state.errors?.password ? <p className="error-text">{state.errors.password}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="user-role">
            الصلاحية
          </label>
          <select id="user-role" name="role" className="field" defaultValue="staff">
            <option value="staff">موظف / فني</option>
            <option value="admin">مدير نظام</option>
          </select>
        </div>
      </div>

      <SubmitButton>➕ إضافة المستخدم</SubmitButton>
    </form>
  );
}
