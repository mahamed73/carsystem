import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { Search, X, Car, Calendar } from 'lucide-react';

export default function CustomersPage() {
  const { customers, bookings } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.phone.includes(s);
  });

  const getCustomerBookings = (phone: string) => {
    return bookings.filter(b => b.customer.phone === phone);
  };

  const getCustomerStats = (phone: string) => {
    const customerBookings = getCustomerBookings(phone);
    const total = customerBookings.length;
    const lastBooking = customerBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const upcoming = customerBookings.filter(b => b.date >= today && b.status !== 'CANCELLED' && b.status !== 'COMPLETED')
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    return { total, lastBooking, upcoming };
  };

  if (selectedCustomer) {
    const customerBookings = getCustomerBookings(selectedCustomer.phone);
    return (
      <div>
        <button
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <X className="w-4 h-4" />
          العودة للعملاء
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">بيانات العميل</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">الاسم</p>
                  <p className="text-white">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">الجوال</p>
                  <p className="text-white" dir="ltr">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">تاريخ التسجيل</p>
                  <p className="text-white">{selectedCustomer.createdAt}</p>
                </div>
              </div>
            </div>

            {/* Vehicles */}
            <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-[#d4a853]" />
                السيارات
              </h2>
              <div className="space-y-3">
                {selectedCustomer.vehicles.map((v, idx) => (
                  <div key={idx} className="bg-[#1a2332] rounded-lg p-3">
                    <p className="text-white font-medium">{v.make} {v.model}</p>
                    <p className="text-gray-400 text-sm">{v.year} - {v.plateNumber}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking History */}
          <div className="lg:col-span-2">
            <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#d4a853]" />
                سجل الحجوزات
              </h2>
              <div className="space-y-3">
                {customerBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(booking => (
                  <div key={booking.id} className="bg-[#1a2332] rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[#d4a853] font-medium text-sm">{booking.bookingNumber}</p>
                      <p className="text-white">{booking.serviceName}</p>
                      <p className="text-gray-400 text-sm">{booking.vehicle.make} {booking.vehicle.model}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm">{booking.date}</p>
                      <p className="text-gray-400 text-sm">{booking.time}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                        booking.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                        booking.status === 'NEW' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {booking.status === 'NEW' ? 'جديد' : booking.status === 'CONFIRMED' ? 'مؤكد' : booking.status === 'COMPLETED' ? 'مكتمل' : booking.status}
                      </span>
                    </div>
                  </div>
                ))}
                {customerBookings.length === 0 && (
                  <p className="text-gray-400 text-center py-4">لا توجد حجوزات</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">العملاء</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالاسم أو رقم الجوال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111827] border border-[#243044] rounded-lg pr-10 pl-4 py-2.5 text-white placeholder-gray-500 focus:border-[#d4a853] focus:outline-none max-w-md"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-[#111827] border border-[#243044] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a2332]">
              <tr>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">الاسم</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">الجوال</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">عدد الحجوزات</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 hidden lg:table-cell">آخر حجز</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 hidden lg:table-cell">الحجز القادم</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => {
                const stats = getCustomerStats(customer.phone);
                return (
                  <tr key={customer.id} className="border-t border-[#243044] hover:bg-[#1a2332]/50">
                    <td className="px-4 py-3 text-sm text-white font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300" dir="ltr">{customer.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 hidden md:table-cell">{stats.total}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 hidden lg:table-cell">{stats.lastBooking?.date || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 hidden lg:table-cell">{stats.upcoming?.date || '-'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-xs text-[#d4a853] hover:text-[#c9952c] font-medium"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">لا يوجد عملاء</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
