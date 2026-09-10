import { getAllServices } from "@/lib/queries";
import ManualBookingForm from "@/components/admin/ManualBookingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "حجز جديد" };

export default async function NewBookingPage() {
  const services = (await getAllServices().catch(() => [])).filter((s) => s.is_active);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">إنشاء حجز يدوياً</h1>
        <p className="mt-1 text-sm text-slate-500">
          للعملاء الذين يتصلون هاتفياً أو يحضرون للاستقبال — يُسجَّل الحجز بنفس طريقة الحجز الإلكتروني.
        </p>
      </div>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-900">
          لا توجد خدمات مفعّلة — أضف خدمة من صفحة «الخدمات والأسعار» أولاً.
        </div>
      ) : (
        <ManualBookingForm services={services} />
      )}
    </div>
  );
}
