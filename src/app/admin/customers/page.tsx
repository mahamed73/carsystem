import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { listCustomers } from "@/lib/queries";
import { formatDateAr, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "العملاء" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  let customers: Awaited<ReturnType<typeof listCustomers>> = [];
  let dbError = false;
  try {
    customers = await listCustomers(q, 500);
  } catch {
    dbError = true;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">العملاء</h1>
          <p className="mt-1 text-sm text-slate-500">{customers.length} عميل مسجّل</p>
        </div>
        <form className="flex gap-2" method="get">
          <input
            name="q"
            defaultValue={q ?? ""}
            className="field w-56"
            placeholder="ابحث بالاسم أو الهاتف أو اللوحة"
          />
          <button className="btn-dark" type="submit">
            🔎 بحث
          </button>
        </form>
      </div>

      {dbError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-800">
          تعذّر تحميل العملاء — تأكد من تشغيل قاعدة البيانات.
        </div>
      ) : customers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="👥"
            title="لا يوجد عملاء بعد"
            subtitle="سيظهر العملاء تلقائياً عند أول حجز من الموقع أو عند إنشاء حجز يدوي."
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>عدد السيارات</th>
                <th>عدد الحجوزات</th>
                <th>آخر زيارة مكتملة</th>
                <th>تاريخ التسجيل</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-bold text-brand-700 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td>
                    <a href={`tel:${c.phone}`} dir="ltr" className="hover:text-brand-700">
                      {c.phone}
                    </a>
                  </td>
                  <td className="tabular-nums">{formatNumber(c.vehicles_count ?? 0)}</td>
                  <td className="tabular-nums">{formatNumber(c.bookings_count ?? 0)}</td>
                  <td>{c.last_visit ? formatDateAr(c.last_visit) : "—"}</td>
                  <td className="text-xs text-slate-500">{formatDateAr(String(c.created_at).slice(0, 10))}</td>
                  <td className="no-print">
                    <div className="flex gap-2">
                      <a
                        className="text-xs font-bold text-emerald-700 hover:underline"
                        href={`https://wa.me/2${c.phone.replace(/^0/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        واتساب
                      </a>
                      <Link
                        className="text-xs font-bold text-brand-700 hover:underline"
                        href={`/admin/customers/${c.id}`}
                      >
                        الملف
                      </Link>
                    </div>
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
