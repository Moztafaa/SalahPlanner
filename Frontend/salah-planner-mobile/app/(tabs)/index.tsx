import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, prayerTimeApi, handleApiError } from '../../src/services/api';
import { PrayerTimeSlot, PrayerTimeSlotLabels, Task, CreateTaskDto } from '../../src/types';
import TaskCard from '../../src/components/TaskCard';
import AddTaskModal from '../../src/components/AddTaskModal';
import Toast from 'react-native-toast-message';
import { format, differenceInSeconds } from 'date-fns';

export default function DashboardScreen() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [defaultSlot, setDefaultSlot] = useState<PrayerTimeSlot>(PrayerTimeSlot.BeforeFajr);
  const [countdown, setCountdown] = useState('');

  // Fetch tasks for selected date
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => taskApi.getTasksByDate(selectedDate),
  });

  // Fetch prayer times (using default settings for now)
  const { data: prayerTimes, isLoading: prayerTimesLoading } = useQuery({
    queryKey: ['prayerTimes', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () =>
      prayerTimeApi.getTodayPrayerTimes('Cairo', 'Egypt', 5), // TODO: Get from user settings
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

  // Calculate next prayer countdown
  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      const now = new Date();
      const times = [
        { name: 'Fajr', time: prayerTimes.fajr },
        { name: 'Dhuhr', time: prayerTimes.dhuhr },
        { name: 'Asr', time: prayerTimes.asr },
        { name: 'Maghrib', time: prayerTimes.maghrib },
        { name: 'Isha', time: prayerTimes.isha },
      ];

      for (const prayer of times) {
        const [hours, minutes] = prayer.time.split(':');
        const prayerDate = new Date(now);
        prayerDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (prayerDate > now) {
          const seconds = differenceInSeconds(prayerDate, now);
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = seconds % 60;
          setCountdown(`${prayer.name} in ${h}h ${m}m ${s}s`);
          return;
        }
      }

      setCountdown('All prayers completed for today');
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

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

  return (
    <SafeAreaView className="flex-1 bg-background-gray" edges={['top']}>
      {/* Header */}
      <View className="bg-primary-500 px-6 py-4 rounded-b-3xl">
        <Text className="text-white text-3xl font-bold">Salah Planner</Text>
        <Text className="text-white/90 text-sm mt-1">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>

        {/* Prayer Countdown */}
        {prayerTimes && (
          <View className="bg-white/20 rounded-xl px-4 py-3 mt-4">
            <Text className="text-white font-semibold text-center">
              {countdown || 'Loading...'}
            </Text>
          </View>
        )}
      </View>

      {/* Tasks List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tasksLoading || prayerTimesLoading}
            onRefresh={refetchTasks}
            tintColor="#22c55e"
          />
        }
      >
        {tasksLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          slotOptions.map((slot) => (
            <View key={slot} className="mb-6">
              {/* Slot Header */}
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-text-primary font-bold text-lg">
                    {PrayerTimeSlotLabels[slot]}
                  </Text>
                  <Text className="text-text-tertiary text-sm">
                    {groupedTasks[slot]?.length || 0} tasks
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-primary-500 rounded-full w-8 h-8 items-center justify-center"
                  onPress={() => handleOpenAddModal(slot)}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Tasks */}
              {groupedTasks[slot]?.length > 0 ? (
                groupedTasks[slot].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={toggleTaskMutation.mutate}
                    onDelete={deleteTaskMutation.mutate}
                  />
                ))
              ) : (
                <View className="bg-white rounded-xl p-6 items-center">
                  <Ionicons name="checkbox-outline" size={40} color="#d1d5db" />
                  <Text className="text-text-tertiary mt-2">No tasks yet</Text>
                </View>
              )}
            </View>
          ))
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
