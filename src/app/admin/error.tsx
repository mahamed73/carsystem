"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dbHint =
    /ECONNREFUSED|connect|database|relation|does not exist/i.test(error.message) ||
    Boolean(error.digest);

  return (
    <div className="card-pad">
      <h1 className="text-xl font-extrabold text-slate-900">تعذّر تحميل هذه الصفحة</h1>
      <p className="mt-2 text-sm text-slate-600">
        {dbHint
          ? "قد تكون قاعدة البيانات متوقفة أو تعذّر الاتصال بها. جرّب إعادة المحاولة، ولو استمرت المشكلة راجع «حالة النظام» أو سجل السيرفر."
          : "حدث خطأ غير متوقع أثناء تحميل البيانات."}
      </p>
      {error.digest ? (
        <p className="mt-2 text-[11px] text-slate-400" dir="ltr">
          code: {error.digest}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          🔄 إعادة المحاولة
        </button>
        <a href="/admin" className="btn-ghost">
          ← لوحة التحكم
        </a>
      </div>
    </div>
  );
}
