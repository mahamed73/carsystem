import { useApp } from '../context/AppContext';
import { Calendar, MapPin, Phone, Clock } from 'lucide-react';

export default function LandingPage() {
  const { settings } = useApp();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4a853]/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          {/* Logo */}
          <div className="inline-block mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#d4a853] to-[#c9952c] rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-[#d4a853]/20">
              <span className="text-5xl font-black text-[#0a0f1a]">س</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            {settings.centerName}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            خدمة احترافية لصيانة سيارتك - سمكرة، دهان، وصيانة شاملة
          </p>

          {/* CTA Button */}
          <a
            href="#/booking"
            className="inline-flex items-center gap-3 bg-[#d4a853] hover:bg-[#c9952c] text-[#0a0f1a] font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-[#d4a853]/20 hover:shadow-[#d4a853]/30"
          >
            <Calendar className="w-6 h-6" />
            احجز موعدك الآن
          </a>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8">خدماتنا</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111827] border border-[#243044] rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-[#d4a853]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔧</span>
            </div>
            <h3 className="text-white font-bold mb-2">سمكرة</h3>
            <p className="text-gray-400 text-sm">إصلاح هيكل السيارة بإتقان</p>
          </div>
          <div className="bg-[#111827] border border-[#243044] rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-[#d4a853]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-white font-bold mb-2">دهان</h3>
            <p className="text-gray-400 text-sm">دهان احترافي بألوان مطابقة</p>
          </div>
          <div className="bg-[#111827] border border-[#243044] rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-[#d4a853]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-white font-bold mb-2">صيانة</h3>
            <p className="text-gray-400 text-sm">صيانة شاملة للمحرك والأنظمة</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#111827] border border-[#243044] rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#d4a853]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#d4a853]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">أوقات العمل</p>
                <p className="text-white text-sm font-medium">{settings.workingHours.start} - {settings.workingHours.end}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#d4a853]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-[#d4a853]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">اتصل بنا</p>
                <p className="text-white text-sm font-medium" dir="ltr">{settings.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#d4a853]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#d4a853]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">العنوان</p>
                <p className="text-white text-sm font-medium">{settings.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-600 border-t border-[#243044]">
        <p>© {new Date().getFullYear()} {settings.centerName} - جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}
