import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui";
import StatusNoteForm from "@/components/admin/StatusNoteForm";
import BookingEditForm from "@/components/admin/BookingEditForm";
import PrintButton from "@/components/PrintButton";
import { getBookingById, getBookingEvents, listStaff } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import {
  STATUS_LABELS,
  formatDateAr,
  formatDateTimeAr,
  formatMoney,
  formatTimeAr,
  vehicleLabel,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const booking = await getBookingById(id).catch(() => null);
  if (!booking) notFound();

  const [events, staff, settings] = await Promise.all([
    getBookingEvents(booking.id).catch(() => []),
    listStaff().catch(() => []),
    getSettings(),
  ]);

  const waText = encodeURIComponent(
    `مرحباً ${booking.customer_name}، بخصوص حجزك رقم ${booking.reference} في ${formatDateAr(
      booking.scheduled_date
    )} الساعة ${formatTimeAr(booking.scheduled_time)} — ${settings.workshop_name}`
  );

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/bookings" className="text-xs font-bold text-brand-700 hover:underline">
            ← كل الحجوزات
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900" dir="ltr">
            {booking.reference}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          <PrintButton />
          <a className="btn-ghost" href={`https://wa.me/2${booking.customer_phone.replace(/^0/, "")}?text=${waText}`} target="_blank" rel="noopener noreferrer">
            💬 واتساب العميل
          </a>
          <a className="btn-ghost" href={`tel:${booking.customer_phone}`} dir="ltr">
            ☎️ {booking.customer_phone}
          </a>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* التفاصيل */}
        <div className="space-y-5 xl:col-span-2">
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-extrabold text-slate-900">
              تفاصيل الموعد
            </h2>
            <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              {[
                ["الخدمة", `${booking.service_icon} ${booking.service_name}`],
                ["المدة المتوقعة", `${booking.duration_minutes} دقيقة`],
                ["التاريخ", formatDateAr(booking.scheduled_date)],
                ["الوقت", formatTimeAr(booking.scheduled_time)],
                ["السعر التقديري", formatMoney(booking.price ?? booking.service_price)],
                ["الفني المسؤول", booking.assigned_name ?? "— غير محدد —"],
                ["تاريخ الحجز", formatDateTimeAr(booking.created_at)],
                ["تاريخ التسليم", booking.completed_at ? formatDateTimeAr(booking.completed_at) : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            {booking.customer_notes ? (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-500">ملاحظات العميل</p>
                <p className="mt-1 text-sm text-slate-700">{booking.customer_notes}</p>
              </div>
            ) : null}
          </div>

          <div className="card-pad no-print">
            <h2 className="font-extrabold text-slate-900">تعديل بيانات الحجز</h2>
            <p className="mt-1 text-sm text-slate-500">
              يمكنك تغيير الموعد أو السعر النهائي أو تعيين الفني المسؤول.
            </p>
            <div className="mt-5">
              <BookingEditForm booking={booking} staff={staff} />
            </div>
          </div>
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-5">
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-extrabold text-slate-900">
              العميل والسيارة
            </h2>
            <div className="space-y-4 p-5 text-sm">
              <div>
                <p className="text-xs text-slate-500">العميل</p>
                <Link
                  href={`/admin/customers/${booking.customer_id}`}
                  className="font-bold text-brand-700 hover:underline"
                >
                  {booking.customer_name}
                </Link>
              </div>
              <div>
                <p className="text-xs text-slate-500">الهاتف</p>
                <p className="font-bold text-slate-900" dir="ltr">
                  {booking.customer_phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">السيارة</p>
                <p className="font-bold text-slate-900">{vehicleLabel(booking)}</p>
                <p className="text-xs text-slate-500">
                  {booking.vehicle_plate ? `لوحة: ${booking.vehicle_plate}` : "بدون رقم لوحة"}
                </p>
              </div>
            </div>
          </div>

          <div className="card-pad no-print">
            <h2 className="font-extrabold text-slate-900">تحديث الحالة</h2>
            <div className="mt-4">
              <StatusNoteForm id={booking.id} status={booking.status} />
            </div>
          </div>

          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-extrabold text-slate-900">
              سجل الحجز
            </h2>
            {events.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">لا توجد تحديثات بعد.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {events.map((e) => (
                  <li key={e.id} className="px-5 py-3">
                    <p className="text-sm font-bold text-slate-800">
                      {e.status ? STATUS_LABELS[e.status] : "تحديث"}
                    </p>
                    {e.note ? <p className="mt-0.5 text-xs text-slate-600">{e.note}</p> : null}
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {formatDateTimeAr(e.created_at)}
                      {e.user_name ? ` — ${e.user_name}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
