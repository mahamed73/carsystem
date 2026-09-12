"use client";

import { useActionState } from "react";
import { saveServiceAction, type ActionState } from "@/app/actions/admin";
import SubmitButton from "./SubmitButton";
import type { Service } from "@/lib/types";

const ICONS = ["🔧", "🛢️", "🧰", "🛑", "❄️", "🛞", "💻", "🔋", "🧼", "🚗", "⚙️", "🔩", "🪫", "🧽"];

export default function ServiceForm({ service }: { service?: Service }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveServiceAction, {});
  const editing = Boolean(service);

  return (
    <form action={formAction} className="space-y-4">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="label" htmlFor={`name-${service?.id ?? "new"}`}>
            اسم الخدمة *
          </label>
          <input
            id={`name-${service?.id ?? "new"}`}
            name="name"
            className="field"
            defaultValue={service?.name ?? ""}
            placeholder="تغيير زيت وفلتر"
            required
          />
          {state.errors?.name ? <p className="error-text">{state.errors.name}</p> : null}
        </div>

        <div>
          <label className="label" htmlFor={`duration-${service?.id ?? "new"}`}>
            المدة (دقيقة) *
          </label>
          <input
            id={`duration-${service?.id ?? "new"}`}
            name="duration_minutes"
            type="number"
            min={15}
            step={5}
            className="field tabular-nums"
            defaultValue={service?.duration_minutes ?? 60}
            required
          />
          {state.errors?.duration_minutes ? (
            <p className="error-text">{state.errors.duration_minutes}</p>
          ) : null}
        </div>

        <div>
          <label className="label" htmlFor={`price-${service?.id ?? "new"}`}>
            السعر (ج.م) *
          </label>
          <input
            id={`price-${service?.id ?? "new"}`}
            name="price"
            type="number"
            min={0}
            step="0.01"
            className="field tabular-nums"
            defaultValue={service?.price ?? 0}
            required
          />
          {state.errors?.price ? <p className="error-text">{state.errors.price}</p> : null}
        </div>

        <div className="lg:col-span-3">
          <label className="label" htmlFor={`description-${service?.id ?? "new"}`}>
            الوصف
          </label>
          <input
            id={`description-${service?.id ?? "new"}`}
            name="description"
            className="field"
            defaultValue={service?.description ?? ""}
            placeholder="ما الذي يشمله العمل بالتفصيل…"
          />
        </div>

        <div>
          <label className="label" htmlFor={`icon-${service?.id ?? "new"}`}>
            الأيقونة
          </label>
          <select
            id={`icon-${service?.id ?? "new"}`}
            name="icon"
            className="field"
            defaultValue={service?.icon ?? "🔧"}
          >
            {ICONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor={`sort-${service?.id ?? "new"}`}>
            الترتيب
          </label>
          <input
            id={`sort-${service?.id ?? "new"}`}
            name="sort_order"
            type="number"
            min={0}
            className="field tabular-nums"
            defaultValue={service?.sort_order ?? 0}
          />
        </div>

        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={service ? service.is_active : true}
              className="size-4 accent-brand-600"
            />
            مُفعّلة وظاهرة للعملاء
          </label>
        </div>
      </div>

      <SubmitButton>{editing ? "💾 حفظ التعديلات" : "➕ إضافة الخدمة"}</SubmitButton>
    </form>
  );
}
