import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Switch,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates'; // We might need to install this or handle it gracefully
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../src/contexts/AuthContext';
import { authApi, handleApiError } from '../../src/services/api';
import { CalculationMethod, CalculationMethodLabels, UserSettingsDto } from '../../src/types';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotifications } from '../../src/contexts/NotificationContext';
import { usePrayerTimes } from '../../src/contexts/PrayerTimesContext';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isEnabled: notificationsEnabled, toggleNotifications } = useNotifications();
  const { refreshPrayerTimes } = usePrayerTimes();
  const router = useRouter();

  const [defaultCity, setDefaultCity] = useState('Cairo');
  const [defaultCountry, setDefaultCountry] = useState('Egypt');
  const [isAutoLocation, setIsAutoLocation] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>(
    CalculationMethod.EgyptianGeneralAuthorityOfSurvey
  );
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const city = await SecureStore.getItemAsync('default_city');
      const country = await SecureStore.getItemAsync('default_country');
      const method = await SecureStore.getItemAsync('calculation_method');
      const auto = await SecureStore.getItemAsync('is_auto_location');

      if (city) setDefaultCity(city);
      if (country) setDefaultCountry(country);
      if (method) setCalculationMethod(parseInt(method));
      if (auto) setIsAutoLocation(auto === 'true');
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const toggleLanguage = async () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    const isRTL = newLang === 'ar';

    await i18n.changeLanguage(newLang);

    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);

      Alert.alert(
        t('settings.language'),
        t('common.restartApp'),
        [
          {
            text: t('common.ok'),
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch (e) {
                // Fallback if Updates not available
              }
            },
          },
        ]
      );
    }
  };

  const handleSaveSettings = async () => {
    if (!isAutoLocation && (!defaultCity.trim() || !defaultCountry.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    setSaving(true);
    try {
      const settings: UserSettingsDto = {
        defaultCity: defaultCity.trim(),
        defaultCountry: defaultCountry.trim(),
        calculationMethod,
        isAutoLocation,
      };

      await authApi.updateSettings(settings);

      // Save to SecureStore
      await SecureStore.setItemAsync('default_city', defaultCity.trim());
      await SecureStore.setItemAsync('default_country', defaultCountry.trim());
      await SecureStore.setItemAsync('calculation_method', calculationMethod.toString());
      await SecureStore.setItemAsync('is_auto_location', String(isAutoLocation));

      // Refresh prayer times with new settings
      await refreshPrayerTimes();

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Settings updated successfully!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: handleApiError(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              await logout();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            onPress: async () => {
              await logout();
            },
          },
        ]
      );
    }
  };

  const calculationMethods = [
    CalculationMethod.ShiaIthnaAshari,
    CalculationMethod.UniversityOfIslamicSciencesKarachi,
    CalculationMethod.IslamicSocietyOfNorthAmerica,
    CalculationMethod.MuslimWorldLeague,
    CalculationMethod.UmmAlQuraUniversityMakkah,
    CalculationMethod.EgyptianGeneralAuthorityOfSurvey,
    CalculationMethod.GulfRegion,
    CalculationMethod.Kuwait,
    CalculationMethod.Qatar,
    CalculationMethod.JAKIM,
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold">Settings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View className="bg-white dark:bg-gray-800 mx-4 mt-4 p-6 rounded-xl shadow-sm">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 bg-primary-500 rounded-full items-center justify-center me-4">
              <Text className="text-white text-2xl font-bold">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-bold text-lg">{user?.fullName}</Text>
              <Text className="text-gray-600 dark:text-gray-300 text-sm">{user?.email}</Text>
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">@{user?.userName}</Text>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View className="bg-white dark:bg-gray-800 mx-4 mt-4 p-6 rounded-xl shadow-sm">
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">Appearance</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={24} color={theme === 'dark' ? '#a78bfa' : '#f59e0b'} />
              <Text className="text-gray-900 dark:text-white font-medium ms-3">Dark Mode</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d1d5db', true: '#22c55e' }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
            />
          </View>
        </View>

        {/* Language Section */}
        <View className="bg-white dark:bg-gray-800 mx-4 mt-4 p-6 rounded-xl shadow-sm">
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">{t('settings.language')}</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="language" size={24} color={theme === 'dark' ? '#a78bfa' : '#f59e0b'} />
              <Text className="text-gray-900 dark:text-white font-medium ms-3">
                {i18n.language === 'ar' ? 'العربية' : 'English'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleLanguage}
              className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg"
            >
              <Text className="text-primary-600 dark:text-primary-400 font-medium">
                {i18n.language === 'ar' ? 'Switch to English' : 'تغيير للعربية'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="bg-white dark:bg-gray-800 mx-4 mt-4 p-6 rounded-xl shadow-sm">
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">Notifications</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 me-4">
              <Ionicons name="notifications" size={24} color={theme === 'dark' ? '#a78bfa' : '#f59e0b'} />
              <View className="ms-3">
                <Text className="text-gray-900 dark:text-white font-medium">Incomplete Tasks</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Remind me when a prayer slot ends if I have unfinished tasks
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#d1d5db', true: '#22c55e' }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
            />
          </View>
        </View>

        {/* Location Settings */}
        <View className="bg-white dark:bg-gray-800 mx-4 mt-4 p-6 rounded-xl shadow-sm">
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">Location Settings</Text>

          {/* Auto-detect Location */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons name="navigate" size={24} color={theme === 'dark' ? '#a78bfa' : '#f59e0b'} />
              <Text className="text-gray-900 dark:text-white font-medium ms-3">Auto-detect Location</Text>
            </View>
            <Switch
              value={isAutoLocation}
              onValueChange={setIsAutoLocation}
              trackColor={{ false: '#d1d5db', true: '#22c55e' }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
            />
          </View>

          {/* Default City */}
          {!isAutoLocation && (
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white font-medium mb-2">Default City</Text>
              <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                <Ionicons name="location-outline" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ms-3 text-gray-900 dark:text-white"
                  placeholder="Enter your city"
                  placeholderTextColor="#9ca3af"
                  value={defaultCity}
                  onChangeText={setDefaultCity}
                />
              </View>
            </View>
          )}

          {/* Default Country */}
          {!isAutoLocation && (
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white font-medium mb-2">Default Country</Text>
              <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                <Ionicons name="globe-outline" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 dark:text-white"
                  placeholder="Enter your country"
                  placeholderTextColor="#9ca3af"
                  value={defaultCountry}
                  onChangeText={setDefaultCountry}
                />
              </View>
            </View>
          )}

          {/* Calculation Method */}
          <View className="mb-4">
            <Text className="text-gray-900 dark:text-white font-medium mb-2">Calculation Method</Text>
            <TouchableOpacity
              className="flex-row items-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3"
              onPress={() => setShowMethodPicker(!showMethodPicker)}
            >
              <Ionicons name="calculator-outline" size={20} color="#9ca3af" />
              <Text className="ml-3 text-gray-900 dark:text-white flex-1">
                {CalculationMethodLabels[calculationMethod]}
              </Text>
              <Ionicons
                name={showMethodPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>

            {showMethodPicker && (
              <View className="mt-2 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden max-h-64">
                <ScrollView nestedScrollEnabled={true}>
                  {calculationMethods.map((method) => (
                    <TouchableOpacity
                      key={method}
                      className={`px-4 py-3 border-b border-gray-200 dark:border-gray-600 ${
                        calculationMethod === method ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                      onPress={() => {
                        setCalculationMethod(method);
                        setShowMethodPicker(false);
                      }}
                    >
                      <Text
                        className={`${
                          calculationMethod === method
                            ? 'text-primary-600 dark:text-primary-400 font-semibold'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {CalculationMethodLabels[method]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-3 mt-2"
            onPress={handleSaveSettings}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold">
              {saving ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View className="bg-white dark:bg-gray-800 mx-4 mt-4 mb-4 p-6 rounded-xl shadow-sm">
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">Account</Text>

          {/* Logout Button */}
          <TouchableOpacity
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl py-3 flex-row items-center justify-center"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 dark:text-red-400 font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="items-center py-6">
          <Text className="text-gray-400 dark:text-gray-500 text-sm">Salah Planner v1.0.0</Text>
          <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">Made with ❤️ for Muslims</Text>
        </View>

        {/* Bottom spacing for floating nav */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
