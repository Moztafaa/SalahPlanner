import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrayerTimesDto } from '../types';
import { format } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface PrayerTimesModalProps {
  visible: boolean;
  onClose: () => void;
  prayerTimes: PrayerTimesDto | null;
  date: Date;
}

export default function PrayerTimesModal({
  visible,
  onClose,
  prayerTimes,
  date,
}: PrayerTimesModalProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isRTL = i18n.language === 'ar';
  const isDark = theme === 'dark';

  if (!prayerTimes) return null;

  const prayers = [
    { key: 'fajr', label: t('home.fajr'), time: prayerTimes.fajr, icon: 'moon-outline' },
    { key: 'sunrise', label: t('home.shurooq'), time: prayerTimes.sunrise, icon: 'sunny-outline' },
    { key: 'dhuhr', label: t('home.dhuhr'), time: prayerTimes.dhuhr, icon: 'sunny' },
    { key: 'asr', label: t('home.asr'), time: prayerTimes.asr, icon: 'partly-sunny-outline' },
    { key: 'maghrib', label: t('home.maghrib'), time: prayerTimes.maghrib, icon: 'cloud-sunset-outline' },
    { key: 'isha', label: t('home.isha'), time: prayerTimes.isha, icon: 'moon' },
  ];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <TouchableWithoutFeedback>
            <View className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-5 shadow-xl">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                <View>
                  <Text className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('home.prayerTimes')}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {format(date, 'EEEE, d MMMM', { locale: isRTL ? ar : enUS })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
                  accessibilityLabel={t('common.close')}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={isDark ? '#9ca3af' : '#4b5563'}
                  />
                </TouchableOpacity>
              </View>

              {/* Prayer List */}
              <View className="space-y-3">
                {prayers.map((prayer, index) => (
                  <View
                    key={prayer.key}
                    className={`flex-row items-center justify-between p-3 rounded-xl ${
                      index % 2 === 0
                        ? 'bg-gray-50 dark:bg-gray-700/50'
                        : 'bg-transparent'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
                        <Ionicons
                          name={prayer.icon as any}
                          size={16}
                          color={isDark ? '#fbbf24' : '#d97706'} // Amber-500/600ish
                        />
                      </View>
                      <Text className="font-medium text-gray-700 dark:text-gray-200 text-base">
                        {prayer.label}
                      </Text>
                    </View>
                    <Text className="font-bold text-gray-900 dark:text-white text-lg font-mono">
                      {prayer.time}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
