import React from 'react';
import { View, Text } from 'react-native';

interface SlotHeaderProps {
  title: string;
  taskCount: number;
  isActive: boolean;
  duration?: string | null;
}

export default function SlotHeader({ title, taskCount, isActive, duration }: SlotHeaderProps) {
  return (
    <View className="bg-background-light dark:bg-background-dark px-4 py-3 flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
      <View className="flex-row items-center gap-2">
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
