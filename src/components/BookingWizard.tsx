"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitBookingAction } from "@/app/actions/booking";
import type { Service, Slot } from "@/lib/types";
import { formatMoney, formatShortDateAr, formatTimeAr } from "@/lib/format";

export interface DayOption {
  iso: string;
  weekday: string;
  dayNum: string;
  month: string;
  closed: boolean;
}

const STEPS = ["الخدمة", "الموعد", "بيانات السيارة", "تأكيد"] as const;

const BRANDS = [
  "تويوتا", "هيونداي", "نيسان", "كيا", "شيفروليه", "فيات", "رينو", "ميتسوبيشي",
  "سوزوكي", "بيجو", "فولكس فاجن", "سكودا", "بي إم دبليو", "مرسيدس", "أوبل", "إم جي",
  "بي واي دي", "شيري", "جاك", "لادا", "سيات", "هوندا", "مازدا", "جيب", "فورد",
];

export default function BookingWizard({
  services,
  days,
  whatsapp,
  phone,
}: {
  services: Service[];
  days: DayOption[];
  whatsapp: string;
  phone: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [dateOverride, setDateOverride] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotNote, setSlotNote] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_notes: "",
    make: "",
    model: "",
    year: "",
    plate_number: "",
    color: "",
    mileage: "",
  });

  const setField = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const firstOpenDay = useMemo(() => days.find((d) => !d.closed)?.iso ?? "", [days]);
  // التاريخ الفعلي = اختيار العميل أو أول يوم مفتوح (بدون useEffect لتجنب إعادة الرسم المتسلسلة)
  const date = dateOverride || firstOpenDay;
  const setDate = setDateOverride;

  /* جلب المواعيد المتاحة عند تغيير اليوم أو الخدمة */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!date || !service) return;
    const controller = new AbortController();
    let cancelled = false;

    // التأجيل خارج جسم الـ effect لتجنب setState المتزامن
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setLoadingSlots(true);
      setTime("");
      try {
        const res = await fetch(`/api/slots?date=${date}&service=${service.id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json();
        if (cancelled) return;
        setSlots(json.slots ?? []);
        setSlotNote(json.slot_note ?? "");
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [date, service, reloadKey]);

  const availableCount = slots.filter((s) => s.available).length;

  function goNext() {
    setMessage("");
    if (step === 0 && !service) {
      setMessage("اختر الخدمة المطلوبة أولاً.");
      return;
    }
    if (step === 1 && (!date || !time)) {
      setMessage("اختر اليوم والموعد المناسب.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function goBack() {
    setMessage("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    if (!service || !date || !time) {
      setMessage("من فضلك أكمل اختيار الخدمة والموعد أولاً.");
      return;
    }
    const fd = new FormData();
    fd.set("service_id", String(service.id));
    fd.set("scheduled_date", date);
    fd.set("scheduled_time", time);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));

    startTransition(async () => {
      try {
        const res = await submitBookingAction(fd);
        if (res.ok && res.reference) {
          router.push(`/booking/${res.reference}`);
          return;
        }
        setErrors(res.errors ?? {});
        setMessage(res.message ?? "تعذّر إتمام الحجز، حاول مرة أخرى.");
        if (res.errors?.scheduled_time) {
          setStep(1);
          setReloadKey((k) => k + 1); // إعادة جلب المواعيد المتاحة
        }
      } catch {
        // انقطاع الشبكة أو خطأ في الاتصال بالخادم
        setMessage(
          "تعذّر الاتصال بالخادم — تأكد من الإنترنت وحاول مرة أخرى، أو احجز هاتفياً/واتساب."
        );
      }
    });
  }

  const summary = [
    { label: "الخدمة", value: service ? `${service.icon} ${service.name}` : "—" },
    { label: "المدة", value: service ? `${service.duration_minutes} دقيقة` : "—" },
    { label: "السعر التقديري", value: service ? formatMoney(service.price) : "—" },
    { label: "اليوم", value: date ? formatShortDateAr(date) : "—" },
    { label: "الموعد", value: time ? formatTimeAr(time) : "—" },
  ];

  return (
    <div className="card overflow-hidden" id="booking-wizard">
      {/* شريط الخطوات */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 sm:gap-2 sm:p-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => (i < step ? setStep(i) : undefined)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-bold transition sm:text-sm ${
                i === step
                  ? "bg-brand-600 text-white shadow-sm"
                  : i < step
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "text-slate-400"
              }`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] ${
                  i === step ? "bg-white/25" : i < step ? "bg-emerald-500 text-white" : "bg-slate-200"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        {message ? (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
          >
            ⚠️ {message}
          </div>
        ) : null}

        {/* ---------------- الخطوة 1: الخدمة ---------------- */}
        {step === 0 ? (
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">اختر الخدمة المطلوبة</h3>
            <p className="mt-1 text-sm text-slate-500">
              مدة الموعد تُحدد تلقائياً حسب الخدمة المختارة.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => {
                const active = service?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setService(s);
                      setMessage("");
                    }}
                    className={`rounded-2xl border p-4 text-right transition ${
                      active
                        ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/30"
                        : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl">{s.icon}</span>
                      {active ? (
                        <span className="badge bg-brand-600 text-white ring-brand-600">مختارة ✓</span>
                      ) : null}
                    </div>
                    <p className="mt-2 font-bold text-slate-900">{s.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {s.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold">
                      <span className="text-brand-700">{formatMoney(s.price)}</span>
                      <span className="text-slate-500">⏱ {s.duration_minutes} دقيقة</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ---------------- الخطوة 2: الموعد ---------------- */}
        {step === 1 ? (
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">اختر يوم وموعد الزيارة</h3>
            <p className="mt-1 text-sm text-slate-500">
              المواعيد المتاحة محسوبة حسب مدة الخدمة وعدد السيارات التي يمكن استقبالها في نفس الوقت.
            </p>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const active = date === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    disabled={d.closed}
                    onClick={() => setDate(d.iso)}
                    className={`min-w-[86px] shrink-0 rounded-2xl border px-3 py-2.5 text-center transition ${
                      active
                        ? "border-brand-500 bg-brand-600 text-white shadow-sm"
                        : d.closed
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                    }`}
                  >
                    <span className="block text-xs font-bold">{d.weekday}</span>
                    <span className="block text-lg font-extrabold tabular-nums">{d.dayNum}</span>
                    <span className="block text-[11px]">{d.month}</span>
                    {d.closed ? <span className="mt-0.5 block text-[10px]">مغلق</span> : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">المواعيد المتاحة</span>
                <span className="text-xs text-slate-500">
                  {loadingSlots ? "جارٍ التحميل…" : `${availableCount} موعد متاح`}
                </span>
              </div>

              {loadingSlots ? (
                <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                  لا توجد مواعيد متاحة في هذا اليوم — جرّب يوماً آخر.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {slots.map((s) => {
                    const active = time === s.time;
                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setTime(s.time)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                          active
                            ? "border-brand-500 bg-brand-600 text-white shadow-sm"
                            : s.available
                              ? "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                        }`}
                      >
                        {formatTimeAr(s.time)}
                      </button>
                    );
                  })}
                </div>
              )}

              {slotNote ? <p className="hint">📌 {slotNote}</p> : null}
              {errors.scheduled_time ? (
                <p className="error-text">{errors.scheduled_time}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ---------------- الخطوة 3: البيانات ---------------- */}
        {step === 2 ? (
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">بياناتك وبيانات السيارة</h3>
            <p className="mt-1 text-sm text-slate-500">
              لو لديك حجز سابق بنفس رقم الهاتف سيتم ربط الحجز بملفك تلقائياً.
            </p>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <span className="grid size-7 place-items-center rounded-lg bg-brand-100 text-brand-700">
                    👤
                  </span>
                  بيانات العميل
                </p>
                <div>
                  <label className="label" htmlFor="customer_name">
                    الاسم بالكامل *
                  </label>
                  <input
                    id="customer_name"
                    className="field"
                    value={form.customer_name}
                    onChange={(e) => setField("customer_name")(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    autoComplete="name"
                  />
                  {errors.customer_name ? (
                    <p className="error-text">{errors.customer_name}</p>
                  ) : null}
                </div>
                <div>
                  <label className="label" htmlFor="customer_phone">
                    رقم الهاتف (واتساب) *
                  </label>
                  <input
                    id="customer_phone"
                    className="field tabular-nums"
                    value={form.customer_phone}
                    onChange={(e) => setField("customer_phone")(e.target.value)}
                    placeholder="01012345678"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                  />
                  {errors.customer_phone ? (
                    <p className="error-text">{errors.customer_phone}</p>
                  ) : <p className="hint">سنرسل تأكيد الحجز على هذا الرقم.</p>}
                </div>
                <div>
                  <label className="label" htmlFor="customer_email">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    id="customer_email"
                    className="field"
                    value={form.customer_email}
                    onChange={(e) => setField("customer_email")(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    type="email"
                  />
                  {errors.customer_email ? (
                    <p className="error-text">{errors.customer_email}</p>
                  ) : null}
                </div>
                <div>
                  <label className="label" htmlFor="customer_notes">
                    ملاحظات إضافية
                  </label>
                  <textarea
                    id="customer_notes"
                    className="field min-h-[88px] resize-y"
                    value={form.customer_notes}
                    onChange={(e) => setField("customer_notes")(e.target.value)}
                    placeholder="اشرح المشكلة بأي تفاصيل تهم الفني…"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <span className="grid size-7 place-items-center rounded-lg bg-brand-100 text-brand-700">
                    🚗
                  </span>
                  بيانات السيارة
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="make">
                      الماركة *
                    </label>
                    <input
                      id="make"
                      className="field"
                      list="brands"
                      value={form.make}
                      onChange={(e) => setField("make")(e.target.value)}
                      placeholder="تويوتا"
                    />
                    <datalist id="brands">
                      {BRANDS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                    {errors.make ? <p className="error-text">{errors.make}</p> : null}
                  </div>
                  <div>
                    <label className="label" htmlFor="model">
                      الموديل *
                    </label>
                    <input
                      id="model"
                      className="field"
                      value={form.model}
                      onChange={(e) => setField("model")(e.target.value)}
                      placeholder="كورولا"
                    />
                    {errors.model ? <p className="error-text">{errors.model}</p> : null}
                  </div>
                  <div>
                    <label className="label" htmlFor="year">
                      سنة الصنع
                    </label>
                    <input
                      id="year"
                      className="field tabular-nums"
                      value={form.year}
                      onChange={(e) => setField("year")(e.target.value)}
                      placeholder="2020"
                      inputMode="numeric"
                    />
                    {errors.year ? <p className="error-text">{errors.year}</p> : null}
                  </div>
                  <div>
                    <label className="label" htmlFor="plate_number">
                      رقم اللوحة
                    </label>
                    <input
                      id="plate_number"
                      className="field"
                      value={form.plate_number}
                      onChange={(e) => setField("plate_number")(e.target.value)}
                      placeholder="د ا ر 1234"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="color">
                      اللون
                    </label>
                    <input
                      id="color"
                      className="field"
                      value={form.color}
                      onChange={(e) => setField("color")(e.target.value)}
                      placeholder="أبيض"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="mileage">
                      قراءة العداد (كم)
                    </label>
                    <input
                      id="mileage"
                      className="field tabular-nums"
                      value={form.mileage}
                      onChange={(e) => setField("mileage")(e.target.value)}
                      placeholder="85000"
                      inputMode="numeric"
                    />
                    {errors.mileage ? <p className="error-text">{errors.mileage}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ---------------- الخطوة 4: التأكيد ---------------- */}
        {step === 3 ? (
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">مراجعة وتأكيد الحجز</h3>
            <p className="mt-1 text-sm text-slate-500">
              راجع البيانات ثم اضغط «تأكيد الحجز» — سيصلك رقم مرجعي لمتابعة حالة السيارة.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {summary.map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-3">
                    <dt className="text-sm text-slate-500">{row.label}</dt>
                    <dd className="text-sm font-bold text-slate-900">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm text-slate-500">الاسم</dt>
                  <dd className="text-sm font-bold text-slate-900">{form.customer_name || "—"}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm text-slate-500">الهاتف</dt>
                  <dd className="text-sm font-bold text-slate-900 tabular-nums" dir="ltr">
                    {form.customer_phone || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm text-slate-500">السيارة</dt>
                  <dd className="text-sm font-bold text-slate-900">
                    {[form.make, form.model, form.year].filter(Boolean).join(" ") || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm text-slate-500">رقم اللوحة</dt>
                  <dd className="text-sm font-bold text-slate-900">{form.plate_number || "—"}</dd>
                </div>
                <div className="px-4 py-3">
                  <dt className="text-sm text-slate-500">ملاحظات</dt>
                  <dd className="mt-1 text-sm text-slate-700">{form.customer_notes || "—"}</dd>
                </div>
              </dl>
            </div>

            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
              بتأكيدك للحجز أنت توافق على الحضور في الموعد المحدد. السعر المعروض تقديري وقد يتغير
              بعد فحص السيارة، وسيتم إبلاغك قبل تنفيذ أي عمل إضافي.
            </p>
          </div>
        ) : null}

        {/* ---------------- أزرار التنقل ---------------- */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <div className="flex gap-2">
            {step > 0 ? (
              <button type="button" className="btn-ghost" onClick={goBack} disabled={pending}>
                → السابق
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn-primary" onClick={goNext}>
                التالي ←
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary min-w-[160px]"
                onClick={handleSubmit}
                disabled={pending}
              >
                {pending ? "جارٍ تأكيد الحجز…" : "✅ تأكيد الحجز"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <a
              className="font-bold text-emerald-700 hover:underline"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("مرحباً، أريد الاستفسار عن حجز موعد صيانة")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 واتساب
            </a>
            <span className="text-slate-300">|</span>
            <a className="font-bold text-slate-700 hover:underline" href={`tel:${phone}`} dir="ltr">
              ☎️ {phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
