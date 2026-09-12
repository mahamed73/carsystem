import type { BookingStatus } from "@/lib/types";
import { STATUS_CLASSES, STATUS_DOTS, STATUS_LABELS } from "@/lib/format";

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`badge ${STATUS_CLASSES[status] ?? STATUS_CLASSES.pending}`}>
      <span className={`size-1.5 rounded-full ${STATUS_DOTS[status] ?? "bg-slate-400"}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function EmptyState({
  icon = "📭",
  title,
  subtitle,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="font-bold text-slate-700">{title}</p>
      {subtitle ? <p className="max-w-sm text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "slate",
  hint,
}: {
  label: string;
  value: string | number;
  icon: string;
  tone?: "slate" | "brand" | "emerald" | "blue" | "violet" | "amber";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    slate: "from-slate-500/10 to-slate-500/0 text-slate-600",
    brand: "from-brand-500/15 to-brand-500/0 text-brand-600",
    emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
    blue: "from-blue-500/15 to-blue-500/0 text-blue-600",
    violet: "from-violet-500/15 to-violet-500/0 text-violet-600",
    amber: "from-amber-500/15 to-amber-500/0 text-amber-600",
  };
  return (
    <div className={`card-pad bg-gradient-to-bl ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/70 text-xl ring-1 ring-slate-200">
          {icon}
        </span>
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 160,
  suffix = "",
}: {
  data: { label: string; value: number }[];
  height?: number;
  suffix?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }} dir="ltr">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-bold text-slate-500 tabular-nums">
            {d.value > 0 ? `${d.value}${suffix}` : ""}
          </span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all"
            style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[10px] text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
