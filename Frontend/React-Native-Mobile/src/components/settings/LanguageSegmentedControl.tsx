import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface LanguageSegmentedControlProps {
  value: 'en' | 'ar';
  onChange: (value: 'en' | 'ar') => void;
}

/**
 * A segmented control for switching between English and Arabic languages
 * Styled with the new design's emerald accent color
 */
export default function LanguageSegmentedControl({
  value,
  onChange,
}: LanguageSegmentedControlProps) {
  const handlePress = (lang: 'en' | 'ar') => {
    if (lang !== value) {
      onChange(lang);
    }
  };

  return (
    <View className="flex-row bg-gray-100 dark:bg-surface-highlight rounded-xl p-1">
      <TouchableOpacity
        onPress={() => handlePress('en')}
        activeOpacity={0.7}
        className={`flex-1 py-2 px-4 rounded-lg items-center justify-center ${
          value === 'en' ? 'bg-white dark:bg-surface-dark shadow-sm' : ''
        }`}
      >
        <Text
          className={`font-medium ${
            value === 'en'
              ? 'text-primary dark:text-primary'
              : 'text-text-secondary dark:text-gray-400'
          }`}
        >
          English
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handlePress('ar')}
        activeOpacity={0.7}
        className={`flex-1 py-2 px-4 rounded-lg items-center justify-center ${
          value === 'ar' ? 'bg-white dark:bg-surface-dark shadow-sm' : ''
        }`}
      >
        <Text
          className={`font-medium ${
            value === 'ar'
              ? 'text-primary dark:text-primary'
              : 'text-text-secondary dark:text-gray-400'
          }`}
        >
          العربية
        </Text>
      </TouchableOpacity>
    </View>
  );
}
