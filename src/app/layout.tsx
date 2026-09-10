import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "نظام حجز صيانة السيارات",
    template: "%s | نظام حجز صيانة السيارات",
  },
  description:
    "نظام إلكتروني لحجز مواعيد صيانة وإصلاح السيارات — احجز موعدك أونلاين وتابع حالة سيارتك لحظة بلحظة.",
  keywords: ["صيانة سيارات", "حجز موعد", "ورشة سيارات", "ميكانيكا", "تغيير زيت"],
  authors: [{ name: "Car System" }],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: {
    title: "نظام حجز صيانة السيارات",
    description: "احجز موعد صيانة سيارتك أونلاين وتابع حالة العمل لحظة بلحظة.",
    type: "website",
    locale: "ar_EG",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
