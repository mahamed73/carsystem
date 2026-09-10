import { useApp } from '../../context/AppContext';
import { BookingStatus } from '../../types';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusLabels: Record<BookingStatus, string> = {
  NEW: 'جديد',
  CONFIRMED: 'مؤكد',
  ARRIVED: 'وصل',
  IN_SERVICE: 'قيد الخدمة',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

const statusColors: Record<BookingStatus, string> = {
  NEW: 'bg-blue-500/20 text-blue-400',
  CONFIRMED: 'bg-green-500/20 text-green-400',
  ARRIVED: 'bg-purple-500/20 text-purple-400',
  IN_SERVICE: 'bg-yellow-500/20 text-yellow-400',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

export default function DashboardHome() {
  const { bookings } = useApp();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const todayBookings = bookings.filter(b => b.date === today && b.status !== 'CANCELLED');
  const upcomingBookings = bookings.filter(b => b.date > today && b.status !== 'CANCELLED' && b.status !== 'COMPLETED');
  const newBookings = bookings.filter(b => b.status === 'NEW');
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

  const stats = [
    { label: 'حجوزات اليوم', value: todayBookings.length, icon: Calendar, color: 'text-blue-400' },
    { label: 'الحجوزات القادمة', value: upcomingBookings.length, icon: TrendingUp, color: 'text-purple-400' },
    { label: 'قيد الانتظار', value: newBookings.length, icon: AlertCircle, color: 'text-yellow-400' },
    { label: 'مؤكدة', value: confirmedBookings.length, icon: CheckCircle, color: 'text-green-400' },
    { label: 'مكتملة', value: completedBookings.length, icon: Clock, color: 'text-emerald-400' },
    { label: 'ملغاة', value: cancelledBookings.length, icon: XCircle, color: 'text-red-400' },
  ];

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">لوحة التحكم</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#111827] border border-[#243044] rounded-xl p-4">
            <div className={`mb-2 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-[#111827] border border-[#243044] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#243044]">
          <h2 className="text-lg font-bold text-white">آخر الحجوزات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a2332]">
              <tr>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">رقم الحجز</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">العميل</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">الجوال</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 hidden lg:table-cell">السيارة</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">الخدمة</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">التاريخ</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">الوقت</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">الحالة</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(booking => (
                <tr key={booking.id} className="border-t border-[#243044] hover:bg-[#1a2332]/50">
                  <td className="px-4 py-3 text-sm text-[#d4a853] font-medium">{booking.bookingNumber}</td>
                  <td className="px-4 py-3 text-sm text-white">{booking.customer.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 hidden md:table-cell" dir="ltr">{booking.customer.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 hidden lg:table-cell">{booking.vehicle.make} {booking.vehicle.model}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 hidden md:table-cell">{booking.serviceName}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{booking.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 hidden md:table-cell">{booking.time}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                      className="text-xs text-[#d4a853] hover:text-[#c9952c] font-medium"
                    >
                      عرض
                    </button>
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-8">لا توجد حجوزات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
