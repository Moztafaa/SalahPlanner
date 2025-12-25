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
import { PrayerTimeSlot, PrayerTimeSlotLabels, Task, CreateTaskDto, UpdateTaskDto } from '../../src/types';
import TaskCard from '../../src/components/TaskCard';
import AddTaskModal from '../../src/components/AddTaskModal';
import Toast from 'react-native-toast-message';
import { format, differenceInSeconds } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { useSelectedDate } from '../../src/contexts/DateContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { formatHijriDate } from '../../src/utils/date';
import { usePrayerTimes } from '../../src/contexts/PrayerTimesContext';

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { selectedDate } = useSelectedDate();
  const { theme } = useTheme();
  const { locationSettings, todayPrayerTimes } = usePrayerTimes();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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

  // Fetch prayer times
  const { data: prayerTimes, isLoading: prayerTimesLoading } = useQuery({
    queryKey: ['prayerTimes', format(selectedDate, 'yyyy-MM-dd'), locationSettings],
    queryFn: async () => {
      if (!locationSettings) return null;

      // If selected date is today, use the context data to avoid extra API call
      const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      if (isToday && todayPrayerTimes) {
        return todayPrayerTimes;
      }

      // Otherwise fetch for the specific date
      return prayerTimeApi.getPrayerTimes(
        locationSettings.city,
        locationSettings.country,
        locationSettings.calculationMethod,
        selectedDate,
        locationSettings.latitude,
        locationSettings.longitude
      );
    },
    enabled: !!locationSettings,
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

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskDto }) =>
      taskApi.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Task updated successfully!',
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingTask(null);
  };

  const handleAddTask = async (task: CreateTaskDto) => {
    await createTaskMutation.mutateAsync(task);
  };

  const handleOpenAddModal = (slot: PrayerTimeSlot) => {
    setDefaultSlot(slot);
    setShowAddModal(true);
  };

  const getSlotLabel = (slot: PrayerTimeSlot) => {
    switch (slot) {
      case PrayerTimeSlot.BeforeFajr: return t('home.beforeFajr');
      case PrayerTimeSlot.FajrToShurooq: return t('home.fajrToShurooq');
      case PrayerTimeSlot.ShurooqToDhuhr: return t('home.shurooqToDhuhr');
      case PrayerTimeSlot.DhuhrToAsr: return t('home.dhuhrToAsr');
      case PrayerTimeSlot.AsrToMaghrib: return t('home.asrToMaghrib');
      case PrayerTimeSlot.MaghribToIsha: return t('home.maghribToIsha');
      case PrayerTimeSlot.AfterIsha: return t('home.afterIsha');
      default: return '';
    }
  };

  const slotOptions = Object.values(PrayerTimeSlot).filter(
    (v) => typeof v === 'number'
  ) as PrayerTimeSlot[];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header */}
      <View className="bg-primary-500 dark:bg-primary-600 px-6 py-4 rounded-b-3xl">
        <Text className="text-white text-3xl font-bold">{t('common.appName')}</Text>
        <Text className="text-white/90 text-sm mt-1">
          {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: i18n.language === 'ar' ? ar : enUS })}
        </Text>
        <Text className="text-white/80 text-xs mt-0.5">
          {formatHijriDate(selectedDate, i18n.language)}
        </Text>

        {/* Prayer Countdown */}
        {prayerTimes && (
          <View className="bg-white/20 rounded-xl px-4 py-3 mt-4">
            <Text className="text-white font-semibold text-center">
              {countdown || t('common.loading')}
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
            tintColor={theme === 'dark' ? '#4ade80' : '#22c55e'}
          />
        }
      >
        {tasksLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={theme === 'dark' ? '#4ade80' : '#22c55e'} />
          </View>
        ) : (
          slotOptions.map((slot) => (
            <View key={slot} className="mb-6">
              {/* Slot Header */}
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-gray-900 dark:text-white font-bold text-lg">
                    {getSlotLabel(slot)}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    {groupedTasks[slot]?.length || 0} {t('common.tasks')}
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-primary-500 dark:bg-primary-600 rounded-full w-8 h-8 items-center justify-center"
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
                    onEdit={handleEditTask}
                  />
                ))
              ) : (
                <View className="bg-white dark:bg-gray-800 rounded-xl p-6 items-center">
                  <Ionicons name="checkbox-outline" size={40} color={theme === 'dark' ? '#4b5563' : '#d1d5db'} />
                  <Text className="text-gray-400 dark:text-gray-500 mt-2">{t('home.noTasks')}</Text>
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
        className="absolute bottom-28 end-6 bg-primary-500 dark:bg-primary-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => handleOpenAddModal(PrayerTimeSlot.BeforeFajr)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onSubmit={handleAddTask}
        onUpdate={async (id, updates) => {
          await updateTaskMutation.mutateAsync({ id, updates });
        }}
        taskToEdit={editingTask}
        defaultSlot={defaultSlot}
        defaultDate={selectedDate}
      />
    </SafeAreaView>
  );
}
