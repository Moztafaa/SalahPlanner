import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, handleApiError } from '../../src/services/api';
import { PrayerTimeSlot, PrayerTimeSlotLabels, Task, CreateTaskDto } from '../../src/types';
import TaskCard from '../../src/components/TaskCard';
import AddTaskModal from '../../src/components/AddTaskModal';
import Toast from 'react-native-toast-message';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { useSelectedDate } from '../../src/contexts/DateContext';

export default function CalendarScreen() {
  const queryClient = useQueryClient();
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [defaultSlot, setDefaultSlot] = useState<PrayerTimeSlot>(PrayerTimeSlot.BeforeFajr);

  // Fetch tasks for selected date
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => taskApi.getTasksByDate(selectedDate),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (task: CreateTaskDto) => taskApi.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Task created successfully!',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: handleApiError(error),
      });
    },
  });

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.toggleTaskComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: handleApiError(error),
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: 'Task deleted successfully!',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: handleApiError(error),
      });
    },
  });

  // Group tasks by prayer time slot
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.slot]) {
      acc[task.slot] = [];
    }
    acc[task.slot].push(task);
    return acc;
  }, {} as Record<PrayerTimeSlot, Task[]>);

  // Generate week dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleAddTask = async (task: CreateTaskDto) => {
    await createTaskMutation.mutateAsync(task);
  };

  const handleOpenAddModal = (slot: PrayerTimeSlot) => {
    setDefaultSlot(slot);
    setShowAddModal(true);
  };

  const slotOptions = Object.values(PrayerTimeSlot).filter(
    (v) => typeof v === 'number'
  ) as PrayerTimeSlot[];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-background-gray" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-text-primary text-2xl font-bold">Calendar</Text>
      </View>

      {/* Week Navigation */}
      <View className="bg-white px-6 py-4 flex-row justify-between items-center border-b border-gray-200">
        <TouchableOpacity onPress={handlePreviousWeek} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleToday} activeOpacity={0.7}>
          <Text className="text-text-primary font-semibold text-lg">
            {format(selectedDate, 'MMMM yyyy')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextWeek} className="p-2">
          <Ionicons name="chevron-forward" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white px-4 py-2">
        {weekDates.map((date) => {
          const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <TouchableOpacity
              key={date.toISOString()}
              onPress={() => setSelectedDate(date)}
              className={`items-center justify-center mx-2 px-3 py-2 rounded-xl ${
                isSelected ? 'bg-primary-500' : 'bg-gray-50'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-medium mb-1 ${
                  isSelected ? 'text-white' : 'text-text-tertiary'
                }`}
              >
                {format(date, 'EEE')}
              </Text>
              <Text
                className={`text-lg font-bold ${
                  isSelected ? 'text-white' : isToday ? 'text-primary-500' : 'text-text-primary'
                }`}
              >
                {format(date, 'd')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task Stats */}
      <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-text-secondary text-sm">
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <Text className="text-text-secondary text-sm">
            {completedTasks}/{totalTasks} tasks
          </Text>
        </View>
        <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <View
            className="bg-primary-500 h-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </View>
      </View>

      {/* Tasks List */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {tasksLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          slotOptions.map((slot) => {
            const slotTasks = groupedTasks[slot] || [];
            if (slotTasks.length === 0) return null;

            return (
              <View key={slot} className="mb-6">
                {/* Slot Header */}
                <View className="flex-row justify-between items-center mb-3">
                  <View>
                    <Text className="text-text-primary font-bold text-lg">
                      {PrayerTimeSlotLabels[slot]}
                    </Text>
                    <Text className="text-text-tertiary text-sm">{slotTasks.length} tasks</Text>
                  </View>
                  <TouchableOpacity
                    className="bg-primary-500 rounded-full w-8 h-8 items-center justify-center"
                    onPress={() => handleOpenAddModal(slot)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Tasks */}
                {slotTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={toggleTaskMutation.mutate}
                    onDelete={deleteTaskMutation.mutate}
                  />
                ))}
              </View>
            );
          })
        )}

        {!tasksLoading && tasks.length === 0 && (
          <View className="items-center justify-center py-20">
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text className="text-text-tertiary text-lg mt-4">No tasks for this day</Text>
            <TouchableOpacity
              className="bg-primary-500 px-6 py-3 rounded-xl mt-6"
              onPress={() => handleOpenAddModal(PrayerTimeSlot.BeforeFajr)}
            >
              <Text className="text-white font-semibold">Add Your First Task</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing for floating nav */}
        <View className="h-24" />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        className="absolute bottom-28 right-6 bg-primary-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => handleOpenAddModal(PrayerTimeSlot.BeforeFajr)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTask}
        defaultSlot={defaultSlot}
        defaultDate={selectedDate}
      />
    </SafeAreaView>
  );
}
