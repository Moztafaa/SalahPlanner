import React from 'react';
import { View, Text, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsToggleItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showBorder?: boolean;
}

/**
 * A settings item with a toggle switch
 * Features an icon in an emerald/green background square
 */
export default function SettingsToggleItem({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  showBorder = true,
}: SettingsToggleItemProps) {
  const { theme } = useTheme();

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5 ${
        showBorder ? 'border-b border-gray-100 dark:border-surface-highlight' : ''
      }`}
    >
      <View className="flex-row items-center flex-1 me-3">
        {/* Icon container with emerald background */}
        <View className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 items-center justify-center">
          <Ionicons
            name={icon}
            size={20}
            color={theme === 'dark' ? '#13ec5b' : '#16a34a'}
          />
        </View>
        <View className="ms-3 flex-1">
          <Text className="text-gray-900 dark:text-white font-medium text-base">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-text-secondary dark:text-gray-400 text-xs mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#13ec5b' }}
        thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
        ios_backgroundColor="#d1d5db"
      />
    </View>
  );
}
