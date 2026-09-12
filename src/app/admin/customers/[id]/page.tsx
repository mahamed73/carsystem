import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, StatusBadge } from "@/components/ui";
import CustomerNotesForm from "@/components/admin/CustomerNotesForm";
import { getCustomerWithVehicles } from "@/lib/queries";
import { formatDateAr, formatMoney, formatNumber, formatTimeAr, vehicleLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const { customer, vehicles, bookings } = await getCustomerWithVehicles(id).catch(() => ({
    customer: null,
    vehicles: [],
    bookings: [],
  }));
  if (!customer) notFound();

  const completed = bookings.filter((b) => b.status === "completed");
  const totalSpent = completed.reduce(
    (sum, b) => sum + Number(b.price ?? b.service_price ?? 0),
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/customers" className="text-xs font-bold text-brand-700 hover:underline">
            ← كل العملاء
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{customer.name}</h1>
          <p className="mt-1 text-sm text-slate-500" dir="ltr">
            {customer.phone}
            {customer.email ? ` — ${customer.email}` : ""}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <a className="btn-ghost" href={`tel:${customer.phone}`} dir="ltr">
            ☎️ اتصال
          </a>
          <a
            className="btn-ghost"
            href={`https://wa.me/2${customer.phone.replace(/^0/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 واتساب
          </a>
          <Link className="btn-primary" href="/admin/bookings/new">
            ➕ حجز جديد
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["إجمالي الحجوزات", formatNumber(bookings.length), "🗂"],
          ["حجوزات مكتملة", formatNumber(completed.length), "✅"],
          ["إجمالي المدفوع", formatMoney(totalSpent), "💰"],
        ].map(([label, value, icon]) => (
          <div key={label} className="card-pad flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">{value}</p>
            </div>
            <span className="text-2xl">{icon}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-extrabold text-slate-900">
              سجل الحجوزات
            </h2>
            {bookings.length === 0 ? (
              <EmptyState icon="🗂" title="لا توجد حجوزات لهذا العميل" />
            ) : (
              <div className="table-wrap !rounded-none !border-0 !shadow-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>المرجع</th>
                      <th>الموعد</th>
                      <th>الخدمة</th>
                      <th>السيارة</th>
                      <th>السعر</th>
                      <th>الحالة</th>
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
                        <td className="text-xs">
                          {formatDateAr(b.scheduled_date).split("،")[0]}
                          <span className="block text-slate-500">{formatTimeAr(b.scheduled_time)}</span>
                        </td>
                        <td>{b.service_name}</td>
                        <td>{vehicleLabel(b)}</td>
                        <td className="tabular-nums">{formatMoney(b.price ?? b.service_price)}</td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-extrabold text-slate-900">
              سيارات العميل
            </h2>
            {vehicles.length === 0 ? (
              <EmptyState icon="🚗" title="لا توجد سيارات مسجلة" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <li key={v.id} className="px-5 py-3">
                    <p className="font-bold text-slate-900">{vehicleLabel(v)}</p>
                    <p className="text-xs text-slate-500">
                      {v.plate_number ? `لوحة: ${v.plate_number}` : "بدون لوحة"}
                      {v.color ? ` — ${v.color}` : ""}
                      {v.mileage !== null ? ` — ${formatNumber(v.mileage)} كم` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-pad no-print">
            <h2 className="font-extrabold text-slate-900">ملاحظات داخلية</h2>
            <div className="mt-4">
              <CustomerNotesForm customerId={customer.id} notes={customer.notes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
