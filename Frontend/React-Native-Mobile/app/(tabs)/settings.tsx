import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { authApi, handleApiError } from '../../src/services/api';
import { CalculationMethod, CalculationMethodLabels, UserSettingsDto } from '../../src/types';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotifications } from '../../src/contexts/NotificationContext';
import { usePrayerTimes } from '../../src/contexts/PrayerTimesContext';
import {
  SettingsSection,
  SettingsToggleItem,
  SettingsNavigationItem,
  LanguageSegmentedControl,
  CalculationMethodModal,
  BufferTimeModal,
  LocationSettingsModal,
} from '../../src/components/settings';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isEnabled: notificationsEnabled, toggleNotifications, bufferMinutes, setBufferMinutes } = useNotifications();
  const { refreshPrayerTimes } = usePrayerTimes();

  const [defaultCity, setDefaultCity] = useState('Cairo');
  const [defaultCountry, setDefaultCountry] = useState('Egypt');
  const [isAutoLocation, setIsAutoLocation] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>(
    CalculationMethod.EgyptianGeneralAuthorityOfSurvey
  );
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showBufferModal, setShowBufferModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const city = await SecureStore.getItemAsync('default_city');
      const country = await SecureStore.getItemAsync('default_country');
      const method = await SecureStore.getItemAsync('calculation_method');
      const auto = await SecureStore.getItemAsync('is_auto_location');
      const format = await SecureStore.getItemAsync('time_format');

      if (city) setDefaultCity(city);
      if (country) setDefaultCountry(country);
      if (method) setCalculationMethod(parseInt(method));
      if (auto) setIsAutoLocation(auto === 'true');
      if (format) setTimeFormat(format as '12h' | '24h');
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const handleLanguageChange = async (lang: 'en' | 'ar') => {
    // Don't do anything if selecting the same language
    if (lang === i18n.language) return;

    const isRTL = lang === 'ar';
    const needsRestart = I18nManager.isRTL !== isRTL;

    // Change language first
    await i18n.changeLanguage(lang);

    // If RTL state needs to change, show restart alert
    if (needsRestart) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);

      // Use setTimeout to ensure we're not in a render cycle
      setTimeout(() => {
        Alert.alert(
          t('settings.language'),
          t('common.restartApp'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // Wrap in try-catch and use setTimeout
                setTimeout(async () => {
                  try {
                    await Updates.reloadAsync();
                  } catch (e) {
                    // Fallback if Updates not available
                    console.log('Could not reload app:', e);
                  }
                }, 100);
              },
            },
          ]
        );
      }, 100);
    }
  };

  const handleCalculationMethodChange = async (method: CalculationMethod) => {
    setCalculationMethod(method);
    // Auto-save when calculation method changes
    try {
      await SecureStore.setItemAsync('calculation_method', method.toString());
      await refreshPrayerTimes();
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('settings.updateSuccess'),
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: handleApiError(error),
      });
    }
  };

  const handleTimeFormatToggle = async (value: boolean) => {
    const newFormat = value ? '24h' : '12h';
    setTimeFormat(newFormat);
    await SecureStore.setItemAsync('time_format', newFormat);
  };

  const handleLocationSave = async (city: string, country: string, isAuto: boolean) => {
    setDefaultCity(city);
    setDefaultCountry(country);
    setIsAutoLocation(isAuto);

    try {
      await SecureStore.setItemAsync('default_city', city);
      await SecureStore.setItemAsync('default_country', country);
      await SecureStore.setItemAsync('is_auto_location', String(isAuto));

      // Also update via API
      const settings: UserSettingsDto = {
        defaultCity: city,
        defaultCountry: country,
        calculationMethod,
        isAutoLocation: isAuto,
      };
      await authApi.updateSettings(settings);
      await refreshPrayerTimes();

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('settings.updateSuccess'),
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: handleApiError(error),
      });
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-100 dark:border-surface-highlight">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold">
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Preferences Section */}
        <SettingsSection title={t('settings.preferences')}>
          {/* Language */}
          <View className="px-4 py-3.5 border-b border-gray-100 dark:border-surface-highlight">
            <View className="flex-row items-center mb-3">
              <View className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center">
                <Ionicons
                  name="language"
                  size={20}
                  color={theme === 'dark' ? '#13ec5b' : '#16a34a'}
                />
              </View>
              <Text className="text-gray-900 dark:text-white font-medium text-base ms-3">
                {t('settings.language')}
              </Text>
            </View>
            <LanguageSegmentedControl
              value={i18n.language as 'en' | 'ar'}
              onChange={handleLanguageChange}
            />
          </View>

          {/* Dark Mode */}
          <SettingsToggleItem
            icon={theme === 'dark' ? 'moon' : 'sunny'}
            title={t('settings.darkMode')}
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            showBorder={true}
          />

          {/* 24-Hour Format */}
          <SettingsToggleItem
            icon="time"
            title={t('settings.timeFormat24h')}
            value={timeFormat === '24h'}
            onValueChange={handleTimeFormatToggle}
            showBorder={false}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title={t('settings.notifications')}>
          {/* Task Reminders */}
          <SettingsToggleItem
            icon="notifications"
            title={t('settings.incompleteTasks')}
            subtitle={notificationsEnabled ? `${bufferMinutes} ${t('settings.minutesBefore')}` : undefined}
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            showBorder={notificationsEnabled}
          />

          {/* Buffer Time - Only show when notifications enabled */}
          {notificationsEnabled && (
            <SettingsNavigationItem
              icon="timer"
              title={t('settings.bufferTime')}
              subtitle={`${bufferMinutes} ${t('settings.minutes')}`}
              onPress={() => setShowBufferModal(true)}
              showBorder={false}
            />
          )}
        </SettingsSection>

        {/* Location Settings Section */}
        <SettingsSection title={t('settings.locationSettings')}>
          {/* Auto-detect Location */}
          <SettingsToggleItem
            icon="navigate"
            title={t('settings.autoDetectLocation')}
            value={isAutoLocation}
            onValueChange={(value) => handleLocationSave(defaultCity, defaultCountry, value)}
            showBorder={!isAutoLocation}
          />

          {/* Manual Location - Only show when auto-location is off */}
          {!isAutoLocation && (
            <SettingsNavigationItem
              icon="location"
              title={t('settings.location')}
              subtitle={`${defaultCity}, ${defaultCountry}`}
              onPress={() => setShowLocationModal(true)}
              showBorder={false}
            />
          )}
        </SettingsSection>

        {/* Prayer Settings Section */}
        <SettingsSection title={t('settings.prayerSettings')}>
          {/* Calculation Method */}
          <SettingsNavigationItem
            icon="calculator"
            title={t('settings.calculationMethod')}
            subtitle={CalculationMethodLabels[calculationMethod]}
            onPress={() => setShowMethodModal(true)}
            showBorder={false}
          />
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection title={t('settings.account')}>
          {/* User Info */}
          <View className="px-4 py-4 border-b border-gray-100 dark:border-surface-highlight">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-primary rounded-full items-center justify-center">
                <Text className="text-white text-lg font-bold">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View className="ms-3 flex-1">
                <Text className="text-gray-900 dark:text-white font-semibold text-base">
                  {user?.fullName}
                </Text>
                <Text className="text-text-secondary dark:text-gray-400 text-sm">
                  {user?.email}
                </Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="flex-row items-center justify-center py-4"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-semibold ms-2">
              {t('settings.logout')}
            </Text>
          </TouchableOpacity>
        </SettingsSection>

        {/* App Info Footer */}
        <View className="items-center py-8">
          <Text className="text-text-secondary dark:text-gray-500 text-sm font-medium">
            {t('common.appName')} v1.0.0
          </Text>
          <Text className="text-text-tertiary dark:text-gray-600 text-xs mt-1">
            {t('settings.madeWithLove')}
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <CalculationMethodModal
        visible={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        selectedMethod={calculationMethod}
        onSelectMethod={handleCalculationMethodChange}
      />

      <BufferTimeModal
        visible={showBufferModal}
        onClose={() => setShowBufferModal(false)}
        value={bufferMinutes}
        onValueChange={setBufferMinutes}
      />

      <LocationSettingsModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        city={defaultCity}
        country={defaultCountry}
        onSave={(city, country) => handleLocationSave(city, country, isAutoLocation)}
      />
    </SafeAreaView>
  );
}
