import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "دخول لوحة التحكم" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  const settings = await getSettings();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* لوحة تعريفية */}
      <div className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(500px circle at 20% 20%, rgba(249,115,22,.4), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-500 text-2xl">🚘</span>
          <span className="font-extrabold">{settings.workshop_name}</span>
        </div>
        <div className="relative">
          <h2 className="text-3xl leading-snug font-extrabold">
            إدارة كاملة لمواعيد
            <br />
            <span className="text-brand-400">صيانة سياراتك</span>
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            {[
              "متابعة حجوزات اليوم والقادمة لحظة بلحظة",
              "إدارة العملاء وسياراتهم وسجل الصيانة لكل سيارة",
              "تأكيد المواعيد وتحديث حالة العمل وملاحظات الفنيين",
              "تقارير بالإيرادات وأكثر الخدمات طلباً",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-400">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} {settings.workshop_name}
        </p>
      </div>

      {/* نموذج الدخول */}
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-500 text-2xl">🚘</span>
            <span className="font-extrabold text-slate-900">{settings.workshop_name}</span>
          </div>

          <div className="card-pad">
            <h1 className="text-xl font-extrabold text-slate-900">تسجيل الدخول</h1>
            <p className="mt-1 text-sm text-slate-500">
              الدخول مخصص لموظفي الورشة — استخدم البريد وكلمة المرور.
            </p>
            <LoginForm />
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            العميل؟ يمكنك{" "}
            <Link href="/#booking" className="font-bold text-brand-700 hover:underline">
              حجز موعد من هنا
            </Link>{" "}
            أو{" "}
            <Link href="/track" className="font-bold text-brand-700 hover:underline">
              تتبع حجزك
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
