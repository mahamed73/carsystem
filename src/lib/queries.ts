import { pool, query, queryOne } from "./db";
import { todayISO } from "./format";
import type {
  Booking,
  BookingEvent,
  BookingStatus,
  Customer,
  DashboardStats,
  Service,
  Vehicle,
} from "./types";

/* =====================================================================
 *  الخدمات
 * ===================================================================== */

export async function getActiveServices(): Promise<Service[]> {
  return query<Service>(
    `SELECT * FROM services WHERE is_active = TRUE ORDER BY sort_order, id`
  );
}

export async function getAllServices(): Promise<
  (Service & { bookings_count: number })[]
> {
  return query(
    `SELECT s.*, (SELECT count(*)::int FROM bookings b WHERE b.service_id = s.id) AS bookings_count
       FROM services s
      ORDER BY s.sort_order, s.id`
  );
}

export async function getServiceById(id: number): Promise<Service | null> {
  return queryOne<Service>(`SELECT * FROM services WHERE id = $1`, [id]);
}

export interface ServiceInput {
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

export async function insertService(data: ServiceInput): Promise<void> {
  await query(
    `INSERT INTO services (name, description, duration_minutes, price, icon, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      data.name,
      data.description,
      data.duration_minutes,
      data.price,
      data.icon,
      data.is_active,
      data.sort_order,
    ]
  );
}

export async function updateService(id: number, data: ServiceInput): Promise<void> {
  await query(
    `UPDATE services
        SET name = $2, description = $3, duration_minutes = $4, price = $5,
            icon = $6, is_active = $7, sort_order = $8
      WHERE id = $1`,
    [
      id,
      data.name,
      data.description,
      data.duration_minutes,
      data.price,
      data.icon,
      data.is_active,
      data.sort_order,
    ]
  );
}

export async function setServiceActive(id: number, active: boolean): Promise<void> {
  await query(`UPDATE services SET is_active = $2 WHERE id = $1`, [id, active]);
}

/** حذف خدمة — لو مرتبطة بحجوزات يتم تعطيلها بدلاً من الحذف */
export async function deleteService(id: number): Promise<"deleted" | "deactivated"> {
  const used = await queryOne<{ c: number }>(
    `SELECT count(*)::int AS c FROM bookings WHERE service_id = $1`,
    [id]
  );
  if (used && used.c > 0) {
    await setServiceActive(id, false);
    return "deactivated";
  }
  await query(`DELETE FROM services WHERE id = $1`, [id]);
  return "deleted";
}

/* =====================================================================
 *  الحجوزات
 * ===================================================================== */

const BOOKING_SELECT = `
  SELECT b.*,
         c.name  AS customer_name,
         c.phone AS customer_phone,
         s.name  AS service_name,
         s.icon  AS service_icon,
         s.duration_minutes,
         s.price AS service_price,
         v.make  AS vehicle_make,
         v.model AS vehicle_model,
         v.year  AS vehicle_year,
         v.plate_number AS vehicle_plate,
         u.name  AS assigned_name
    FROM bookings b
    JOIN customers c ON c.id = b.customer_id
    JOIN vehicles  v ON v.id = b.vehicle_id
    JOIN services  s ON s.id = b.service_id
    LEFT JOIN users u ON u.id = b.assigned_to
`;

export interface BookingFilters {
  status?: BookingStatus | "all";
  date?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listBookings(filters: BookingFilters = {}): Promise<Booking[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    where.push(`b.status = $${params.length}`);
  }
  if (filters.date) {
    params.push(filters.date);
    where.push(`b.scheduled_date = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    where.push(`b.scheduled_date >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    where.push(`b.scheduled_date <= $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    const i = params.length;
    where.push(
      `(c.name ILIKE $${i} OR c.phone ILIKE $${i} OR b.reference ILIKE $${i}
        OR v.plate_number ILIKE $${i} OR v.make ILIKE $${i} OR v.model ILIKE $${i})`
    );
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  params.push(limit);

  const sql = `
    ${BOOKING_SELECT}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY b.scheduled_date DESC, b.scheduled_time DESC
    LIMIT $${params.length}
  `;
  return query<Booking>(sql, params);
}

export async function getBookingById(id: number): Promise<Booking | null> {
  return queryOne<Booking>(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
}

export async function getBookingByReference(reference: string): Promise<Booking | null> {
  return queryOne<Booking>(
    `${BOOKING_SELECT} WHERE upper(b.reference) = upper($1)`,
    [reference.trim()]
  );
}

export async function getBookingEvents(bookingId: number): Promise<BookingEvent[]> {
  return query<BookingEvent>(
    `SELECT e.*, u.name AS user_name
       FROM booking_events e
       LEFT JOIN users u ON u.id = e.created_by
      WHERE e.booking_id = $1
      ORDER BY e.created_at DESC`,
    [bookingId]
  );
}

/** الحجوزات القادمة اليوم وغداً — تُستخدم في لوحة التحكم */
export async function getUpcomingBookings(limit = 8): Promise<Booking[]> {
  return query<Booking>(
    `${BOOKING_SELECT}
      WHERE b.scheduled_date >= CURRENT_DATE
        AND b.status IN ('pending','confirmed','in_progress')
      ORDER BY b.scheduled_date, b.scheduled_time
      LIMIT $1`,
    [limit]
  );
}

export async function updateBookingStatus(
  id: number,
  status: BookingStatus,
  note: string | null,
  userId: number | null
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE bookings
          SET status = $2::varchar,
              completed_at = CASE
                WHEN $2::varchar = 'completed' THEN now()
                ELSE completed_at
              END
        WHERE id = $1::int`,
      [id, status]
    );
    await client.query(
      `INSERT INTO booking_events (booking_id, status, note, created_by)
       VALUES ($1, $2, $3, $4)`,
      [id, status, note, userId]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface BookingUpdate {
  scheduled_date?: string;
  scheduled_time?: string;
  price?: number | null;
  assigned_to?: number | null;
  admin_notes?: string | null;
}

export async function updateBookingDetails(
  id: number,
  patch: BookingUpdate,
  userId: number | null
): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [id];

  const push = (column: string, value: unknown) => {
    params.push(value);
    fields.push(`${column} = $${params.length}`);
  };

  if (patch.scheduled_date !== undefined) push("scheduled_date", patch.scheduled_date);
  if (patch.scheduled_time !== undefined) push("scheduled_time", patch.scheduled_time);
  if (patch.price !== undefined) push("price", patch.price);
  if (patch.assigned_to !== undefined) push("assigned_to", patch.assigned_to);
  if (patch.admin_notes !== undefined) push("admin_notes", patch.admin_notes);

  if (fields.length === 0) return;

  await query(`UPDATE bookings SET ${fields.join(", ")} WHERE id = $1`, params);
  await query(
    `INSERT INTO booking_events (booking_id, note, created_by)
     VALUES ($1, $2, $3)`,
    [id, "تم تحديث بيانات الحجز", userId]
  );
}

/* ---------------------------------------------------------------------
 *  إنشاء حجز جديد (من الموقع أو من لوحة التحكم)
 * --------------------------------------------------------------------- */

export interface CreateBookingInput {
  service_id: number;
  scheduled_date: string;
  scheduled_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_notes?: string | null;
  make: string;
  model: string;
  year?: number | null;
  plate_number?: string | null;
  color?: string | null;
  mileage?: number | null;
  created_by?: number | null;
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeReference(): string {
  const d = todayISO().replace(/-/g, "").slice(2); // YYMMDD
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `CR-${d}-${rand}`;
}

export async function createBooking(
  input: CreateBookingInput
): Promise<{ id: number; reference: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) العميل — البحث بالهاتف أو الإضافة
    const phone = input.customer_phone.trim();
    const existingCustomer = await client.query(
      `SELECT id FROM customers WHERE phone = $1`,
      [phone]
    );

    let customerId: number;
    if (existingCustomer.rowCount && existingCustomer.rows[0]) {
      customerId = existingCustomer.rows[0].id;
      await client.query(
        `UPDATE customers SET name = $2, email = COALESCE($3, email) WHERE id = $1`,
        [customerId, input.customer_name.trim(), input.customer_email || null]
      );
    } else {
      const inserted = await client.query(
        `INSERT INTO customers (name, phone, email) VALUES ($1, $2, $3) RETURNING id`,
        [input.customer_name.trim(), phone, input.customer_email || null]
      );
      customerId = inserted.rows[0].id;
    }

    // 2) السيارة — البحث برقم اللوحة لنفس العميل أو الإضافة
    let vehicleId: number;
    const plate = input.plate_number?.trim() || null;
    const existingVehicle = plate
      ? await client.query(
          `SELECT id FROM vehicles WHERE customer_id = $1 AND upper(plate_number) = upper($2) LIMIT 1`,
          [customerId, plate]
        )
      : { rowCount: 0, rows: [] as { id: number }[] };

    if (existingVehicle.rowCount && existingVehicle.rows[0]) {
      vehicleId = existingVehicle.rows[0].id;
      await client.query(
        `UPDATE vehicles
            SET make = $2, model = $3, year = COALESCE($4, year),
                color = COALESCE($5, color), mileage = COALESCE($6, mileage)
          WHERE id = $1`,
        [
          vehicleId,
          input.make.trim(),
          input.model.trim(),
          input.year || null,
          input.color || null,
          input.mileage ?? null,
        ]
      );
    } else {
      const inserted = await client.query(
        `INSERT INTO vehicles (customer_id, make, model, year, plate_number, color, mileage)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          customerId,
          input.make.trim(),
          input.model.trim(),
          input.year || null,
          plate,
          input.color || null,
          input.mileage ?? null,
        ]
      );
      vehicleId = inserted.rows[0].id;
    }

    // 3) الحجز — مع إعادة المحاولة لو تعارض رقم المرجع
    let booking: { id: number; reference: string } | null = null;
    for (let attempt = 0; attempt < 6 && !booking; attempt++) {
      const reference = makeReference();
      try {
        const inserted = await client.query(
          `INSERT INTO bookings
             (reference, customer_id, vehicle_id, service_id,
              scheduled_date, scheduled_time, customer_notes, assigned_to)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, reference`,
          [
            reference,
            customerId,
            vehicleId,
            input.service_id,
            input.scheduled_date,
            input.scheduled_time,
            input.customer_notes || null,
            input.created_by ?? null,
          ]
        );
        booking = { id: inserted.rows[0].id, reference: inserted.rows[0].reference };
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code !== "23505") throw err; // 23505 = unique_violation
      }
    }
    if (!booking) throw new Error("تعذّر توليد رقم مرجعي مميز للحجز، حاول مرة أخرى.");

