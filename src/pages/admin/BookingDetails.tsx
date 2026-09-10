import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BookingStatus } from '../../types';
import { ArrowRight, Check, X, Clock, Truck, Wrench, CheckCircle } from 'lucide-react';

const statusLabels: Record<BookingStatus, string> = {
  NEW: 'جديد',
  CONFIRMED: 'مؤكد',
  ARRIVED: 'وصل',
  IN_SERVICE: 'قيد الخدمة',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

const statusColors: Record<BookingStatus, string> = {
  NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONFIRMED: 'bg-green-500/20 text-green-400 border-green-500/30',
  ARRIVED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  IN_SERVICE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const timelineStatuses: BookingStatus[] = ['NEW', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED'];

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookings, updateBooking } = useApp();

  const booking = bookings.find(b => b.id === id);

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">الحجز غير موجود</p>
        <button onClick={() => navigate('/admin/bookings')} className="text-[#d4a853] mt-4">
          العودة للحجوزات
        </button>
      </div>
    );
  }

  const updateStatus = (newStatus: BookingStatus) => {
    const now = new Date().toISOString();
    const updatedBooking = {
      ...booking,
      status: newStatus,
      timeline: [...booking.timeline, { status: newStatus, timestamp: now }],
    };
    updateBooking(updatedBooking);
  };

  const cancelBooking = () => {
    const now = new Date().toISOString();
    const updatedBooking = {
      ...booking,
      status: 'CANCELLED' as BookingStatus,
      timeline: [...booking.timeline, { status: 'CANCELLED' as BookingStatus, timestamp: now }],
    };
    updateBooking(updatedBooking);
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'NEW': return <Clock className="w-4 h-4" />;
      case 'CONFIRMED': return <Check className="w-4 h-4" />;
      case 'ARRIVED': return <Truck className="w-4 h-4" />;
      case 'IN_SERVICE': return <Wrench className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <X className="w-4 h-4" />;
    }
  };

  const getNextAction = (): { label: string; status: BookingStatus; color: string } | null => {
    switch (booking.status) {
      case 'NEW': return { label: 'تأكيد الحجز', status: 'CONFIRMED', color: 'bg-green-600 hover:bg-green-700' };
      case 'CONFIRMED': return { label: 'تسجيل الوصول', status: 'ARRIVED', color: 'bg-purple-600 hover:bg-purple-700' };
      case 'ARRIVED': return { label: 'بدء الخدمة', status: 'IN_SERVICE', color: 'bg-yellow-600 hover:bg-yellow-700' };
      case 'IN_SERVICE': return { label: 'إكمال الخدمة', status: 'COMPLETED', color: 'bg-emerald-600 hover:bg-emerald-700' };
      default: return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div>
      <button
        onClick={() => navigate('/admin/bookings')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة للحجوزات
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white">{booking.bookingNumber}</h1>
                <p className="text-gray-400 text-sm mt-1">{booking.createdAt}</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full border ${statusColors[booking.status]}`}>
                {statusLabels[booking.status]}
              </span>
            </div>
          </div>

          {/* Customer & Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">بيانات العميل</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">الاسم</p>
                  <p className="text-white">{booking.customer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">الجوال</p>
                  <p className="text-white" dir="ltr">{booking.customer.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">بيانات السيارة</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">النوع / الموديل</p>
                  <p className="text-white">{booking.vehicle.make} {booking.vehicle.model}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">سنة الصنع</p>
                  <p className="text-white">{booking.vehicle.year}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">رقم اللوحة</p>
                  <p className="text-white">{booking.vehicle.plateNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service & Appointment */}
          <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">الخدمة والموعد</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">الخدمة</p>
                <p className="text-white font-medium">{booking.serviceName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">التاريخ</p>
                <p className="text-white">{booking.date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">الوقت</p>
                <p className="text-white">{booking.time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Timeline & Actions */}
        <div className="space-y-6">
          {/* Actions */}
          {nextAction && (
            <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">إجراءات</h3>
              <div className="space-y-3">
                <button
                  onClick={() => updateStatus(nextAction.status)}
                  className={`w-full text-white font-medium py-2.5 rounded-lg transition-colors ${nextAction.color}`}
                >
                  {nextAction.label}
                </button>
                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                  <button
                    onClick={cancelBooking}
                    className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 font-medium py-2.5 rounded-lg transition-colors border border-red-500/30"
                  >
                    إلغاء الحجز
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">سجل الحجز</h3>
            <div className="space-y-4">
              {timelineStatuses.map((status, idx) => {
                const entry = booking.timeline.find(t => t.status === status);
                const isReached = booking.timeline.some(t => t.status === status);
                return (
                  <div key={status} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isReached ? 'bg-[#d4a853] text-[#0a0f1a]' : 'bg-[#1a2332] text-gray-500'
                    }`}>
                      {getStatusIcon(status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isReached ? 'text-white' : 'text-gray-500'}`}>
                        {statusLabels[status]}
                      </p>
                      {entry && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(entry.timestamp).toLocaleString('ar-SA')}
                        </p>
                      )}
                    </div>
                    {idx < timelineStatuses.length - 1 && (
                      <div className={`absolute right-4 w-0.5 h-4 ${isReached ? 'bg-[#d4a853]' : 'bg-[#243044]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
