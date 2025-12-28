import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrayerTimeSlot } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface SlotHeaderProps {
  title: string;
  taskCount: number;
  isActive: boolean;
  duration?: string | null;
  slot: PrayerTimeSlot;
}

const getSlotIcon = (slot: PrayerTimeSlot): { name: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (slot) {
    case PrayerTimeSlot.BeforeFajr:
      return { name: 'moon-outline', color: '#a78bfa' }; // Purple for pre-dawn
    case PrayerTimeSlot.FajrToShurooq:
      return { name: 'moon-outline', color: '#9db9a6' }; // Sage (Fajr icon)
    case PrayerTimeSlot.ShurooqToDhuhr:
      return { name: 'sunny-outline', color: '#facc15' }; // Yellow for sunrise/morning
    case PrayerTimeSlot.DhuhrToAsr:
      return { name: 'sunny', color: '#fbbf24' }; // Amber for noon
    case PrayerTimeSlot.AsrToMaghrib:
      return { name: 'partly-sunny-outline', color: '#fdba74' }; // Orange for afternoon
    case PrayerTimeSlot.MaghribToIsha:
      return { name: 'cloudy-night-outline', color: '#c084fc' }; // Purple for sunset
    case PrayerTimeSlot.AfterIsha:
      return { name: 'moon', color: '#818cf8' }; // Indigo for night
    default:
      return { name: 'time-outline', color: '#9ca3af' };
  }
};

export default function SlotHeader({ title, taskCount, isActive, duration, slot }: SlotHeaderProps) {
  const { theme } = useTheme();
  const iconInfo = getSlotIcon(slot);

  return (
    <View className="bg-background-light dark:bg-background-dark px-4 py-3 flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
      <View className="flex-row items-center gap-3">
        <View className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 items-center justify-center">
          <Ionicons name={iconInfo.name} size={16} color={iconInfo.color} />
        </View>
        {isActive && (
          <View className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
        <Text className="text-slate-800 dark:text-white text-lg font-bold leading-tight">
          {title}
        </Text>
        {duration && (
          <View className="bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-full ml-2">
            <Text className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {duration}
            </Text>
          </View>
        )}
      </View>
      {taskCount > 0 && (
        <View className="px-2 py-1 rounded bg-primary/10">
          <Text className="text-xs font-medium text-primary-700 dark:text-primary">
            {taskCount} Tasks
          </Text>
        </View>
      )}
    </View>
  );
}
