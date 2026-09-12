import { StatCard } from "@/components/ui";
import { getReports, getDashboardStats } from "@/lib/queries";
import { STATUS_LABELS, formatMoney, formatNumber } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "التقارير" };

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export default async function ReportsPage() {
  let reports = null;
  let stats = null;
  let dbError = false;

  try {
    [reports, stats] = await Promise.all([getReports(), getDashboardStats()]);
  } catch {
    dbError = true;
  }

  if (dbError || !reports || !stats) {
    return (
      <div className="card-pad">
        <h1 className="text-xl font-extrabold text-slate-900">تعذّر تحميل التقارير</h1>
        <p className="mt-2 text-sm text-slate-600">تأكد من تشغيل قاعدة البيانات ثم أعد تحميل الصفحة.</p>
      </div>
    );
  }

  const monthly = reports.monthly;
  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue));
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalCompleted = monthly.reduce((s, m) => s + m.completed, 0);
  const statusMap = new Map<BookingStatus, number>(
    reports.byStatus.map((s) => [s.status, s.count])
  );
  const totalBookings = reports.byStatus.reduce((s, x) => s + x.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">التقارير</h1>
          <p className="mt-1 text-sm text-slate-500">
            ملخص الأداء خلال آخر 6 أشهر — الإيرادات من الحجوزات المكتملة فقط.
          </p>
        </div>
        <a href="/api/export/bookings" className="btn-ghost no-print">
          ⬇️ تصدير كل الحجوزات (CSV)
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إيراد آخر 6 أشهر" value={formatMoney(totalRevenue)} icon="💰" tone="violet" />
        <StatCard label="حجوزات مكتملة (6 أشهر)" value={formatNumber(totalCompleted)} icon="✅" tone="emerald" />
        <StatCard
          label="متوسط قيمة الحجز"
          value={formatMoney(totalCompleted > 0 ? totalRevenue / totalCompleted : 0)}
          icon="📊"
          tone="brand"
        />
        <StatCard
          label="معدل الإنجاز الكلي"
          value={`${stats.completion_rate}%`}
          icon="🎯"
          tone="blue"
          hint={`${stats.customers_total} عميل مسجّل`}
        />
      </div>

      {/* الإيرادات الشهرية */}
      <div className="card-pad">
        <h2 className="font-extrabold text-slate-900">الإيرادات الشهرية</h2>
        <div className="mt-6 flex items-end gap-3" style={{ height: 200 }} dir="ltr">
          {monthly.map((m) => (
            <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                {m.revenue > 0 ? Math.round(m.revenue).toLocaleString("en-US") : ""}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400"
                style={{ height: `${Math.max(3, (m.revenue / maxRevenue) * 100)}%` }}
                title={`${monthLabel(m.month)}: ${m.revenue}`}
              />
              <span className="text-[10px] text-slate-500">{monthLabel(m.month)}</span>
            </div>
          ))}
          {monthly.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد بيانات بعد.</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* جدول شهري */}
        <div className="card overflow-hidden">
          <h2 className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-extrabold text-slate-900">
            تفصيل شهري
          </h2>
          <div className="table-wrap !rounded-none !border-0 !shadow-none">
            <table className="table !min-w-0">
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>إجمالي الحجوزات</th>
                  <th>مكتملة</th>
                  <th>الإيراد</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.month}>
                    <td className="font-bold">{monthLabel(m.month)}</td>
                    <td className="tabular-nums">{formatNumber(m.bookings)}</td>
                    <td className="tabular-nums">{formatNumber(m.completed)}</td>
                    <td className="font-bold tabular-nums text-emerald-700">
                      {formatMoney(m.revenue)}
                    </td>
                  </tr>
                ))}
                {monthly.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500">
                      لا توجد بيانات بعد
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* أكثر الخدمات */}
        <div className="card overflow-hidden">
          <h2 className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-extrabold text-slate-900">
            أداء الخدمات
          </h2>
          <ul className="divide-y divide-slate-100">
            {reports.byService.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="font-bold text-slate-800">
                  {s.icon} {s.name}
                </span>
                <span className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-slate-500 tabular-nums">{formatNumber(s.bookings)} حجز</span>
                  <span className="text-emerald-700 tabular-nums">{formatMoney(s.revenue)}</span>
                </span>
              </li>
            ))}
            {reports.byService.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-slate-500">لا توجد بيانات بعد</li>
            ) : null}
          </ul>
        </div>
      </div>

      {/* توزيع الحالات */}
      <div className="card-pad">
        <h2 className="font-extrabold text-slate-900">توزيع حالات الحجوزات</h2>
        <ul className="mt-5 space-y-4">
          {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((status) => {
            const count = statusMap.get(status) ?? 0;
            const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
            return (
              <li key={status}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">{STATUS_LABELS[status]}</span>
                  <span className="text-xs font-bold text-slate-500 tabular-nums">
                    {formatNumber(count)} ({pct}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100" dir="ltr">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-xs text-slate-500">
          إجمالي الحجوزات المسجلة: <strong>{formatNumber(totalBookings)}</strong>
        </p>
      </div>
    </div>
  );
}
