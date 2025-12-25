import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { prayerTimeApi } from '../services/api';
import { PrayerTimesDto } from '../types';
import { useAuth } from './AuthContext';

export interface LocationSettings {
  city: string;
  country: string;
  calculationMethod: number;
  latitude?: number;
  longitude?: number;
  isAuto: boolean;
}

interface PrayerTimesContextType {
  todayPrayerTimes: PrayerTimesDto | null;
  locationSettings: LocationSettings | null;
  isLoading: boolean;
  refreshPrayerTimes: () => Promise<void>;
}

const PrayerTimesContext = createContext<PrayerTimesContextType | undefined>(undefined);

export function PrayerTimesProvider({ children }: { children: ReactNode }) {
  const [todayPrayerTimes, setTodayPrayerTimes] = useState<PrayerTimesDto | null>(null);
  const [locationSettings, setLocationSettings] = useState<LocationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchPrayerTimes = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);

      // Get settings from SecureStore
      const isAutoStr = await SecureStore.getItemAsync('is_auto_location');
      const isAuto = isAutoStr === 'true';
      const city = await SecureStore.getItemAsync('default_city') || "Cairo";
      const country = await SecureStore.getItemAsync('default_country') || "Egypt";
      const methodStr = await SecureStore.getItemAsync('calculation_method');
      const calculationMethod = methodStr ? parseInt(methodStr) : 5;

      let lat: number | undefined;
      let long: number | undefined;

      if (isAuto) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          lat = location.coords.latitude;
          long = location.coords.longitude;
        }
      }

      const settings: LocationSettings = {
        city,
        country,
        calculationMethod,
        latitude: lat,
        longitude: long,
        isAuto
      };
      setLocationSettings(settings);

      // Fetch for today
      const data = await prayerTimeApi.getTodayPrayerTimes(city, country, calculationMethod, lat, long);
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
        setLocationSettings(null);
    }
  }, [isAuthenticated]);

  return (
    <PrayerTimesContext.Provider value={{ todayPrayerTimes, locationSettings, isLoading, refreshPrayerTimes: fetchPrayerTimes }}>
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
