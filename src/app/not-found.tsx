import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50 px-4">
      <div className="card-pad max-w-md text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-slate-600">
          الرابط الذي فتحته غير صحيح أو أن الحجز المطلوب تم حذفه. تأكد من الرقم المرجعي أو ارجع
          للصفحة الرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary">
            🏠 الصفحة الرئيسية
          </Link>
          <Link href="/track" className="btn-ghost">
            🔎 تتبع حجز
          </Link>
        </div>
      </div>
    </div>
  );
}
