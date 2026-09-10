import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings as SettingsType } from '../../types';
import { Save } from 'lucide-react';

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function SettingsPage() {
  const { settings, updateSettings } = useApp();
  const [formData, setFormData] = useState<SettingsType>({ ...settings });
  const [saved, setSaved] = useState(false);

  const toggleDay = (day: number) => {
    const days = formData.workingDays.includes(day)
      ? formData.workingDays.filter(d => d !== day)
      : [...formData.workingDays, day];
    setFormData({ ...formData, workingDays: days });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">الإعدادات</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Center Info */}
        <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">معلومات المركز</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">اسم المركز</label>
              <input
                type="text"
                value={formData.centerName}
                onChange={(e) => setFormData({...formData, centerName: e.target.value})}
                className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">رقم واتساب</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">العنوان</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">أوقات العمل</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">بداية الدوام</label>
              <input
                type="time"
                value={formData.workingHours.start}
                onChange={(e) => setFormData({...formData, workingHours: {...formData.workingHours, start: e.target.value}})}
                className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">نهاية الدوام</label>
              <input
                type="time"
                value={formData.workingHours.end}
                onChange={(e) => setFormData({...formData, workingHours: {...formData.workingHours, end: e.target.value}})}
                className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
                dir="ltr"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm text-gray-400 mb-3">أيام العمل</label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.workingDays.includes(idx)
                      ? 'bg-[#d4a853] text-[#0a0f1a]'
                      : 'bg-[#1a2332] text-gray-400 border border-[#243044]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="bg-[#111827] border border-[#243044] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">إعدادات الحجز</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">مدة الحجز (دقيقة)</label>
              <select
                value={formData.slotDuration}
                onChange={(e) => setFormData({...formData, slotDuration: Number(e.target.value)})}
                className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
              >
                <option value={15}>15 دقيقة</option>
                <option value={30}>30 دقيقة</option>
                <option value={45}>45 دقيقة</option>
                <option value={60}>60 دقيقة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">سعة كل موعد</label>
              <select
                value={formData.slotCapacity}
                onChange={(e) => setFormData({...formData, slotCapacity: Number(e.target.value)})}
                className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
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
