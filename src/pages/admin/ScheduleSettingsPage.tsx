import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings as SettingsType } from '../../types';
import { Calendar, Plus, X, Save } from 'lucide-react';

export default function ScheduleSettingsPage() {
  const { settings, updateSettings } = useApp();
  const [formData, setFormData] = useState<SettingsType>({ ...settings });
  const [newHoliday, setNewHoliday] = useState('');
  const [newClosedDate, setNewClosedDate] = useState('');
  const [saved, setSaved] = useState(false);

  const addHoliday = () => {
    if (newHoliday && !formData.holidays.includes(newHoliday)) {
      setFormData({ ...formData, holidays: [...formData.holidays, newHoliday] });
      setNewHoliday('');
    }
  };

  const removeHoliday = (date: string) => {
    setFormData({ ...formData, holidays: formData.holidays.filter(d => d !== date) });
  };

  const addClosedDate = () => {
    if (newClosedDate && !formData.closedDates.includes(newClosedDate)) {
      setFormData({ ...formData, closedDates: [...formData.closedDates, newClosedDate] });
      setNewClosedDate('');
    }
  };

  const removeClosedDate = (date: string) => {
    setFormData({ ...formData, closedDates: formData.closedDates.filter(d => d !== date) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">إعدادات المواعيد</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Working Hours Summary */}
        <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#d4a853]" />
            ملخص أوقات العمل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-[#1a2332] rounded-lg p-3">
              <p className="text-gray-400">ساعات العمل</p>
              <p className="text-white font-medium mt-1">{formData.workingHours.start} - {formData.workingHours.end}</p>
            </div>
            <div className="bg-[#1a2332] rounded-lg p-3">
              <p className="text-gray-400">مدة الحجز</p>
              <p className="text-white font-medium mt-1">{formData.slotDuration} دقيقة</p>
            </div>
            <div className="bg-[#1a2332] rounded-lg p-3">
              <p className="text-gray-400">سعة الموعد</p>
              <p className="text-white font-medium mt-1">{formData.slotCapacity} حجز</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            * لتغيير هذه الإعدادات انتقل إلى صفحة الإعدادات
          </p>
        </div>

        {/* Holidays */}
        <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">الإجازات</h2>
          <p className="text-sm text-gray-400 mb-4">أيام الإجازات الرسمية التي لا يعمل فيها المركز</p>

          <div className="flex gap-2 mb-4">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              className="flex-1 bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
              dir="ltr"
            />
            <button
              type="button"
              onClick={addHoliday}
              className="flex items-center gap-1 bg-[#243044] hover:bg-[#374151] text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.holidays.map(date => (
              <div key={date} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm">
                <span dir="ltr">{date}</span>
                <button type="button" onClick={() => removeHoliday(date)} className="hover:text-red-300">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {formData.holidays.length === 0 && (
              <p className="text-gray-500 text-sm">لا توجد إجازات مضافة</p>
            )}
          </div>
        </div>

        {/* Closed Dates */}
        <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">أيام الإغلاق</h2>
          <p className="text-sm text-gray-400 mb-4">أيام محددة يتم إغلاقها (صيانة، ظروف خاصة...)</p>

          <div className="flex gap-2 mb-4">
            <input
              type="date"
              value={newClosedDate}
              onChange={(e) => setNewClosedDate(e.target.value)}
              className="flex-1 bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
              dir="ltr"
            />
            <button
              type="button"
              onClick={addClosedDate}
              className="flex items-center gap-1 bg-[#243044] hover:bg-[#374151] text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.closedDates.map(date => (
              <div key={date} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg text-sm">
                <span dir="ltr">{date}</span>
                <button type="button" onClick={() => removeClosedDate(date)} className="hover:text-yellow-300">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {formData.closedDates.length === 0 && (
              <p className="text-gray-500 text-sm">لا توجد أيام إغلاق</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#d4a853] hover:bg-[#c9952c] text-[#0a0f1a] font-bold px-6 py-3 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            حفظ الإعدادات
          </button>
          {saved && (
            <span className="text-green-400 text-sm">تم الحفظ بنجاح ✓</span>
          )}
        </div>
      </form>
    </div>
  );
}
