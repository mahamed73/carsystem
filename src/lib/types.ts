export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  bookings_count?: number;
  vehicles_count?: number;
  last_visit?: string | null;
}

export interface Vehicle {
  id: number;
  customer_id: number;
  make: string;
  model: string;
  year: number | null;
  plate_number: string | null;
  color: string | null;
  mileage: number | null;
  created_at: string;
}

export interface Booking {
  id: number;
  reference: string;
  customer_id: number;
  vehicle_id: number;
  service_id: number;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM
  status: BookingStatus;
  customer_notes: string | null;
  admin_notes: string | null;
  price: number | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;

  // حقول مشتقة من عمليات JOIN
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_icon: string;
  duration_minutes: number;
  service_price: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | null;
  vehicle_plate: string | null;
  assigned_name?: string | null;
}

export interface BookingEvent {
  id: number;
  booking_id: number;
  status: BookingStatus | null;
  note: string | null;
  created_by: number | null;
  created_at: string;
  user_name?: string | null;
}

export interface WorkshopSettings {
  workshop_name: string;
  phone: string;
  whatsapp: string;
  address: string;
  open_time: string;
  close_time: string;
  slot_minutes: string;
  capacity: string;
  closed_days: string;
  slot_note: string;
}

export interface Slot {
  time: string;
  taken: number;
  capacity: number;
  available: boolean;
}

export interface DashboardStats {
  today: number;
  pending: number;
  week: number;
  completed_month: number;
  revenue_month: number;
  customers_total: number;
  customers_new_month: number;
  completion_rate: number;
}
