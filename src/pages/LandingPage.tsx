import { useApp } from '../context/AppContext';
import { Calendar } from 'lucide-react';

export default function LandingPage() {
  const { settings } = useApp();

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Logo */}
        <div className="inline-block mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-[#d4a853] to-[#c9952c] rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-[#d4a853]/20">
            <span className="text-5xl font-black text-[#0a0f1a]">س</span>
          </div>
        </div>

        {/* Center Name */}
        <h1 className="text-3xl md:text-5xl font-black text-white mb-12 leading-tight">
          {settings.centerName}
        </h1>

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
  );
}
