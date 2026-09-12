"use client";

import { useActionState } from "react";
import { saveSettingsAction, type ActionState } from "@/app/actions/admin";
import SubmitButton from "./SubmitButton";
import type { WorkshopSettings } from "@/lib/types";

const DAYS = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

export default function SettingsForm({ settings }: { settings: WorkshopSettings }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveSettingsAction, {});
  const closed = settings.closed_days
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => !Number.isNaN(d));

  return (
    <form action={formAction} className="space-y-6">
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

      <div className="card-pad">
        <h2 className="font-extrabold text-slate-900">بيانات الورشة</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="workshop_name">
              اسم الورشة *
            </label>
            <input
              id="workshop_name"
              name="workshop_name"
              className="field"
              defaultValue={settings.workshop_name}
              required
            />
            {state.errors?.workshop_name ? (
              <p className="error-text">{state.errors.workshop_name}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="phone">
              رقم الهاتف *
            </label>
            <input
              id="phone"
              name="phone"
              dir="ltr"
              className="field"
              defaultValue={settings.phone}
            />
          </div>
          <div>
            <label className="label" htmlFor="whatsapp">
              رقم واتساب (بصيغة دولية بدون +)
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              dir="ltr"
              className="field"
              defaultValue={settings.whatsapp}
              placeholder="201000000000"
            />
          </div>
          <div>
            <label className="label" htmlFor="address">
              العنوان
            </label>
            <input id="address" name="address" className="field" defaultValue={settings.address} />
          </div>
        </div>
      </div>

      <div className="card-pad">
        <h2 className="font-extrabold text-slate-900">مواعيد العمل وسعة الاستقبال</h2>
        <p className="mt-1 text-sm text-slate-500">
          تُستخدم هذه القيم لحساب المواعيد المتاحة التي تظهر للعملاء في صفحة الحجز.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="open_time">
              وقت الفتح
            </label>
            <input
              id="open_time"
              name="open_time"
              type="time"
              className="field"
              defaultValue={settings.open_time}
            />
            {state.errors?.open_time ? <p className="error-text">{state.errors.open_time}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="close_time">
              وقت الإغلاق
            </label>
            <input
              id="close_time"
              name="close_time"
              type="time"
              className="field"
              defaultValue={settings.close_time}
            />
            {state.errors?.close_time ? (
              <p className="error-text">{state.errors.close_time}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="slot_minutes">
              مدة الفترة الواحدة (دقيقة)
            </label>
            <input
              id="slot_minutes"
              name="slot_minutes"
              type="number"
              min={15}
              step={15}
              className="field tabular-nums"
              defaultValue={settings.slot_minutes}
            />
          </div>
          <div>
            <label className="label" htmlFor="capacity">
              عدد السيارات في نفس الوقت
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={50}
              className="field tabular-nums"
              defaultValue={settings.capacity}
            />
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="label">أيام الإغلاق الأسبوعية</legend>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((d) => (
              <label
                key={d.value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
              >
                <input
                  type="checkbox"
                  name={`day-${d.value}`}
                  value={d.value}
                  defaultChecked={closed.includes(d.value)}
                  className="size-4 accent-brand-600"
                />
                {d.label}
              </label>
            ))}
          </div>
          <p className="hint">
            ملاحظة: يتم جمع الأيام المختارة تلقائياً عند الحفظ (تُخزَّن كأرقام: الأحد=0 … السبت=6).
          </p>
        </fieldset>

        {/* الحقل الفعلي الذي يُرسل — يُحدَّث من الشيك بوكس عند الحفظ */}
        <input type="hidden" name="closed_days" id="closed_days" defaultValue={settings.closed_days} />

        <div className="mt-4">
          <label className="label" htmlFor="slot_note">
            ملاحظة تظهر للعميل مع المواعيد
          </label>
          <textarea
            id="slot_note"
            name="slot_note"
            className="field min-h-[80px]"
            defaultValue={settings.slot_note}
          />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full sm:w-64">💾 حفظ الإعدادات</SubmitButton>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var form = document.currentScript.closest('form');
              if (!form) return;
              form.addEventListener('submit', function () {
                var picked = [];
                form.querySelectorAll('input[name^="day-"]:checked').forEach(function (el) {
                  picked.push(el.value);
                });
                var target = form.querySelector('#closed_days');
                if (target) target.value = picked.join(',');
              }, { capture: true });
            })();
          `,
        }}
      />
    </form>
  );
}
