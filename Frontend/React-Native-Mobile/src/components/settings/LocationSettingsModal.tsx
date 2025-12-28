import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface LocationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  city: string;
  country: string;
  onSave: (city: string, country: string) => void;
}

/**
 * Modal for editing location settings (city and country)
 */
export default function LocationSettingsModal({
  visible,
  onClose,
  city,
  country,
  onSave,
}: LocationSettingsModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [localCity, setLocalCity] = useState(city);
  const [localCountry, setLocalCountry] = useState(country);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalCity(city);
      setLocalCountry(country);
    }
  }, [visible, city, country]);

  const handleSave = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSave(localCity.trim(), localCountry.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        {/* Backdrop */}
        <TouchableOpacity
          className="absolute inset-0 bg-black/50"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <View className="bg-surface-light dark:bg-surface-dark rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-surface-highlight">
            <Text className="text-gray-900 dark:text-white text-lg font-bold">
              {t('settings.location')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-surface-highlight items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="px-6 py-4">
            {/* City Input */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white font-medium mb-2">
                {t('settings.defaultCity')}
              </Text>
              <View className="flex-row items-center bg-gray-50 dark:bg-surface-highlight border border-gray-200 dark:border-surface-highlight rounded-xl px-4 py-3">
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <TextInput
                  className="flex-1 ms-3 text-gray-900 dark:text-white text-base"
                  placeholder={t('settings.enterCity')}
                  placeholderTextColor="#9ca3af"
                  value={localCity}
                  onChangeText={setLocalCity}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Country Input */}
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-white font-medium mb-2">
                {t('settings.defaultCountry')}
              </Text>
              <View className="flex-row items-center bg-gray-50 dark:bg-surface-highlight border border-gray-200 dark:border-surface-highlight rounded-xl px-4 py-3">
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <TextInput
                  className="flex-1 ms-3 text-gray-900 dark:text-white text-base"
                  placeholder={t('settings.enterCountry')}
                  placeholderTextColor="#9ca3af"
                  value={localCountry}
                  onChangeText={setLocalCountry}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!localCity.trim() || !localCountry.trim()}
              className={`py-3.5 rounded-xl items-center ${
                localCity.trim() && localCountry.trim()
                  ? 'bg-primary'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom safe area padding */}
          <View className="h-8" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
