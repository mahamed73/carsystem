import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/PublicShell";
import { getBookingByReference } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/ui";
import { formatDateAr, formatMoney, formatTimeAr, vehicleLabel } from "@/lib/format";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "تتبع حجزك" };

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const settings = await getSettings();

  let booking: Booking | null = null;
  let error = "";
  let searched = false;

  const code = (ref ?? "").trim();
  if (code) {
    searched = true;
    try {
      booking = await getBookingByReference(code);
      if (!booking) error = "لم نجد حجزاً بهذا الرقم المرجعي. تأكد من الرقم وحاول مرة أخرى.";
    } catch {
      error = "تعذّر الوصول لقاعدة البيانات حالياً — حاول بعد قليل.";
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <PublicHeader settings={settings} active="track" />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">تتبع حالة حجزك</h1>
        <p className="mt-2 text-sm text-slate-500">
          اكتب الرقم المرجعي الذي وصلك عند الحجز (مثال: <span dir="ltr">CR-260910-A3K9</span>) لعرض
          تفاصيل الموعد وحالة سيارتك.
        </p>

        <form className="card-pad mt-6 flex flex-col gap-3 sm:flex-row" method="get">
          <input
            name="ref"
            defaultValue={code}
            placeholder="CR-260910-A3K9"
            dir="ltr"
            className="field flex-1 text-center font-bold tracking-widest uppercase"
            aria-label="الرقم المرجعي للحجز"
          />
          <button className="btn-primary sm:w-40" type="submit">
            🔎 ابحث
          </button>
        </form>

        {searched && error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}

        {booking ? (
          <div className="card mt-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-xs text-slate-500">الرقم المرجعي</p>
                <p className="font-extrabold tracking-wider text-slate-900" dir="ltr">
                  {booking.reference}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <dl className="divide-y divide-slate-100">
              {[
                ["الخدمة", `${booking.service_icon} ${booking.service_name}`],
                ["التاريخ", formatDateAr(booking.scheduled_date)],
                ["الموعد", formatTimeAr(booking.scheduled_time)],
                ["المدة المتوقعة", `${booking.duration_minutes} دقيقة`],
                ["العميل", booking.customer_name],
                ["السيارة", vehicleLabel(booking)],
                ["رقم اللوحة", booking.vehicle_plate || "—"],
                ["السعر التقديري", formatMoney(booking.price ?? booking.service_price)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="text-sm font-bold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            {booking.customer_notes ? (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-500">ملاحظاتك</p>
                <p className="mt-1 text-sm text-slate-700">{booking.customer_notes}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <a
                className="btn-ghost"
                href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
                  `مرحباً، أستفسر عن حجز رقم ${booking.reference}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 استفسار واتساب
              </a>
              <a className="btn-ghost" href={`tel:${settings.phone}`} dir="ltr">
                ☎️ {settings.phone}
              </a>
              <Link className="btn-dark" href="/#booking">
                + حجز جديد
              </Link>
            </div>
          </div>
        ) : null}
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
