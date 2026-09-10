import { Booking, Customer, Service, Settings } from '../types';

export const defaultSettings: Settings = {
  centerName: 'مراكز سعود التخصصي لصيانة السيارات',
  phone: '0500000000',
  whatsappNumber: '966500000000',
  address: 'الرياض، المملكة العربية السعودية',
  workingDays: [6, 0, 1, 2, 3, 4], // Saturday to Thursday
  workingHours: {
    start: '09:00',
    end: '23:00',
  },
  slotDuration: 30,
  slotCapacity: 1,
  holidays: [],
  closedDates: [],
};

export const defaultServices: Service[] = [
  {
    id: 'svc-1',
    name: 'سمكرة',
    description: 'إصلاح هيكل السيارة وإزالة الخدوش والانبعاجات',
    duration: 120,
    price: 500,
    active: true,
  },
  {
    id: 'svc-2',
    name: 'دهان',
    description: 'دهان احترافي بألوان مطابقة للمصنع',
    duration: 240,
    price: 1500,
    active: true,
  },
  {
    id: 'svc-3',
    name: 'صيانة',
    description: 'صيانة دورية شاملة للمحرك والأنظمة',
    duration: 60,
    price: 300,
    active: true,
  },
  {
    id: 'svc-4',
    name: 'فحص / تشخيص',
    description: 'فحص شامل بالكمبيوتر وتشخيص الأعطال',
    duration: 45,
    price: 150,
    active: true,
  },
  {
    id: 'svc-5',
    name: 'خدمة أخرى',
    description: 'خدمات متنوعة أخرى',
    duration: 60,
    active: true,
  },
];

export const defaultCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'محمد العتيبي',
    phone: '0551234567',
    vehicles: [
      { make: 'تويوتا', model: 'كامري', year: '2022', plateNumber: 'أ ب ج 1234' },
    ],
    createdAt: '2024-01-15',
  },
  {
    id: 'cust-2',
    name: 'فهد الشمري',
    phone: '0559876543',
    vehicles: [
      { make: 'هيونداي', model: 'سوناتا', year: '2023', plateNumber: 'د هـ و 5678' },
    ],
    createdAt: '2024-02-20',
  },
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

export const defaultBookings: Booking[] = [
  {
    id: 'book-1',
    bookingNumber: 'SA-000001',
    customer: { name: 'محمد العتيبي', phone: '0551234567' },
    vehicle: { make: 'تويوتا', model: 'كامري', year: '2022', plateNumber: 'أ ب ج 1234' },
    serviceId: 'svc-3',
    serviceName: 'صيانة',
    date: todayStr,
    time: '10:00',
    status: 'CONFIRMED',
    timeline: [
      { status: 'NEW', timestamp: '2024-03-01T08:00:00' },
      { status: 'CONFIRMED', timestamp: '2024-03-01T08:30:00' },
    ],
    createdAt: '2024-03-01T08:00:00',
  },
  {
    id: 'book-2',
    bookingNumber: 'SA-000002',
    customer: { name: 'فهد الشمري', phone: '0559876543' },
    vehicle: { make: 'هيونداي', model: 'سوناتا', year: '2023', plateNumber: 'د هـ و 5678' },
    serviceId: 'svc-1',
    serviceName: 'سمكرة',
    date: tomorrowStr,
    time: '11:00',
    status: 'NEW',
    timeline: [
      { status: 'NEW', timestamp: '2024-03-02T09:00:00' },
    ],
    createdAt: '2024-03-02T09:00:00',
  },
  {
    id: 'book-3',
    bookingNumber: 'SA-000003',
    customer: { name: 'عبدالله القحطاني', phone: '0557654321' },
    vehicle: { make: 'نيسان', model: 'باترول', year: '2021', plateNumber: 'س ع ف 9012' },
    serviceId: 'svc-2',
    serviceName: 'دهان',
    date: yesterdayStr,
    time: '09:30',
    status: 'COMPLETED',
    timeline: [
      { status: 'NEW', timestamp: '2024-02-28T07:00:00' },
      { status: 'CONFIRMED', timestamp: '2024-02-28T07:30:00' },
      { status: 'ARRIVED', timestamp: `${yesterdayStr}T09:30:00` },
      { status: 'IN_SERVICE', timestamp: `${yesterdayStr}T10:00:00` },
      { status: 'COMPLETED', timestamp: `${yesterdayStr}T14:00:00` },
    ],
    createdAt: '2024-02-28T07:00:00',
  },
];