    await client.query(
      `INSERT INTO booking_events (booking_id, status, note, created_by)
       VALUES ($1, 'pending', $2, $3)`,
      [booking.id, "تم إنشاء الحجز", input.created_by ?? null]
    );

    await client.query("COMMIT");
    return booking;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* =====================================================================
 *  العملاء والسيارات
 * ===================================================================== */

export async function listCustomers(search?: string, limit = 200): Promise<Customer[]> {
  const params: unknown[] = [];
  let where = "";
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    where = `WHERE c.name ILIKE $1 OR c.phone ILIKE $1
               OR EXISTS (SELECT 1 FROM vehicles v
                           WHERE v.customer_id = c.id
                             AND (v.plate_number ILIKE $1 OR v.make ILIKE $1 OR v.model ILIKE $1))`;
  }
  params.push(Math.min(Math.max(limit, 1), 1000));

  return query<Customer>(
    `SELECT c.*,
            (SELECT count(*)::int FROM bookings b WHERE b.customer_id = c.id) AS bookings_count,
            (SELECT count(*)::int FROM vehicles v WHERE v.customer_id = c.id) AS vehicles_count,
            (SELECT max(b.scheduled_date) FROM bookings b
              WHERE b.customer_id = c.id AND b.status = 'completed') AS last_visit
       FROM customers c
       ${where}
      ORDER BY c.created_at DESC
      LIMIT $${params.length}`,
    params
  );
}

