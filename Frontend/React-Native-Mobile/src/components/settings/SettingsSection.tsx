import React from 'react';
import { View, Text } from 'react-native';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * A reusable settings section wrapper with a header title
 * Used to group related settings items in the settings screen
 */
export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="mx-4 mt-4">
      <Text className="text-text-secondary dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-1">
        {title}
      </Text>
      <View className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
        {children}
      </View>
    </View>
  );
}
