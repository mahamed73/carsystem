import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, TimeSlot, Vehicle } from '../types';
import { getAvailableSlots, getNextBookingNumber, addCustomer, getCustomers } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { Check, ChevronLeft, ChevronRight, Calendar, Clock, Car, User, Wrench, Phone } from 'lucide-react';

interface FormData {
  name: string;
  phone: string;
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  serviceId: string;
  date: string;
  time: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function BookingPage() {
  const { services, settings, addBooking } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '', phone: '', make: '', model: '', year: '', plateNumber: '',
    serviceId: '', date: '', time: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const activeServices = services.filter(s => s.active);

  const availableSlots = useMemo(() => {
    if (!formData.date || !formData.serviceId) return [];
    return getAvailableSlots(formData.date, formData.serviceId);
  }, [formData.date, formData.serviceId]);

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الجوال مطلوب';
    else if (!/^05\d{8}$/.test(formData.phone.trim())) newErrors.phone = 'رقم الجوال غير صحيح (يبدأ بـ 05)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.make.trim()) newErrors.make = 'نوع السيارة مطلوب';
    if (!formData.model.trim()) newErrors.model = 'الموديل مطلوب';
    if (!formData.year.trim()) newErrors.year = 'سنة الصنع مطلوبة';
    if (!formData.plateNumber.trim()) newErrors.plateNumber = 'رقم اللوحة مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.serviceId) newErrors.serviceId = 'يرجى اختيار الخدمة';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.date) newErrors.date = 'يرجى اختيار التاريخ';
    if (!formData.time) newErrors.time = 'يرجى اختيار الوقت';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
    else if (step === 4 && validateStep4()) setStep(5);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirm = () => {
    const selectedService = services.find(s => s.id === formData.serviceId);
    if (!selectedService) return;

    const bookingNumber = getNextBookingNumber();
    const now = new Date().toISOString();

    const vehicle: Vehicle = {
      make: formData.make,
      model: formData.model,
      year: formData.year,
      plateNumber: formData.plateNumber,
    };

    const booking: Booking = {
      id: uuidv4(),
      bookingNumber,
      customer: { name: formData.name, phone: formData.phone },
      vehicle,
      serviceId: formData.serviceId,
      serviceName: selectedService.name,
      date: formData.date,
      time: formData.time,
      status: 'NEW',
      timeline: [{ status: 'NEW', timestamp: now }],
      createdAt: now,
    };

    addBooking(booking);

    // Add/update customer
    const customers = getCustomers();
    const existing = customers.find(c => c.phone === formData.phone);
    if (!existing) {
      addCustomer({
        id: uuidv4(),
        name: formData.name,
        phone: formData.phone,
        vehicles: [vehicle],
        createdAt: now,
      });
    }

    setConfirmedBooking(booking);
    setStep(6);
  };

  const handleNewBooking = () => {
    setStep(1);
    setFormData({ name: '', phone: '', make: '', model: '', year: '', plateNumber: '', serviceId: '', date: '', time: '' });
    setErrors({});
    setConfirmedBooking(null);
  };

  const selectedService = services.find(s => s.id === formData.serviceId);

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${m} ${period}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  if (step === 6 && confirmedBooking) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#111827] rounded-2xl p-8 border border-[#243044]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">تم استلام طلب الحجز بنجاح</h1>
            <p className="text-gray-400">رقم الحجز: <span className="text-[#d4a853] font-bold">{confirmedBooking.bookingNumber}</span></p>
          </div>

          <div className="bg-[#1a2332] rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">الاسم</span>
              <span className="text-white">{confirmedBooking.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">الجوال</span>
              <span className="text-white">{confirmedBooking.customer.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">السيارة</span>
              <span className="text-white">{confirmedBooking.vehicle.make} {confirmedBooking.vehicle.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">الخدمة</span>
              <span className="text-white">{confirmedBooking.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">التاريخ</span>
              <span className="text-white">{formatDate(confirmedBooking.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">الوقت</span>
              <span className="text-white">{formatTime(confirmedBooking.time)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`مرحباً، رقم حجزي: ${confirmedBooking.bookingNumber}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors"
            >
              التواصل عبر واتساب
            </a>
            <button
              onClick={handleNewBooking}
              className="block w-full text-center bg-[#243044] hover:bg-[#374151] text-white py-3 rounded-xl font-medium transition-colors"
            >
              حجز جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{settings.centerName}</h1>
          <p className="text-gray-400">احجز موعد صيانة سيارتك بسهولة</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? 'bg-[#d4a853] text-[#0a0f1a]' : 'bg-[#243044] text-gray-400'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 5 && <div className={`w-6 h-0.5 ${step > s ? 'bg-[#d4a853]' : 'bg-[#243044]'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-[#111827] rounded-2xl p-6 md:p-8 border border-[#243044]">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#d4a853]" />
                تسجيل الدخول
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#d4a853] focus:outline-none"
                    placeholder="أدخل اسمك الكامل"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">رقم الجوال *</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-[#1a2332] border border-[#243044] rounded-lg pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:border-[#d4a853] focus:outline-none"
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Car className="w-5 h-5 text-[#d4a853]" />
                بيانات السيارة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">نوع السيارة *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#d4a853] focus:outline-none"
                    placeholder="مثال: تويوتا"
                  />
                  {errors.make && <p className="text-red-400 text-xs mt-1">{errors.make}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الموديل *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#d4a853] focus:outline-none"
                    placeholder="مثال: كامري"
                  />
                  {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">سنة الصنع *</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#d4a853] focus:outline-none"
                    placeholder="2024"
                    dir="ltr"
                  />
                  {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">رقم اللوحة *</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                    className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#d4a853] focus:outline-none"
                    placeholder="أ ب ج 1234"
                  />
                  {errors.plateNumber && <p className="text-red-400 text-xs mt-1">{errors.plateNumber}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#d4a853]" />
                اختر الخدمة
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {activeServices.map(service => (
                  <button
                    key={service.id}
                    onClick={() => setFormData({...formData, serviceId: service.id})}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      formData.serviceId === service.id
                        ? 'border-[#d4a853] bg-[#d4a853]/10'
                        : 'border-[#243044] bg-[#1a2332] hover:border-[#374151]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">{service.name}</h3>
                        <p className="text-gray-400 text-sm mt-1">{service.description}</p>
                      </div>
                      {formData.serviceId === service.id && (
                        <Check className="w-5 h-5 text-[#d4a853]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {errors.serviceId && <p className="text-red-400 text-xs mt-2">{errors.serviceId}</p>}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#d4a853]" />
                اختر التاريخ والوقت
              </h2>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">التاريخ *</label>
                <input
                  type="date"
                  value={formData.date}
                  min={minDate}
                  onChange={(e) => setFormData({...formData, date: e.target.value, time: ''})}
                  className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-3 text-white focus:border-[#d4a853] focus:outline-none"
                  dir="ltr"
                />
                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
              </div>

              {formData.date && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    الوقت المتاح *
                  </label>
                  {availableSlots.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">لا توجد مواعيد متاحة في هذا اليوم</p>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setFormData({...formData, time: slot.time})}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            !slot.available
                              ? 'bg-[#1a2332] text-gray-600 cursor-not-allowed line-through'
                              : formData.time === slot.time
                                ? 'bg-[#d4a853] text-[#0a0f1a]'
                                : 'bg-[#1a2332] text-white border border-[#243044] hover:border-[#d4a853]'
                          }`}
                        >
                          {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.time && <p className="text-red-400 text-xs mt-2">{errors.time}</p>}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">تأكيد الحجز</h2>
              <div className="bg-[#1a2332] rounded-xl p-4 space-y-4">
                <div className="flex justify-between border-b border-[#243044] pb-3">
                  <span className="text-gray-400">الاسم</span>
                  <span className="text-white font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#243044] pb-3">
                  <span className="text-gray-400">الجوال</span>
                  <span className="text-white font-medium" dir="ltr">{formData.phone}</span>
                </div>
                <div className="flex justify-between border-b border-[#243044] pb-3">
                  <span className="text-gray-400">السيارة</span>
                  <span className="text-white font-medium">{formData.make} {formData.model} - {formData.year}</span>
                </div>
                <div className="flex justify-between border-b border-[#243044] pb-3">
                  <span className="text-gray-400">رقم اللوحة</span>
                  <span className="text-white font-medium">{formData.plateNumber}</span>
                </div>
                <div className="flex justify-between border-b border-[#243044] pb-3">
                  <span className="text-gray-400">الخدمة</span>
                  <span className="text-white font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#243044] pb-3">
                  <span className="text-gray-400">التاريخ</span>
                  <span className="text-white font-medium">{formatDate(formData.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">الوقت</span>
                  <span className="text-white font-medium">{formatTime(formData.time)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-[#d4a853] hover:bg-[#c9952c] text-[#0a0f1a] font-bold px-6 py-3 rounded-xl transition-colors"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" />
                تأكيد الحجز
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
