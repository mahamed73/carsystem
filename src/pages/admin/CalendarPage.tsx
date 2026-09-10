import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONFIRMED: 'bg-green-500',
  ARRIVED: 'bg-purple-500',
  IN_SERVICE: 'bg-yellow-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const dayNamesShort = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

export default function CalendarPage() {
  const { bookings, settings } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Fill remaining days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr && b.status !== 'CANCELLED');
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getDaySlots = () => {
    const [startH] = settings.workingHours.start.split(':').map(Number);
    const [endH] = settings.workingHours.end.split(':').map(Number);
    const slots: string[] = [];
    for (let h = startH; h < endH; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      if (settings.slotDuration <= 30) {
        slots.push(`${String(h).padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const today = new Date().toISOString().split('T')[0];
  const days = useMemo(() => viewMode === 'month' ? getDaysInMonth(currentDate) : [], [currentDate, viewMode]);
  const weekDays = useMemo(() => viewMode === 'week' ? getWeekDays() : [], [currentDate, viewMode]);
  const daySlots = useMemo(() => viewMode === 'day' ? getDaySlots() : [], [currentDate, viewMode]);

  const monthName = currentDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">التقويم</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#111827] border border-[#243044] rounded-lg overflow-hidden">
            {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode ? 'bg-[#d4a853] text-[#0a0f1a]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode === 'day' ? 'يوم' : mode === 'week' ? 'أسبوع' : 'شهر'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-[#111827] border border-[#243044] rounded-lg hover:bg-[#1a2332]">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-lg font-bold text-white">
          {viewMode === 'month' && monthName}
          {viewMode === 'week' && `الأسبوع - ${weekDays[0]?.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })} إلى ${weekDays[6]?.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}`}
          {viewMode === 'day' && currentDate.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => navigate(1)} className="p-2 bg-[#111827] border border-[#243044] rounded-lg hover:bg-[#1a2332]">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-[#111827] border border-[#243044] rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#243044]">
            {dayNamesShort.map(day => (
              <div key={day} className="text-center text-xs text-gray-400 font-medium py-3">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayBookings = getBookingsForDate(day);
              const isToday = dateStr === today;
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isWorkingDay = settings.workingDays.includes(day.getDay());
              const isHoliday = settings.holidays.includes(dateStr) || settings.closedDates.includes(dateStr);

              return (
                <div
                  key={idx}
                  className={`min-h-[80px] md:min-h-[100px] border-b border-l border-[#243044] p-1 md:p-2 ${
                    !isCurrentMonth ? 'bg-[#0a0f1a]/50' : ''
                  } ${isHoliday ? 'bg-red-900/10' : ''}`}
                >
                  <div className={`text-xs mb-1 ${
                    isToday ? 'bg-[#d4a853] text-[#0a0f1a] rounded-full w-6 h-6 flex items-center justify-center font-bold' :
                    !isCurrentMonth ? 'text-gray-600' :
                    !isWorkingDay ? 'text-gray-500' : 'text-white'
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map(b => (
                      <div key={b.id} className={`${statusColors[b.status]} text-white text-[10px] px-1 py-0.5 rounded truncate`}>
                        {b.time} {b.customer.name.split(' ')[0]}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-gray-400">+{dayBookings.length - 3} أخرى</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-[#111827] border border-[#243044] rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#243044]">
            {weekDays.map((day, idx) => {
              const dateStr = day.toISOString().split('T')[0];
              const isToday = dateStr === today;
              return (
                <div key={idx} className={`text-center py-3 border-l border-[#243044] ${isToday ? 'bg-[#d4a853]/10' : ''}`}>
                  <p className="text-xs text-gray-400">{dayNames[day.getDay()]}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-[#d4a853]' : 'text-white'}`}>{day.getDate()}</p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map((day, idx) => {
              const dayBookings = getBookingsForDate(day);
              return (
                <div key={idx} className="min-h-[300px] border-l border-[#243044] p-2 space-y-1">
                  {dayBookings.map(b => (
                    <div key={b.id} className={`${statusColors[b.status]} text-white text-xs px-2 py-1.5 rounded`}>
                      <p className="font-medium">{b.time}</p>
                      <p className="truncate">{b.customer.name}</p>
                      <p className="text-[10px] opacity-80">{b.serviceName}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-[#111827] border border-[#243044] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#243044]">
            {daySlots.map(slot => {
              const dateStr = currentDate.toISOString().split('T')[0];
              const slotBookings = bookings.filter(b => b.date === dateStr && b.time === slot);
              return (
                <div key={slot} className="flex min-h-[50px]">
                  <div className="w-20 flex-shrink-0 text-sm text-gray-400 py-3 px-4 border-l border-[#243044]">
                    {slot}
                  </div>
                  <div className="flex-1 py-2 px-4 flex flex-wrap gap-2">
                    {slotBookings.map(b => (
                      <div key={b.id} className={`${statusColors[b.status]} text-white text-xs px-3 py-2 rounded-lg`}>
                        <span className="font-medium">{b.customer.name}</span>
                        <span className="mx-2 opacity-60">|</span>
                        <span>{b.serviceName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
