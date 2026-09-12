import { EmptyState } from "@/components/ui";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="card">
        <EmptyState icon="⏳" title="جارٍ تحميل البيانات…" />
      </div>
    </div>
  );
}
