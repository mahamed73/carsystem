import { EmptyState } from "@/components/ui";
import ServiceForm from "@/components/admin/ServiceForm";
import SubmitButton from "@/components/admin/SubmitButton";
import { deleteServiceAction, toggleServiceAction } from "@/app/actions/admin";
import { getAllServices } from "@/lib/queries";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "الخدمات والأسعار" };

export default async function ServicesPage() {
  const services = await getAllServices().catch(() => []);
  const active = services.filter((s) => s.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">الخدمات والأسعار</h1>
        <p className="mt-1 text-sm text-slate-500">
          {services.length} خدمة — {active.length} مُفعّلة وتظهر للعملاء في صفحة الحجز.
        </p>
      </div>

      {/* إضافة خدمة جديدة */}
      <details className="card-pad" open={services.length === 0}>
        <summary className="cursor-pointer font-extrabold text-slate-900">
          ➕ إضافة خدمة جديدة
        </summary>
        <div className="mt-5">
          <ServiceForm />
        </div>
      </details>

      {/* قائمة الخدمات */}
      {services.length === 0 ? (
        <div className="card">
          <EmptyState icon="🔧" title="لا توجد خدمات بعد" subtitle="أضف أول خدمة من النموذج بالأعلى." />
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">
                  {s.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-extrabold text-slate-900">{s.name}</h2>
                    {!s.is_active ? (
                      <span className="badge bg-slate-200 text-slate-600 ring-slate-300">
                        غير مُفعّلة
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{s.description}</p>
                  <p className="mt-1 text-xs font-bold text-slate-600">
                    ⏱ {s.duration_minutes} دقيقة • 💰 <span className="tabular-nums">{formatMoney(s.price)}</span> •
                    🗂 {s.bookings_count} حجز • ترتيب {s.sort_order}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={toggleServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={String(!s.is_active)} />
                    <SubmitButton className="btn-ghost" pendingText="…">
                      {s.is_active ? "⏸ تعطيل" : "▶️ تفعيل"}
                    </SubmitButton>
                  </form>
                  <form action={deleteServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <SubmitButton
                      className="btn-danger"
                      pendingText="…"
                      confirm={
                        s.bookings_count > 0
                          ? "هذه الخدمة مرتبطة بحجوزات — سيتم تعطيلها فقط بدل الحذف. متابعة؟"
                          : "هل تريد حذف هذه الخدمة نهائياً؟"
                      }
                    >
                      🗑 حذف
                    </SubmitButton>
                  </form>
                </div>
              </div>

              <details className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <summary className="cursor-pointer text-sm font-bold text-brand-700">
                  ✏️ تعديل بيانات الخدمة
                </summary>
                <div className="py-4">
                  <ServiceForm service={s} />
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
