import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import BookingPage from './pages/BookingPage';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import BookingsList from './pages/admin/BookingsList';
import BookingDetails from './pages/admin/BookingDetails';
import CalendarPage from './pages/admin/CalendarPage';
import CustomersPage from './pages/admin/CustomersPage';
import ServicesPage from './pages/admin/ServicesPage';
import ScheduleSettingsPage from './pages/admin/ScheduleSettingsPage';
import SettingsPage from './pages/admin/SettingsPage';

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* Customer Booking */}
          <Route path="/" element={<BookingPage />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="bookings" element={<BookingsList />} />
            <Route path="bookings/:id" element={<BookingDetails />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="schedule" element={<ScheduleSettingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
