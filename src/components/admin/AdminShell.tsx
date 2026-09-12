"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "لوحة التحكم", icon: "📊" },
  { href: "/admin/bookings", label: "الحجوزات", icon: "🗓" },
  { href: "/admin/bookings/new", label: "حجز جديد", icon: "➕" },
  { href: "/admin/customers", label: "العملاء", icon: "👥" },
  { href: "/admin/services", label: "الخدمات والأسعار", icon: "🔧" },
  { href: "/admin/reports", label: "التقارير", icon: "📈" },
  { href: "/admin/users", label: "المستخدمون", icon: "🧑‍💼" },
  { href: "/admin/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function AdminShell({
  user,
  workshopName,
  children,
}: {
  user: { name: string; email: string; role: "admin" | "staff" };
  workshopName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-dvh bg-slate-100 lg:flex">
      {/* الشريط الجانبي */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 shrink-0 overflow-y-auto bg-ink-950 text-slate-300 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-500 text-xl">🚘</span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold text-white">{workshopName}</span>
              <span className="block text-[11px] text-slate-400">لوحة التحكم</span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                isActive(item.href)
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400">مسجّل الدخول</p>
          <p className="mt-0.5 text-sm font-extrabold text-white">{user.name}</p>
          <p className="text-[11px] text-slate-400" dir="ltr">
            {user.email}
          </p>
          <span className="mt-2 inline-block rounded-full bg-brand-500/20 px-2 py-0.5 text-[11px] font-bold text-brand-200">
            {user.role === "admin" ? "مدير نظام" : "موظف"}
          </span>
        </div>

        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <span className="text-lg">🌐</span> عرض الموقع
          </Link>
          <form action="/api/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/10"
            >
              <span className="text-lg">🚪</span> تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      {/* غطاء للجوال */}
      {open ? (
        <button
          type="button"
          aria-label="إغلاق"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* المحتوى */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="rounded-xl border border-slate-300 p-2 text-slate-700"
            onClick={() => setOpen(true)}
            aria-label="فتح القائمة"
          >
            ☰
          </button>
          <span className="font-extrabold text-slate-900">{workshopName}</span>
          <Link href="/admin/bookings/new" className="btn-primary !px-3 !py-2 text-xs">
            ➕ حجز
          </Link>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
