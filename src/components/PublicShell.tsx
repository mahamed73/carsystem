import Link from "next/link";
import type { WorkshopSettings } from "@/lib/types";

export function PublicHeader({
  settings,
  active,
}: {
  settings: WorkshopSettings;
  active?: "home" | "track";
}) {
  const nav = [
    { href: "/", label: "الرئيسية", key: "home" as const },
    { href: "/#services", label: "خدماتنا", key: null },
    { href: "/#booking", label: "احجز موعد", key: null },
    { href: "/track", label: "تتبع حجزك", key: "track" as const },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-500 text-xl shadow-lg shadow-brand-500/25">
            🚘
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold text-white sm:text-base">
              {settings.workshop_name}
            </span>
            <span className="block text-[11px] text-slate-400">نظام حجز صيانة إلكتروني</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                active === item.key
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${settings.phone}`}
            className="hidden rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/5 sm:block"
            dir="ltr"
          >
            ☎️ {settings.phone}
          </a>
          <Link href="/admin" className="btn-primary !px-3 !py-2 text-xs">
            لوحة التحكم
          </Link>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function PublicFooter({ settings }: { settings: WorkshopSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-white/10 bg-ink-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-500 text-xl">🚘</span>
            <span className="font-extrabold text-white">{settings.workshop_name}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            نُصلح ونهتم بسيارتك بأحدث الأجهزة وأمهر الفنيين، مع متابعة إلكترونية كاملة لحالة السيارة.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white">روابط سريعة</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/#services">خدمات الصيانة</Link></li>
            <li><Link className="hover:text-white" href="/#booking">حجز موعد جديد</Link></li>
            <li><Link className="hover:text-white" href="/track">تتبع حجز قائم</Link></li>
            <li><Link className="hover:text-white" href="/admin">دخول الموظفين</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white">مواعيد العمل</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>السبت – الخميس: {settings.open_time} — {settings.close_time}</li>
            <li>الجمعة: مغلق</li>
            <li className="text-slate-400">الحجز الإلكتروني متاح 24 ساعة</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white">تواصل معنا</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li dir="ltr" className="text-right">☎️ {settings.phone}</li>
            <li className="text-slate-400">📍 {settings.address}</li>
          </ul>
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            💬 تواصل واتساب
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <p className="text-center text-xs text-slate-500">
          © {year} {settings.workshop_name} — جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
