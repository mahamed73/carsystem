import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter, PublicHeader } from "@/components/PublicShell";
import PrintButton from "@/components/PrintButton";
import { getBookingByReference, getBookingEvents } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/ui";
import { formatDateAr, formatDateTimeAr, formatMoney, formatTimeAr, vehicleLabel, STATUS_LABELS } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const settings = await getSettings();

  let booking = null;
  try {
    booking = await getBookingByReference(decodeURIComponent(reference));
  } catch {
    booking = null;
  }
  if (!booking) notFound();

  const events = await getBookingEvents(booking.id).catch(() => []);

  const timeline: { key: BookingStatus; label: string }[] = [
    { key: "pending", label: "تم استلام الحجز" },
    { key: "confirmed", label: "تأكيد الموعد" },
    { key: "in_progress", label: "جاري العمل على السيارة" },
    { key: "completed", label: "تم التسليم" },
  ];
  const order: BookingStatus[] = ["pending", "confirmed", "in_progress", "completed"];
  const currentIndex = order.indexOf(booking.status);

  return (
    <div className="min-h-dvh bg-slate-50">
      <PublicHeader settings={settings} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-4xl">✅</div>
          <h1 className="mt-2 text-xl font-extrabold text-emerald-900 sm:text-2xl">
            تم استلام طلب الحجز بنجاح
          </h1>
          <p className="mt-1 text-sm text-emerald-800">
            سنتواصل معك على الرقم {booking.customer_phone} لتأكيد الموعد.
          </p>

          <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-emerald-300 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">رقم الحجز المرجعي</p>
            <p className="text-2xl font-extrabold tracking-widest text-slate-900" dir="ltr">
              {booking.reference}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              احتفظ بالرقم لمتابعة حالة سيارتك في أي وقت.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <PrintButton />
            <a
              className="btn-ghost"
              href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
                `مرحباً، حجزت موعد صيانة برقم ${booking.reference}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 تواصل واتساب
            </a>
            <Link className="btn-dark" href={`/track?ref=${booking.reference}`}>
              🔎 تتبع الحجز
            </Link>
          </div>
        </div>

        <div className="card mt-6 overflow-hidden">
          <h2 className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-extrabold text-slate-900">
            تفاصيل الموعد
          </h2>
          <dl className="divide-y divide-slate-100">
            {[
              ["الخدمة", `${booking.service_icon} ${booking.service_name}`],
              ["التاريخ", formatDateAr(booking.scheduled_date)],
              ["الموعد", formatTimeAr(booking.scheduled_time)],
              ["المدة المتوقعة", `${booking.duration_minutes} دقيقة`],
              ["السيارة", vehicleLabel(booking)],
              ["رقم اللوحة", booking.vehicle_plate || "—"],
              ["السعر التقديري", formatMoney(booking.price ?? booking.service_price)],
              ["حالة الحجز", STATUS_LABELS[booking.status]],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-bold text-slate-900">
                  {label === "حالة الحجز" ? <StatusBadge status={booking.status} /> : value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-600">
            📌 {settings.slot_note}
            <br />
            📍 {settings.address} — ☎️ <span dir="ltr">{settings.phone}</span>
          </div>
        </div>

        {/* شريط تقدم الحالة */}
        <div className="card-pad mt-6">
          <h2 className="font-extrabold text-slate-900">مراحل الحجز</h2>
          <ol className="mt-4 space-y-3">
            {timeline.map((t, i) => {
              const done = currentIndex >= i && currentIndex !== -1;
              const cancelled = booking.status === "cancelled" || booking.status === "no_show";
              return (
                <li key={t.key} className="flex items-center gap-3">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                      done && !cancelled
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {done && !cancelled ? "✓" : i + 1}
                  </span>
                  <span
                    className={`text-sm font-bold ${done && !cancelled ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {t.label}
                  </span>
                </li>
              );
            })}
          </ol>

          {events.length > 0 ? (
            <>
              <h3 className="mt-6 text-sm font-extrabold text-slate-700">سجل التحديثات</h3>
              <ul className="mt-3 space-y-2 border-r-2 border-slate-100 pr-4">
                {events.map((e) => (
                  <li key={e.id} className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800">
                      {e.status ? STATUS_LABELS[e.status] : "تحديث"}
                    </span>
                    {e.note ? ` — ${e.note}` : ""}
                    <span className="block text-slate-400">{formatDateTimeAr(e.created_at)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
