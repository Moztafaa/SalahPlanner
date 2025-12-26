import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onToggleComplete, onDelete, onEdit }: TaskCardProps) {
  const handleToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleComplete(task.id);
  };

  const handleDelete = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    onDelete(task.id);
  };

  const renderRightActions = () => (
    <View className="flex-row h-full items-center mb-3">
      {onEdit && (
        <TouchableOpacity
          className="bg-blue-500 justify-center items-center w-16 h-full"
          onPress={() => onEdit(task)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={24} color="white" />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        className="bg-red-500 justify-center items-center w-16 h-full rounded-r-xl"
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <View className={`flex-row items-center gap-4 p-4 rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-white/5 mb-3 ${task.isCompleted ? 'opacity-70 bg-gray-50 dark:bg-surface-dark/40' : ''}`}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={handleToggle}
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            task.isCompleted
              ? 'bg-primary border-primary'
              : 'border-gray-300 dark:border-[#3b5443] bg-transparent'
          }`}
          activeOpacity={0.7}
        >
          {task.isCompleted && <Ionicons name="checkmark" size={14} color="#102216" />}
        </TouchableOpacity>

        {/* Task Content */}
        <TouchableOpacity
          className="flex-1 flex-col"
          onPress={() => onEdit && onEdit(task)}
          disabled={!onEdit}
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium leading-normal ${
              task.isCompleted
                ? 'text-slate-500 dark:text-gray-400 line-through decoration-slate-400 dark:decoration-gray-500'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {task.title}
          </Text>
          {task.description && (
            <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              {task.description}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}
