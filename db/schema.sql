-- =====================================================================
--  نظام حجز صيانة السيارات — مخطط قاعدة البيانات
--  PostgreSQL 15+
--  هذا الملف Idempotent: يمكن تشغيله أكثر من مرة بدون مشاكل
-- =====================================================================

-- ---------------------------------------------------------------------
-- المستخدمون (مدير النظام + الفنيين)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash TEXT          NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'staff'
                CHECK (role IN ('admin', 'staff')),
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- خدمات الصيانة المعروضة على العملاء
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(160)  NOT NULL,
  description      TEXT,
  duration_minutes INTEGER       NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  price            NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  icon             VARCHAR(16)   NOT NULL DEFAULT '🔧',
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order       INTEGER       NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active, sort_order);

-- ---------------------------------------------------------------------
-- العملاء
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(160) NOT NULL,
  phone      VARCHAR(30)  NOT NULL UNIQUE,
  email      VARCHAR(160),
  notes      TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ---------------------------------------------------------------------
-- سيارات العملاء
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id           SERIAL PRIMARY KEY,
  customer_id  INTEGER     NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  make         VARCHAR(80) NOT NULL,
  model        VARCHAR(80) NOT NULL,
  year         INTEGER     CHECK (year IS NULL OR (year >= 1950 AND year <= 2100)),
  plate_number VARCHAR(40),
  color        VARCHAR(40),
  mileage      INTEGER     CHECK (mileage IS NULL OR mileage >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);

-- ---------------------------------------------------------------------
-- الحجوزات
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id             SERIAL PRIMARY KEY,
  reference      VARCHAR(24)   NOT NULL UNIQUE,
  customer_id    INTEGER       NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id     INTEGER       NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  service_id     INTEGER       NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  scheduled_date DATE          NOT NULL,
  scheduled_time TIME          NOT NULL,
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','no_show')),
  customer_notes TEXT,
  admin_notes    TEXT,
  price          NUMERIC(10,2) CHECK (price IS NULL OR price >= 0),
  assigned_to    INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_bookings_slot      ON bookings(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer  ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created   ON bookings(created_at DESC);

-- ---------------------------------------------------------------------
-- سجل الأحداث لكل حجز (تغييرات الحالة والملاحظات)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_events (
  id         SERIAL PRIMARY KEY,
  booking_id INTEGER     NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status     VARCHAR(20),
  note       TEXT,
  created_by INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_booking ON booking_events(booking_id, created_at DESC);

-- ---------------------------------------------------------------------
-- إعدادات الورشة (مفتاح/قيمة)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(60) PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- دالة تحديث updated_at تلقائياً
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- الإعدادات الافتراضية
-- ---------------------------------------------------------------------
INSERT INTO settings (key, value) VALUES
  ('workshop_name', 'مركز الصيانة الذكي'),
  ('phone',         '01000000000'),
  ('whatsapp',      '201000000000'),
  ('address',       'المنصورة — الدقهلية، مصر'),
  ('open_time',     '09:00'),
  ('close_time',    '18:00'),
  ('slot_minutes',  '60'),
  ('capacity',      '2'),
  ('closed_days',   '5'),
  ('slot_note',     'يرجى الحضور قبل الموعد بـ 10 دقائق ومع بطاقة السيارة.')
ON CONFLICT (key) DO NOTHING;
