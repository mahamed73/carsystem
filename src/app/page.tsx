import Link from "next/link";
import BookingWizard, { type DayOption } from "@/components/BookingWizard";
import { PublicFooter, PublicHeader } from "@/components/PublicShell";
import { getActiveServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatTimeAr, todayISO } from "@/lib/format";
import type { Service, WorkshopSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function buildDays(count: number, closedDays: string): DayOption[] {
  const closed = String(closedDays || "")
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => !Number.isNaN(d));

  const base = new Date(`${todayISO()}T12:00:00Z`);
  const out: DayOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    out.push({
      iso,
      weekday: i === 0 ? "اليوم" : i === 1 ? "غداً" : WEEKDAYS[dow],
      dayNum: String(d.getUTCDate()),
      month: MONTHS[d.getUTCMonth()],
      closed: closed.includes(dow),
    });
  }
  return out;
}

export default async function HomePage() {
  let services: Service[] = [];
  let dbDown = false;

  const settings: WorkshopSettings = await getSettings();
  try {
    services = await getActiveServices();
  } catch {
    dbDown = true;
  }

  const days = buildDays(14, settings.closed_days);

  return (
    <div className="min-h-dvh bg-slate-50">
      <PublicHeader settings={settings} active="home" />

      {/* ============== الهيرو ============== */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(600px circle at 15% 20%, rgba(249,115,22,.35), transparent 60%), radial-gradient(500px circle at 85% 10%, rgba(59,130,246,.28), transparent 55%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
          <div>
            <span className="badge bg-white/10 text-brand-200 ring-white/15">
              ⏱ حجزك في أقل من دقيقة
            </span>
            <h1 className="mt-4 text-3xl leading-snug font-extrabold sm:text-4xl lg:text-5xl lg:leading-tight">
              احجز موعد صيانة سيارتك
              <span className="mt-1 block text-brand-400">أونلاين… وبدون انتظار</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              اختر الخدمة، حدّد اليوم والساعة، وسنستقبل سيارتك في الموعد بالضبط. تابع حالة الصيانة
              خطوة بخطوة برقم الحجز المرجعي، مع تقرير مفصل بكل ما تم في سيارتك.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="#booking" className="btn-primary !px-6 !py-3 text-base">
                🗓 احجز موعدك الآن
              </Link>
              <Link
                href="/track"
                className="btn !border !border-white/20 !bg-white/5 !px-6 !py-3 text-base text-white hover:!bg-white/10"
              >
                🔎 تتبع حجز قائم
              </Link>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <dt className="text-xs text-slate-400">خدمات متاحة</dt>
                <dd className="text-xl font-extrabold text-white tabular-nums">{services.length}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <dt className="text-xs text-slate-400">أوقات العمل</dt>
                <dd className="text-sm font-extrabold text-white">
                  {formatTimeAr(settings.open_time)} — {formatTimeAr(settings.close_time)}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <dt className="text-xs text-slate-400">آليات متزامنة</dt>
                <dd className="text-xl font-extrabold text-white tabular-nums">{settings.capacity}</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-900 shadow-2xl">
              <p className="text-sm font-extrabold">📋 خطوات الحجز</p>
              <ol className="mt-4 space-y-3 text-sm">
                {[
                  ["اختر الخدمة المطلوبة", "تغيير زيت، صيانة دورية، فرامل، تكييف…"],
                  ["حدّد اليوم والموعد", "نعرض لك المواعيد المتاحة فعلياً فقط"],
                  ["أدخل بيانات السيارة", "الماركة والموديل ورقم اللوحة"],
                  ["احصل على رقم مرجعي", "تابع به حالة سيارتك في أي وقت"],
                ].map(([title, sub], i) => (
                  <li key={title} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-extrabold text-white">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-bold">{title}</span>
                      <span className="block text-xs text-slate-500">{sub}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                💡 لو سيارتك متعطلة على الطريق، تواصل معنا واتساب وسنحاول ترتيب موعد عاجل.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== الخدمات ============== */}
      <section id="services" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">خدمات الصيانة</h2>
            <p className="mt-1 text-sm text-slate-500">
              أسعار تقديرية تُحدَّد نهائياً بعد فحص السيارة — بدون أي عمل إضافي بدون موافقتك.
            </p>
          </div>
          <Link href="#booking" className="btn-dark">احجز الآن</Link>
        </div>

        {dbDown ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            <p className="font-bold">⚠️ قاعدة البيانات غير متصلة حالياً</p>
            <p className="mt-1">
              شغّل الأمر <code className="rounded bg-white px-1.5 py-0.5">npm run db:setup</code> لتجهيز
              قاعدة البيانات، أو راجع ملف <code className="rounded bg-white px-1.5 py-0.5">DEPLOY.md</code>.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <article
                key={s.id}
                className="card-pad flex flex-col transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-2xl">
                  {s.icon}
                </span>
                <h3 className="mt-3 font-extrabold text-slate-900">{s.name}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
                  {s.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-extrabold text-brand-700">{formatMoney(s.price)}</span>
                  <span className="text-xs text-slate-500">⏱ {s.duration_minutes} دقيقة</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ============== الحجز ============== */}
      <section
        id="booking"
        className="scroll-mt-20 border-y border-slate-200 bg-gradient-to-b from-white to-slate-100 py-14"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">احجز موعدك</h2>
            <p className="mt-2 text-sm text-slate-500">
              املأ الخطوات الأربع وسيصلك رقم حجز مرجعي فوراً — يمكنك متابعة حالة سيارتك به في أي وقت.
            </p>
          </div>

          <div className="mt-8">
            {dbDown || services.length === 0 ? (
              <div className="card-pad text-center text-sm text-slate-600">
                لا يمكن استقبال حجوزات جديدة الآن — تواصل معنا هاتفياً على{" "}
                <a href={`tel:${settings.phone}`} className="font-bold text-brand-700" dir="ltr">
                  {settings.phone}
                </a>
              </div>
            ) : (
              <BookingWizard
                services={services}
                days={days}
                whatsapp={settings.whatsapp}
                phone={settings.phone}
              />
            )}
          </div>
        </div>
      </section>

      {/* ============== لماذا نحن ============== */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">
          لماذا تختارنا؟
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["🧑‍🔧", "فنيون معتمدون", "خبرة سنوات في جميع الماركات اليابانية والكورية والأوروبية."],
            ["🧪", "أجهزة تشخيص حديثة", "فحص كمبيوتر دقيق يحدد العطل من أول مرة ويوفر عليك التكاليف."],
            ["🧾", "شفافية في السعر", "تقرير مكتوب بكل قطعة ومصنعية قبل التنفيذ — لا مفاجآت."],
            ["🔔", "متابعة إلكترونية", "اعرف حالة سيارتك لحظة بلحظة برقم الحجز المرجعي."],
          ].map(([icon, title, text]) => (
            <div key={title} className="card-pad">
              <span className="text-3xl">{icon}</span>
              <h3 className="mt-3 font-extrabold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter settings={settings} />
    </div>
  );
}
