import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Booking, Customer, Service, Settings } from '../types';
import * as store from '../store';
import { defaultSettings } from '../data/seed';

interface AppContextType {
  bookings: Booking[];
  customers: Customer[];
  services: Service[];
  settings: Settings;
  refreshData: () => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (booking: Booking) => void;
  addService: (service: Service) => void;
  updateService: (service: Service) => void;
  deleteService: (id: string) => void;
  updateSettings: (settings: Settings) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const refreshData = useCallback(() => {
    setBookings(store.getBookings());
    setCustomers(store.getCustomers());
    setServices(store.getServices());
    setSettings(store.getSettings());
  }, []);

  useEffect(() => {
    store.initializeStore();
    refreshData();
  }, [refreshData]);

  const addBooking = (booking: Booking) => {
    store.addBooking(booking);
    refreshData();
  };

  const updateBooking = (booking: Booking) => {
    store.updateBooking(booking);
    refreshData();
  };

  const addService = (service: Service) => {
    store.addService(service);
    refreshData();
  };

  const updateService = (service: Service) => {
    store.updateService(service);
    refreshData();
  };

  const deleteService = (id: string) => {
    store.deleteService(id);
    refreshData();
  };

  const updateSettings = (newSettings: Settings) => {
    store.updateSettings(newSettings);
    refreshData();
  };

  return (
    <AppContext.Provider value={{
      bookings, customers, services, settings, refreshData,
      addBooking, updateBooking, addService, updateService, deleteService, updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
