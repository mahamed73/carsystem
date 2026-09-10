import { listBookings } from "@/lib/queries";
import { currentUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

/** تصدير كل الحجوزات كملف CSV يفتح في Excel (بترميز UTF-8 مع BOM للعربية) */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return new Response("unauthorized", { status: 401 });
  }

  const bookings = await listBookings({ limit: 5000 });

  const header = [
    "المرجع",
    "التاريخ",
    "الوقت",
    "العميل",
    "الهاتف",
    "الماركة",
    "الموديل",
    "السنة",
    "اللوحة",
    "الخدمة",
    "الحالة",
    "السعر",
    "ملاحظات العميل",
    "ملاحظات الإدارة",
  ];

  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [header.map(escape).join(",")];
  for (const b of bookings) {
    lines.push(
      [
        b.reference,
        b.scheduled_date,
        b.scheduled_time,
        b.customer_name,
        b.customer_phone,
        b.vehicle_make,
        b.vehicle_model,
        b.vehicle_year ?? "",
        b.vehicle_plate ?? "",
        b.service_name,
        STATUS_LABELS[b.status],
        b.price ?? b.service_price,
        b.customer_notes ?? "",
        b.admin_notes ?? "",
      ]
        .map(escape)
        .join(",")
    );
  }

  const csv = `\uFEFF${lines.join("\r\n")}`;
  const filename = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
