"use client";

export default function PrintButton({
  label = "🖨️ طباعة",
  className = "btn-ghost no-print",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {label}
    </button>
  );
}
