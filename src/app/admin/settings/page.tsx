import Link from "next/link";
import SettingsForm from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/settings";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const [settings, me] = await Promise.all([getSettings(), currentUser()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">إعدادات النظام</h1>
        <p className="mt-1 text-sm text-slate-500">
          بيانات الورشة، مواعيد العمل، وسعة الاستقبال المستخدمة في حساب المواعيد المتاحة.
        </p>
      </div>

      {me?.role !== "admin" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-900">
          ⚠️ تعديل الإعدادات متاح لمدير النظام فقط.
        </div>
      ) : (
        <SettingsForm settings={settings} />
      )}

      <div className="card-pad">
        <h2 className="font-extrabold text-slate-900">معلومات النظام</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-slate-500">إصدار النظام</dt>
            <dd className="font-bold text-slate-800">1.0.0</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-slate-500">قاعدة البيانات</dt>
            <dd className="font-bold text-slate-800">PostgreSQL</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-slate-500">النسخ الاحتياطي</dt>
            <dd className="font-bold text-slate-800">يومي — راجع DEPLOY.md</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-slate-500">تصدير البيانات</dt>
            <dd>
              <a href="/api/export/bookings" className="font-bold text-brand-700 hover:underline">
                تحميل CSV
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          لتغيير كلمة مرورك: اطلب من مدير النظام إعادة تعيينها من{" "}
          <Link href="/admin/users" className="font-bold text-brand-700 hover:underline">
            صفحة المستخدمين
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
