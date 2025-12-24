import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { prayerTimeApi } from '../services/api';
import { PrayerTimesDto } from '../types';
import { useAuth } from './AuthContext';

interface PrayerTimesContextType {
  todayPrayerTimes: PrayerTimesDto | null;
  isLoading: boolean;
  refreshPrayerTimes: () => Promise<void>;
}

const PrayerTimesContext = createContext<PrayerTimesContextType | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const [todayPrayerTimes, setTodayPrayerTimes] = useState<PrayerTimesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // TODO: Get these from user settings or location
  const city = "Cairo";
  const country = "Egypt";
  const calculationMethod = 5; // Egyptian General Authority of Survey

  const fetchPrayerTimes = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      // Fetch for today
      const data = await prayerTimeApi.getTodayPrayerTimes(city, country, calculationMethod);
      setTodayPrayerTimes(data);
    } catch (error) {
      console.error("Error fetching prayer times:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchPrayerTimes();
    } else {
        setTodayPrayerTimes(null);
    }
  }, [isAuthenticated]);

  return (
    <PrayerTimesContext.Provider value={{ todayPrayerTimes, isLoading, refreshPrayerTimes: fetchPrayerTimes }}>
      {children}
    </PrayerTimesContext.Provider>
  );
}

export function usePrayerTimes() {
  const context = useContext(PrayerTimesContext);
  if (!context) {
    throw new Error('usePrayerTimes must be used within PrayerTimesProvider');
  }
  return context;
}
