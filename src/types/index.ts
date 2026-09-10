export interface Customer {
  id: string;
  name: string;
  phone: string;
  vehicles: Vehicle[];
  createdAt: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  plateNumber: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price?: number;
  active: boolean;
}

export type BookingStatus = 'NEW' | 'CONFIRMED' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';

export interface TimelineEntry {
  status: BookingStatus;
  timestamp: string;
  note?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  vehicle: Vehicle;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: BookingStatus;
  timeline: TimelineEntry[];
  createdAt: string;
}

export interface Settings {
  centerName: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  workingDays: number[]; // 0=Sunday, 6=Saturday
  workingHours: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  slotDuration: number; // minutes
  slotCapacity: number;
  holidays: string[]; // YYYY-MM-DD
  closedDates: string[]; // YYYY-MM-DD
}

export interface TimeSlot {
  time: string;
  capacity: number;
  booked: number;
  available: boolean;
}
