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
    <View className="flex-row">
      {onEdit && (
        <TouchableOpacity
          className="bg-blue-500 justify-center items-center px-6 rounded-r-xl ml-2"
          onPress={() => onEdit(task)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={24} color="white" />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        className="bg-red-500 justify-center items-center px-6 rounded-r-xl ml-2"
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <View className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm">
        {/* Checkbox */}
        <TouchableOpacity
          onPress={handleToggle}
          className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
            task.isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
          }`}
          activeOpacity={0.7}
        >
          {task.isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
        </TouchableOpacity>

        {/* Task Content */}
        <View className="flex-1">
          <Text
            className={`text-base font-medium ${
              task.isCompleted ? 'text-gray-400 line-through' : 'text-text-primary'
            }`}
          >
            {task.title}
          </Text>
          {task.description && (
            <Text
              className={`text-sm mt-1 ${
                task.isCompleted ? 'text-gray-300' : 'text-text-secondary'
              }`}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}
        </View>

        {/* Arrow Indicator */}
        <Ionicons name="chevron-back" size={20} color="#d1d5db" />
      </View>
    </Swipeable>
  );
}
