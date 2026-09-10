import { Booking, Customer, Service, Settings, TimeSlot } from '../types';
import { defaultSettings, defaultServices, defaultCustomers, defaultBookings } from '../data/seed';

const STORAGE_KEYS = {
  bookings: 'saudi_bookings',
  customers: 'saudi_customers',
  services: 'saudi_services',
  settings: 'saudi_settings',
  bookingCounter: 'saudi_booking_counter',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize store with seed data if empty
export function initializeStore(): void {
  if (!localStorage.getItem(STORAGE_KEYS.settings)) {
    setItem(STORAGE_KEYS.settings, defaultSettings);
  }
  if (!localStorage.getItem(STORAGE_KEYS.services)) {
    setItem(STORAGE_KEYS.services, defaultServices);
  }
  if (!localStorage.getItem(STORAGE_KEYS.customers)) {
    setItem(STORAGE_KEYS.customers, defaultCustomers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.bookings)) {
    setItem(STORAGE_KEYS.bookings, defaultBookings);
    setItem(STORAGE_KEYS.bookingCounter, 3);
  }
}

// Settings
export function getSettings(): Settings {
  return getItem(STORAGE_KEYS.settings, defaultSettings);
}

export function updateSettings(settings: Settings): void {
  setItem(STORAGE_KEYS.settings, settings);
}

// Services
export function getServices(): Service[] {
  return getItem(STORAGE_KEYS.services, defaultServices);
}

export function addService(service: Service): void {
  const services = getServices();
  services.push(service);
  setItem(STORAGE_KEYS.services, services);
}

export function updateService(service: Service): void {
  const services = getServices();
  const idx = services.findIndex(s => s.id === service.id);
  if (idx !== -1) {
    services[idx] = service;
    setItem(STORAGE_KEYS.services, services);
  }
}

export function deleteService(id: string): void {
  const services = getServices().filter(s => s.id !== id);
  setItem(STORAGE_KEYS.services, services);
}

// Customers
export function getCustomers(): Customer[] {
  return getItem(STORAGE_KEYS.customers, defaultCustomers);
}

export function addCustomer(customer: Customer): void {
  const customers = getCustomers();
  customers.push(customer);
  setItem(STORAGE_KEYS.customers, customers);
}

export function updateCustomer(customer: Customer): void {
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.id === customer.id);
  if (idx !== -1) {
    customers[idx] = customer;
    setItem(STORAGE_KEYS.customers, customers);
  }
}

// Bookings
export function getBookings(): Booking[] {
  return getItem(STORAGE_KEYS.bookings, defaultBookings);
}

export function addBooking(booking: Booking): void {
  const bookings = getBookings();
  bookings.push(booking);
  setItem(STORAGE_KEYS.bookings, bookings);
}

export function updateBooking(booking: Booking): void {
  const bookings = getBookings();
  const idx = bookings.findIndex(b => b.id === booking.id);
  if (idx !== -1) {
    bookings[idx] = booking;
    setItem(STORAGE_KEYS.bookings, bookings);
  }
}

export function getNextBookingNumber(): string {
  const counter = getItem(STORAGE_KEYS.bookingCounter, 0) + 1;
  setItem(STORAGE_KEYS.bookingCounter, counter);
  return `SA-${String(counter).padStart(6, '0')}`;
}

// Availability Logic
export function getAvailableSlots(date: string, serviceId: string): TimeSlot[] {
  const settings = getSettings();
  const bookings = getBookings();
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  // Check if day is working day
  if (!settings.workingDays.includes(dayOfWeek)) {
    return [];
  }

  // Check if date is holiday or closed
  if (settings.holidays.includes(date) || settings.closedDates.includes(date)) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const [startH, startM] = settings.workingHours.start.split(':').map(Number);
  const [endH, endM] = settings.workingHours.end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let m = startMinutes; m < endMinutes; m += settings.slotDuration) {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    const time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    const bookedCount = bookings.filter(
      b => b.date === date && b.time === time && b.status !== 'CANCELLED'
    ).length;

    slots.push({
      time,
      capacity: settings.slotCapacity,
      booked: bookedCount,
      available: bookedCount < settings.slotCapacity,
    });
  }

  return slots;
}

export function isSlotAvailable(date: string, time: string): boolean {
  const settings = getSettings();
  const bookings = getBookings();

  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  if (!settings.workingDays.includes(dayOfWeek)) return false;
  if (settings.holidays.includes(date) || settings.closedDates.includes(date)) return false;

  const bookedCount = bookings.filter(
    b => b.date === date && b.time === time && b.status !== 'CANCELLED'
  ).length;

  return bookedCount < settings.slotCapacity;
}
