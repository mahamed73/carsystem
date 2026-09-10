import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BookingStatus } from '../../types';
import { Search, Filter } from 'lucide-react';

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

export default function BookingsList() {
  const { bookings } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');

  const filteredBookings = bookings
    .filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          b.bookingNumber.toLowerCase().includes(s) ||
          b.customer.name.toLowerCase().includes(s) ||
          b.customer.phone.includes(s) ||
          b.vehicle.make.toLowerCase().includes(s) ||
          b.vehicle.model.toLowerCase().includes(s)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">الحجوزات</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الجوال، رقم الحجز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-[#243044] rounded-lg pr-10 pl-4 py-2.5 text-white placeholder-gray-500 focus:border-[#d4a853] focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALL')}
            className="bg-[#111827] border border-[#243044] rounded-lg pr-10 pl-4 py-2.5 text-white appearance-none focus:border-[#d4a853] focus:outline-none min-w-[150px]"
          >
            <option value="ALL">كل الحالات</option>
            <option value="NEW">جديد</option>
            <option value="CONFIRMED">مؤكد</option>
            <option value="ARRIVED">وصل</option>
            <option value="IN_SERVICE">قيد الخدمة</option>
            <option value="COMPLETED">مكتمل</option>
            <option value="CANCELLED">ملغي</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#243044] rounded-xl overflow-hidden">
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
              {filteredBookings.map(booking => (
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
              {filteredBookings.length === 0 && (
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
