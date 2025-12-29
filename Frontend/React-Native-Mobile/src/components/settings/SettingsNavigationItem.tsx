import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsNavigationItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBorder?: boolean;
}

/**
 * A settings item that navigates to another screen or opens a modal
 * Features a chevron indicator on the right side
 */
export default function SettingsNavigationItem({
  icon,
  title,
  subtitle,
  onPress,
  showBorder = true,
}: SettingsNavigationItemProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
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
            <Text className="text-text-secondary dark:text-gray-400 text-xs mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme === 'dark' ? '#6b7280' : '#9ca3af'}
      />
    </Pressable>
  );
}
