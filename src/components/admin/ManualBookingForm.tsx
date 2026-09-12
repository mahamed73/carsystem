"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createManualBookingAction, type ActionState } from "@/app/actions/admin";
import { formatTimeAr, todayISO } from "@/lib/format";
import type { Service, Slot } from "@/lib/types";

const BRANDS = [
  "تويوتا", "هيونداي", "نيسان", "كيا", "شيفروليه", "فيات", "رينو", "ميتسوبيشي",
  "سوزوكي", "بيجو", "فولكس فاجن", "سكودا", "بي إم دبليو", "مرسيدس", "أوبل", "إم جي",
  "بي واي دي", "شيري", "جاك", "لادا", "سيات", "هوندا", "مازدا", "جيب", "فورد",
];

export default function ManualBookingForm({ services }: { services: Service[] }) {
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  const [serviceId, setServiceId] = useState<number>(services[0]?.id ?? 0);
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdRef, setCreatedRef] = useState<string>("");

  useEffect(() => {
    if (!date || !serviceId) return;
    const controller = new AbortController();
    let cancelled = false;

    // التأجيل خارج جسم الـ effect لتجنب setState المتزامن
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/slots?date=${date}&service=${serviceId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json();
        if (!cancelled) setSlots(json.slots ?? []);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [date, serviceId]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!time) {
      setState({ ok: false, message: "اختر وقت الموعد من القائمة." });
      return;
    }
    fd.set("scheduled_time", time);
    startTransition(async () => {
      const res = await createManualBookingAction({}, fd);
      setState(res);
      if (res.ok && res.reference) setCreatedRef(res.reference);
    });
  }

  if (createdRef) {
    return (
      <div className="card-pad text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-2 text-lg font-extrabold text-slate-900">تم إنشاء الحجز</h2>
        <p className="mt-1 text-sm text-slate-600">
          الرقم المرجعي:{" "}
          <span className="font-extrabold tracking-wider text-brand-700" dir="ltr">
            {createdRef}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/admin/bookings" className="btn-dark">
            كل الحجوزات
          </Link>
          <Link href={`/booking/${createdRef}`} className="btn-ghost" target="_blank">
            عرض صفحة العميل
          </Link>
          <button type="button" className="btn-ghost" onClick={() => setCreatedRef("")}>
            + حجز آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state.message ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          ⚠️ {state.message}
        </div>
      ) : null}

      <div className="card-pad">
        <h2 className="font-extrabold text-slate-900">بيانات العميل</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="customer_name">
              الاسم *
            </label>
            <input id="customer_name" name="customer_name" className="field" required />
            {state.errors?.customer_name ? (
              <p className="error-text">{state.errors.customer_name}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="customer_phone">
              الهاتف *
            </label>
            <input
              id="customer_phone"
              name="customer_phone"
              className="field tabular-nums"
              dir="ltr"
              inputMode="tel"
              placeholder="01012345678"
              required
            />
            {state.errors?.customer_phone ? (
              <p className="error-text">{state.errors.customer_phone}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="customer_email">
              البريد الإلكتروني
            </label>
            <input id="customer_email" name="customer_email" type="email" dir="ltr" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="customer_notes">
              ملاحظات العميل
            </label>
            <input id="customer_notes" name="customer_notes" className="field" />
          </div>
        </div>
      </div>

      <div className="card-pad">
        <h2 className="font-extrabold text-slate-900">السيارة</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label" htmlFor="make">
              الماركة *
            </label>
            <input id="make" name="make" list="brands" className="field" required />
            <datalist id="brands">
              {BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            {state.errors?.make ? <p className="error-text">{state.errors.make}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="model">
              الموديل *
            </label>
            <input id="model" name="model" className="field" required />
            {state.errors?.model ? <p className="error-text">{state.errors.model}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="year">
              سنة الصنع
            </label>
            <input id="year" name="year" inputMode="numeric" className="field tabular-nums" />
          </div>
          <div>
            <label className="label" htmlFor="plate_number">
              رقم اللوحة
            </label>
            <input id="plate_number" name="plate_number" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="color">
              اللون
            </label>
            <input id="color" name="color" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="mileage">
              قراءة العداد (كم)
            </label>
            <input id="mileage" name="mileage" inputMode="numeric" className="field tabular-nums" />
          </div>
        </div>
      </div>

      <div className="card-pad">
        <h2 className="font-extrabold text-slate-900">الخدمة والموعد</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="label" htmlFor="service_id">
              الخدمة *
            </label>
            <select
              id="service_id"
              name="service_id"
              className="field"
              value={serviceId}
              onChange={(e) => setServiceId(Number(e.target.value))}
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name} — {s.duration_minutes} د — {s.price} ج.م
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="scheduled_date">
              التاريخ *
            </label>
            <input
              id="scheduled_date"
              name="scheduled_date"
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <span className="label">الوقت *</span>
          {loading ? (
            <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              الورشة مغلقة في هذا اليوم — اختر يوماً آخر.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => setTime(s.time)}
                  title={s.available ? "متاح" : `محجوز (${s.taken}/${s.capacity})`}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                    time === s.time
                      ? "border-brand-500 bg-brand-600 text-white"
                      : s.available
                        ? "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                        : "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400"
                  }`}
                >
                  {formatTimeAr(s.time)}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                    {s.taken}/{s.capacity}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="hint">
            يمكنك اختيار موعد محجوز بالكامل لتجاوز حد السعة (حجز يدوي من الاستقبال).
          </p>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full sm:w-64" disabled={pending}>
        {pending ? "جارٍ إنشاء الحجز…" : "✅ إنشاء الحجز"}
      </button>
    </form>
  );
}
