import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ClipboardList, Users, Wrench,
  Settings, Menu, X, Clock
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'الحجوزات', icon: ClipboardList },
  { to: '/admin/calendar', label: 'التقويم', icon: Calendar },
  { to: '/admin/customers', label: 'العملاء', icon: Users },
  { to: '/admin/services', label: 'الخدمات', icon: Wrench },
  { to: '/admin/schedule', label: 'إعدادات المواعيد', icon: Clock },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-[#111827] border-l border-[#243044] transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-[#243044]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm font-bold text-[#d4a853]">مراكز سعود</h1>
                <p className="text-xs text-gray-400">التخصصي لصيانة السيارات</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#d4a853]/10 text-[#d4a853]'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a2332]'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-[#111827] border-b border-[#243044] px-4 py-3 flex items-center justify-between lg:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">مرحباً، مدير النظام</span>
            <div className="w-8 h-8 bg-[#d4a853] rounded-full flex items-center justify-center text-[#0a0f1a] font-bold text-sm">
              م
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
