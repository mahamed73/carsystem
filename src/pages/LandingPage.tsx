import { useApp } from '../context/AppContext';
import { Calendar, Shield } from 'lucide-react';

export default function LandingPage() {
  const { settings } = useApp();

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#d4a853] to-[#c9952c] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <span className="text-4xl font-black text-[#0a0f1a]">س</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">
            {settings.centerName}
          </h1>
          <p className="text-gray-400 text-lg">نظام حجز وإدارة المواعيد</p>
        </div>

        {/* Two Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Customer Booking */}
          <a
            href="#/booking"
            className="group bg-[#111827] border border-[#243044] hover:border-[#d4a853] rounded-2xl p-8 transition-all hover:shadow-2xl hover:shadow-[#d4a853]/10"
          >
            <div className="w-16 h-16 bg-[#d4a853]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#d4a853]/20 transition-colors">
              <Calendar className="w-8 h-8 text-[#d4a853]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">حجز موعد</h2>
            <p className="text-gray-400 mb-6">
              احجز موعد صيانة سيارتك بسهولة وسرعة عبر الإنترنت
            </p>
            <div className="flex items-center gap-2 text-[#d4a853] font-medium group-hover:gap-3 transition-all">
              <span>ابدأ الحجز الآن</span>
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* Admin Dashboard */}
          <a
            href="#/admin"
            className="group bg-[#111827] border border-[#243044] hover:border-[#d4a853] rounded-2xl p-8 transition-all hover:shadow-2xl hover:shadow-[#d4a853]/10"
          >
            <div className="w-16 h-16 bg-[#d4a853]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#d4a853]/20 transition-colors">
              <Shield className="w-8 h-8 text-[#d4a853]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">لوحة التحكم</h2>
            <p className="text-gray-400 mb-6">
              إدارة الحجوزات والمواعيد والعملاء (للإدارة فقط)
            </p>
            <div className="flex items-center gap-2 text-[#d4a853] font-medium group-hover:gap-3 transition-all">
              <span>دخول الإدارة</span>
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>{settings.address}</p>
          <p className="mt-2" dir="ltr">{settings.phone}</p>
        </div>
      </div>
    </div>
  );
}
