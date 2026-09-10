import { NextResponse, type NextRequest } from "next/server";
import { getServiceById } from "@/lib/queries";
import { getAvailableSlots } from "@/lib/settings";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * GET /api/slots?date=2026-09-15&service=3
 * يرجع المواعيد المتاحة ليوم معيّن حسب مدة الخدمة وعدد الآليات العاملة.
 */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const serviceId = Number(request.nextUrl.searchParams.get("service") ?? 0);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }
  if (date < todayISO()) {
    return NextResponse.json({ closed: true, slots: [], reason: "past" });
  }

  try {
    const service = serviceId ? await getServiceById(serviceId) : null;
    const duration = service?.duration_minutes ?? 60;
    const { closed, slots, settings } = await getAvailableSlots(date, duration);

    return NextResponse.json(
      {
        closed,
        slots,
        duration,
        slot_note: settings.slot_note,
        open_time: settings.open_time,
        close_time: settings.close_time,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("api/slots error:", err);
    return NextResponse.json({ error: "تعذّر تحميل المواعيد" }, { status: 500 });
  }
}
