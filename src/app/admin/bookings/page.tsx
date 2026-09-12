import Link from "next/link";
import { EmptyState, StatusBadge } from "@/components/ui";
import StatusSelect from "@/components/admin/StatusSelect";
import { listBookings } from "@/lib/queries";
import { ALL_STATUSES, STATUS_LABELS, formatDateAr, formatMoney, formatTimeAr, vehicleLabel } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "الحجوزات" };

type Search = {
  status?: string;
  date?: string;
  from?: string;
  to?: string;
  q?: string;
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const status = (sp.status ?? "all") as BookingStatus | "all";

  let bookings: Awaited<ReturnType<typeof listBookings>> = [];
  let dbError = false;
  try {
    bookings = await listBookings({
      status,
      date: sp.date,
      from: sp.from,
      to: sp.to,
      search: sp.q,
      limit: 300,
    });
  } catch {
    dbError = true;
  }

  const totalValue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + Number(b.price ?? b.service_price ?? 0), 0);

  const query = (patch: Partial<Search>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...patch };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    const qs = params.toString();
    return `/admin/bookings${qs ? `?${qs}` : ""}`;
  };

  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "الكل" },
    ...ALL_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">الحجوزات</h1>
          <p className="mt-1 text-sm text-slate-500">
            {bookings.length} حجز — إجمالي المنفّذ: {formatMoney(totalValue)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/bookings" className="btn-ghost">
            ⬇️ تصدير Excel/CSV
          </a>
          <Link href="/admin/bookings/new" className="btn-primary">
            ➕ حجز جديد
          </Link>
        </div>
      </div>

      {/* تبويبات الحالة */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={query({ status: t.key === "all" ? undefined : t.key })}
            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold transition ${
              status === t.key || (t.key === "all" && status === "all")
                ? "border-brand-500 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* الفلاتر */}
      <form className="card-pad grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        <div className="lg:col-span-2">
          <label className="label" htmlFor="q">
            بحث
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q ?? ""}
            className="field"
            placeholder="اسم العميل / الهاتف / رقم اللوحة / المرجع"
          />
        </div>
        <div>
          <label className="label" htmlFor="date">
            يوم محدد
          </label>
          <input id="date" name="date" type="date" defaultValue={sp.date ?? ""} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="from">
            من تاريخ
          </label>
          <input id="from" name="from" type="date" defaultValue={sp.from ?? ""} className="field" />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label" htmlFor="to">
              إلى تاريخ
            </label>
            <input id="to" name="to" type="date" defaultValue={sp.to ?? ""} className="field" />
          </div>
          <button className="btn-dark h-[46px]" type="submit">
            تطبيق
          </button>
        </div>
      </form>

      {dbError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-800">
          تعذّر تحميل الحجوزات — تأكد من تشغيل قاعدة البيانات.
        </div>
      ) : bookings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🗂"
            title="لا توجد حجوزات مطابقة"
            subtitle="جرّب تغيير الفلاتر أو أنشئ حجزاً جديداً."
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>المرجع</th>
                <th>الموعد</th>
                <th>العميل</th>
                <th>السيارة</th>
                <th>الخدمة</th>
                <th>السعر</th>
                <th>الحالة</th>
                <th>تغيير الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-bold text-brand-700 hover:underline"
                      dir="ltr"
                    >
                      {b.reference}
                    </Link>
                  </td>
                  <td>
                    <span className="block font-bold text-slate-800">
                      {formatTimeAr(b.scheduled_time)}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {formatDateAr(b.scheduled_date).split("،").slice(0, 2).join("، ")}
                    </span>
                  </td>
                  <td>
                    <span className="block font-bold text-slate-800">{b.customer_name}</span>
                    <a
                      href={`tel:${b.customer_phone}`}
                      className="block text-xs text-slate-500 hover:text-brand-700"
                      dir="ltr"
                    >
                      {b.customer_phone}
                    </a>
                  </td>
                  <td>
                    <span className="block text-slate-700">{vehicleLabel(b)}</span>
                    <span className="block text-xs text-slate-500">{b.vehicle_plate ?? "—"}</span>
                  </td>
                  <td>
                    <span className="text-slate-700">
                      {b.service_icon} {b.service_name}
                    </span>
                  </td>
                  <td className="font-bold tabular-nums text-slate-800">
                    {formatMoney(b.price ?? b.service_price)}
                  </td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td>
                    <StatusSelect id={b.id} status={b.status} compact />
                  </td>
                  <td>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="text-xs font-bold text-brand-700 hover:underline"
                    >
                      تفاصيل
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
