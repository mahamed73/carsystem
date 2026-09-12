import Link from "next/link";
import { EmptyState, StatCard, StatusBadge } from "@/components/ui";
import StatusSelect from "@/components/admin/StatusSelect";
import {
  getDashboardStats,
  getUpcomingBookings,
  listBookings,
  getReports,
} from "@/lib/queries";
import { currentUser } from "@/lib/auth";
import {
  formatDateAr,
  formatMoney,
  formatNumber,
  formatTimeAr,
  todayISO,
  vehicleLabel,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await currentUser();
  const today = todayISO();

  let stats = null;
  let todayBookings: Awaited<ReturnType<typeof listBookings>> = [];
  let upcoming: Awaited<ReturnType<typeof getUpcomingBookings>> = [];
  let reports: Awaited<ReturnType<typeof getReports>> | null = null;
  let dbError = false;

  try {
    [stats, todayBookings, upcoming, reports] = await Promise.all([
      getDashboardStats(),
      listBookings({ date: today, status: "all", limit: 50 }),
      getUpcomingBookings(8),
      getReports(),
    ]);
  } catch {
    dbError = true;
  }

  if (dbError || !stats || !reports) {
    return (
      <div className="card-pad">
        <h1 className="text-xl font-extrabold text-slate-900">تعذّر تحميل البيانات</h1>
        <p className="mt-2 text-sm text-slate-600">
          تأكد من تشغيل قاعدة بيانات PostgreSQL. شغّل{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run db:setup</code> أو راجع{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">DEPLOY.md</code>.
        </p>
      </div>
    );
  }

  const dailyChart = reports.daily.map((d) => ({
    label: d.day.slice(8),
    value: d.count,
  }));

  const topServices = reports.byService.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            أهلاً {user?.name?.split(" ")[0] ?? ""} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">{formatDateAr(today)}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/bookings/new" className="btn-primary">
            ➕ حجز جديد
          </Link>
          <Link href="/admin/bookings?status=pending" className="btn-ghost">
            ⏳ بانتظار التأكيد ({stats.pending})
          </Link>
        </div>
      </div>

      {/* بطاقات الإحصاء */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="حجوزات اليوم" value={formatNumber(stats.today)} icon="🗓" tone="brand" />
        <StatCard
          label="بانتظار التأكيد"
          value={formatNumber(stats.pending)}
          icon="⏳"
          tone="amber"
          hint="تحتاج متابعة"
        />
        <StatCard label="حجوزات الأسبوع" value={formatNumber(stats.week)} icon="📆" tone="blue" />
        <StatCard
          label="مكتمل هذا الشهر"
          value={formatNumber(stats.completed_month)}
          icon="✅"
          tone="emerald"
        />
        <StatCard
          label="إيراد الشهر"
          value={formatMoney(stats.revenue_month)}
          icon="💰"
          tone="violet"
          hint="من الحجوزات المكتملة"
        />
        <StatCard
          label="إجمالي العملاء"
          value={formatNumber(stats.customers_total)}
          icon="👥"
          tone="slate"
          hint={`+${stats.customers_new_month} هذا الشهر`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* جدول اليوم */}
        <div className="xl:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-extrabold text-slate-900">جدول اليوم — {formatDateAr(today)}</h2>
              <Link href="/admin/bookings" className="text-xs font-bold text-brand-700 hover:underline">
                كل الحجوزات ←
              </Link>
            </div>

            {todayBookings.length === 0 ? (
              <EmptyState
                icon="🌤"
                title="لا توجد حجوزات اليوم"
                subtitle="يمكنك إنشاء حجز يدوياً للعملاء الذين يتصلون هاتفياً."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {todayBookings.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="w-20 shrink-0">
                      <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                        {formatTimeAr(b.scheduled_time).replace(" ", "")}
                      </p>
                      <p className="text-[11px] text-slate-500">{b.duration_minutes} د</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">
                        {b.service_icon} {b.service_name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {b.customer_name} — {vehicleLabel(b)}
                        {b.vehicle_plate ? ` — ${b.vehicle_plate}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                    <StatusSelect id={b.id} status={b.status} compact />
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="text-xs font-bold text-brand-700 hover:underline"
                    >
                      تفاصيل
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* الرسم البياني */}
          <div className="card-pad mt-6">
            <h2 className="font-extrabold text-slate-900">حجوزات آخر 14 يوماً</h2>
            <p className="mt-1 text-xs text-slate-500">عدد الحجوزات المسجلة لكل يوم</p>
            <div className="mt-5">
              {dailyChart.length === 0 ? (
                <p className="text-sm text-slate-500">لا توجد بيانات بعد.</p>
              ) : (
                <div className="flex items-end gap-1.5" style={{ height: 170 }} dir="ltr">
                  {dailyChart.map((d) => {
                    const max = Math.max(1, ...dailyChart.map((x) => x.value));
                    return (
                      <div
                        key={d.label}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                        title={`يوم ${d.label}: ${d.value}`}
                      >
                        <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                          {d.value || ""}
                        </span>
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400"
                          style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
                        />
                        <span className="text-[10px] text-slate-500">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-200 px-5 py-4 font-extrabold text-slate-900">
              أقرب المواعيد القادمة
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState icon="📭" title="لا توجد مواعيد قادمة" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map((b) => (
                  <li key={b.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-brand-700">
                        {formatDateAr(b.scheduled_date).split("،")[0]} — {formatTimeAr(b.scheduled_time)}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-slate-900">
                      {b.customer_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {b.service_name} — {vehicleLabel(b)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-pad">
            <h2 className="font-extrabold text-slate-900">أكثر الخدمات طلباً</h2>
            <ul className="mt-4 space-y-3">
              {topServices.map((s) => {
                const max = Math.max(1, ...topServices.map((x) => x.bookings));
                return (
                  <li key={s.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">
                        {s.icon} {s.name}
                      </span>
                      <span className="text-xs font-bold text-slate-500 tabular-nums">
                        {s.bookings}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" dir="ltr">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.max(4, (s.bookings / max) * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
              {topServices.length === 0 ? (
                <li className="text-sm text-slate-500">لا توجد بيانات بعد.</li>
              ) : null}
            </ul>
          </div>

          <div className="card-pad">
            <h2 className="font-extrabold text-slate-900">مؤشر الإنجاز</h2>
            <p className="mt-3 text-4xl font-extrabold text-brand-600 tabular-nums">
              {stats.completion_rate}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              نسبة الحجوزات المكتملة من إجمالي الحجوزات المسجلة.
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100" dir="ltr">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                style={{ width: `${stats.completion_rate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
