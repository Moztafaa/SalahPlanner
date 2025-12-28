import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface BufferTimeModalProps {
  visible: boolean;
  onClose: () => void;
  value: number;
  onValueChange: (value: number) => void;
}

/**
 * Modal for adjusting the notification buffer time
 * Allows users to set minutes before prayer to receive task notifications
 */
export default function BufferTimeModal({
  visible,
  onClose,
  value,
  onValueChange,
}: BufferTimeModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleIncrement = () => {
    if (value < 60) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onValueChange(value + 5);
    }
  };

  const handleDecrement = () => {
    if (value > 5) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onValueChange(value - 5);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center">
        {/* Backdrop */}
        <TouchableOpacity
          className="absolute inset-0 bg-black/50"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <View className="bg-surface-light dark:bg-surface-dark rounded-3xl mx-8 w-80 overflow-hidden">
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <Text className="text-gray-900 dark:text-white text-lg font-bold text-center">
              {t('settings.bufferTime')}
            </Text>
            <Text className="text-text-secondary dark:text-gray-400 text-sm text-center mt-2">
              {t('settings.bufferTimeDesc')}
            </Text>
          </View>

          {/* Value Selector */}
          <View className="flex-row items-center justify-center py-6">
            <TouchableOpacity
              onPress={handleDecrement}
              disabled={value <= 5}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                value <= 5
                  ? 'bg-gray-100 dark:bg-surface-highlight opacity-50'
                  : 'bg-gray-100 dark:bg-surface-highlight'
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name="remove"
                size={24}
                color={theme === 'dark' ? '#fff' : '#374151'}
              />
            </TouchableOpacity>

            <View className="mx-8 items-center">
              <Text className="text-primary text-5xl font-bold">
                {value}
              </Text>
              <Text className="text-text-secondary dark:text-gray-400 text-sm mt-1">
                {t('settings.minutes')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleIncrement}
              disabled={value >= 60}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                value >= 60
                  ? 'bg-gray-100 dark:bg-surface-highlight opacity-50'
                  : 'bg-gray-100 dark:bg-surface-highlight'
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={24}
                color={theme === 'dark' ? '#fff' : '#374151'}
              />
            </TouchableOpacity>
          </View>

          {/* Done Button */}
          <View className="px-6 pb-6">
            <TouchableOpacity
              onPress={onClose}
              className="bg-primary py-3.5 rounded-xl items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">
                {t('common.done')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
