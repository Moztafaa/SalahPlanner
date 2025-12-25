import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Task, UpdateTaskDto, PrayerTimeSlot, PrayerTimeSlotLabels } from '../types';
import { taskApi } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

interface DailyReviewModalProps {
  visible: boolean;
  tasks: Task[];
  onClose: () => void;
}

export default function DailyReviewModal({ visible, tasks, onClose }: DailyReviewModalProps) {
  const queryClient = useQueryClient();
  const [localTasks, setLocalTasks] = React.useState<Task[]>(tasks);

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskDto }) =>
      taskApi.updateTask(id, updates),
    onSuccess: (_, variables) => {
      setLocalTasks((prev) => prev.filter((t) => t.id !== variables.id));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (localTasks.length <= 1) {
        onClose();
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onSuccess: (_, id) => {
      setLocalTasks((prev) => prev.filter((t) => t.id !== id));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (localTasks.length <= 1) {
        onClose();
      }
    },
  });

  const handleMoveToToday = (task: Task) => {
    const today = new Date();
    updateTaskMutation.mutate({
      id: task.id,
      updates: { taskDate: today, slot: task.slot },
    });
  };

  const handleMoveToBacklog = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { taskDate: null, slot: task.slot },
    });
  };

  const handleDelete = (task: Task) => {
    deleteTaskMutation.mutate(task.id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white w-11/12 rounded-xl p-4 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-amber-900">Daily Review</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#78350f" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 mb-4">
            You have {localTasks.length} incomplete tasks from previous days.
          </Text>

          <FlatList
            data={localTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-amber-50 p-3 rounded-lg mb-2 border border-amber-100">
                <Text className="font-semibold text-amber-900 mb-1">{item.title}</Text>
                <Text className="text-xs text-amber-700 mb-2">
                  {item.taskDate ? new Date(item.taskDate).toLocaleDateString() : 'No Date'} - {PrayerTimeSlotLabels[item.slot]}
                </Text>

                <View className="flex-row justify-end space-x-2">
                  <TouchableOpacity
                    className="bg-green-100 px-3 py-1 rounded-md border border-green-200"
                    onPress={() => handleMoveToToday(item)}
                  >
                    <Text className="text-green-800 text-xs font-medium">Today</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-gray-100 px-3 py-1 rounded-md border border-gray-200"
                    onPress={() => handleMoveToBacklog(item)}
                  >
                    <Text className="text-gray-800 text-xs font-medium">Backlog</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-red-100 px-3 py-1 rounded-md border border-red-200"
                    onPress={() => handleDelete(item)}
                  >
                    <Text className="text-red-800 text-xs font-medium">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <TouchableOpacity
            className="mt-4 bg-amber-100 p-3 rounded-lg items-center"
            onPress={onClose}
          >
            <Text className="text-amber-900 font-semibold">Review Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