export async function getCustomerWithVehicles(
  id: number
): Promise<{ customer: Customer | null; vehicles: Vehicle[]; bookings: Booking[] }> {
  const customer = await queryOne<Customer>(`SELECT * FROM customers WHERE id = $1`, [id]);
  const vehicles = await query<Vehicle>(
    `SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC`,
    [id]
  );
  const bookings = await query<Booking>(
    `${BOOKING_SELECT} WHERE b.customer_id = $1
      ORDER BY b.scheduled_date DESC LIMIT 50`,
    [id]
  );
  return { customer, vehicles, bookings };
}

export async function updateCustomerNotes(id: number, notes: string | null): Promise<void> {
  await query(`UPDATE customers SET notes = $2 WHERE id = $1`, [id, notes]);
}

/* =====================================================================
 *  المستخدمون (المدير + الفنيون)
 * ===================================================================== */

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
}

export async function listStaff(): Promise<StaffUser[]> {
  return query<StaffUser>(
    `SELECT id, name, email, phone, role, is_active, created_at
       FROM users ORDER BY created_at`
  );
}

export async function insertUser(data: {
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: "admin" | "staff";
}): Promise<void> {
  await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.name, data.email.toLowerCase(), data.phone, data.password_hash, data.role]
  );
}

export async function setUserActive(id: number, active: boolean): Promise<void> {
  await query(`UPDATE users SET is_active = $2 WHERE id = $1`, [id, active]);
}

export async function updateUserPassword(id: number, hash: string): Promise<void> {
  await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [id, hash]);
}

export async function getUserByEmail(email: string): Promise<
  | (StaffUser & { password_hash: string })
  | null
