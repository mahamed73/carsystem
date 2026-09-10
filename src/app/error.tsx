"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50 px-4">
      <div className="card-pad max-w-md text-center">
        <p className="text-5xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-slate-600">
          لم نتمكن من إتمام العملية. جرّب إعادة تحميل الصفحة، ولو تكررت المشكلة تواصل مع الدعم.
        </p>
        {error.digest ? (
          <p className="mt-2 text-[11px] text-slate-400" dir="ltr">
            code: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn-primary">
            🔄 إعادة المحاولة
          </button>
          <Link href="/" className="btn-ghost">
            🏠 الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