> {
  return queryOne(
    `SELECT id, name, email, phone, role, is_active, created_at, password_hash
       FROM users WHERE lower(email) = lower($1)`,
    [email]
  );
}

/* =====================================================================
 *  الإحصائيات والتقارير
 * ===================================================================== */

export async function getDashboardStats(): Promise<DashboardStats> {
  const row = await queryOne<{
    today: number;
    pending: number;
    week: number;
    completed_month: number;
    revenue_month: number;
    customers_total: number;
    customers_new_month: number;
    all_total: number;
    all_completed: number;
  }>(`
    SELECT
      (SELECT count(*)::int FROM bookings
        WHERE scheduled_date = CURRENT_DATE AND status <> 'cancelled')                    AS today,
      (SELECT count(*)::int FROM bookings WHERE status = 'pending')                       AS pending,
      (SELECT count(*)::int FROM bookings
        WHERE scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
          AND status IN ('pending','confirmed','in_progress'))                            AS week,
      (SELECT count(*)::int FROM bookings
        WHERE status = 'completed'
          AND date_trunc('month', scheduled_date) = date_trunc('month', CURRENT_DATE))    AS completed_month,
      (SELECT COALESCE(sum(COALESCE(b.price, s.price)), 0)::float
         FROM bookings b JOIN services s ON s.id = b.service_id
        WHERE b.status = 'completed'
          AND date_trunc('month', b.scheduled_date) = date_trunc('month', CURRENT_DATE))  AS revenue_month,
      (SELECT count(*)::int FROM customers)                                               AS customers_total,
      (SELECT count(*)::int FROM customers
        WHERE date_trunc('month', created_at) = date_trunc('month', now()))               AS customers_new_month,
      (SELECT count(*)::int FROM bookings)                                                AS all_total,
      (SELECT count(*)::int FROM bookings WHERE status = 'completed')                     AS all_completed
  `);

  const s = row ?? {
    today: 0,
    pending: 0,
    week: 0,
    completed_month: 0,
    revenue_month: 0,
    customers_total: 0,
    customers_new_month: 0,
    all_total: 0,
    all_completed: 0,
  };

  return {
    today: s.today,
    pending: s.pending,
    week: s.week,
    completed_month: s.completed_month,
    revenue_month: s.revenue_month,
    customers_total: s.customers_total,
    customers_new_month: s.customers_new_month,
    completion_rate: s.all_total > 0 ? Math.round((s.all_completed / s.all_total) * 100) : 0,
  };
}

export interface ReportData {
  monthly: { month: string; bookings: number; completed: number; revenue: number }[];
  byService: { name: string; icon: string; bookings: number; revenue: number }[];
  byStatus: { status: BookingStatus; count: number }[];
  daily: { day: string; count: number }[];
}

export async function getReports(): Promise<ReportData> {
  const monthly = await query<{
    month: string;
    bookings: number;
    completed: number;
    revenue: number;
  }>(`
    SELECT to_char(date_trunc('month', b.scheduled_date), 'YYYY-MM') AS month,
           count(*)::int AS bookings,
           count(*) FILTER (WHERE b.status = 'completed')::int AS completed,
           COALESCE(sum(COALESCE(b.price, s.price)) FILTER (WHERE b.status = 'completed'), 0)::float AS revenue
      FROM bookings b
      JOIN services s ON s.id = b.service_id
     WHERE b.scheduled_date >= date_trunc('month', CURRENT_DATE) - interval '5 months'
     GROUP BY 1
     ORDER BY 1
  `);

  const byService = await query<{
    name: string;
    icon: string;
    bookings: number;
    revenue: number;
  }>(`
    SELECT s.name, s.icon,
           count(b.id)::int AS bookings,
           COALESCE(sum(COALESCE(b.price, s.price)) FILTER (WHERE b.status = 'completed'), 0)::float AS revenue
      FROM services s
      LEFT JOIN bookings b ON b.service_id = s.id
     GROUP BY s.id, s.name, s.icon
     ORDER BY bookings DESC
     LIMIT 10
  `);

  const byStatus = await query<{ status: BookingStatus; count: number }>(`
    SELECT status, count(*)::int AS count FROM bookings GROUP BY status
  `);

  const daily = await query<{ day: string; count: number }>(`
    SELECT to_char(scheduled_date, 'YYYY-MM-DD') AS day, count(*)::int AS count
      FROM bookings
     WHERE scheduled_date BETWEEN CURRENT_DATE - 13 AND CURRENT_DATE + 1
     GROUP BY 1
     ORDER BY 1
  `);

  return { monthly, byService, byStatus, daily };
}

export { todayISO };
