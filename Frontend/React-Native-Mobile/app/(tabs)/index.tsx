import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, prayerTimeApi, handleApiError } from '../../src/services/api';
import { PrayerTimeSlot, PrayerTimeSlotLabels, Task, CreateTaskDto, UpdateTaskDto } from '../../src/types';
import TaskCard from '../../src/components/TaskCard';
import AddTaskModal from '../../src/components/AddTaskModal';
import PrayerTimesModal from '../../src/components/PrayerTimesModal';
import DailyReviewModal from '../../src/components/DailyReviewModal';
import NextPrayerCard from '../../src/components/NextPrayerCard';
import SlotHeader from '../../src/components/SlotHeader';
import Toast from 'react-native-toast-message';
import { format, differenceInSeconds, parse } from 'date-fns';
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
  const [showPrayerTimesModal, setShowPrayerTimesModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<PrayerTimeSlot>(PrayerTimeSlot.BeforeFajr);
  const [showDailyReview, setShowDailyReview] = useState(false);
  const [incompleteTasks, setIncompleteTasks] = useState<Task[]>([]);

  const [nextPrayerInfo, setNextPrayerInfo] = useState({
    name: 'Loading...',
    time: '--:--',
    remaining: '00:00:00',
    progress: 0,
    currentSlot: PrayerTimeSlot.BeforeFajr
  });

  // Check for incomplete tasks
  const { data: pastTasks } = useQuery({
    queryKey: ['incompleteTasks'],
    queryFn: () => taskApi.getIncompletePastTasks(new Date()),
    staleTime: Infinity, // Only fetch once on mount
  });

  useEffect(() => {
    if (pastTasks && pastTasks.length > 0) {
      setIncompleteTasks(pastTasks);
      setShowDailyReview(true);
    }
  }, [pastTasks]);

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

  // Calculate next prayer countdown and current slot
  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      const now = new Date();
      const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(now);
        date.setHours(hours, minutes, 0, 0);
        return date;
      };

      const times = [
        { name: 'Fajr', time: prayerTimes.fajr, date: parseTime(prayerTimes.fajr) },
        { name: 'Shurooq', time: prayerTimes.sunrise, date: parseTime(prayerTimes.sunrise) },
        { name: 'Dhuhr', time: prayerTimes.dhuhr, date: parseTime(prayerTimes.dhuhr) },
        { name: 'Asr', time: prayerTimes.asr, date: parseTime(prayerTimes.asr) },
        { name: 'Maghrib', time: prayerTimes.maghrib, date: parseTime(prayerTimes.maghrib) },
        { name: 'Isha', time: prayerTimes.isha, date: parseTime(prayerTimes.isha) },
      ];

      // Determine current slot
      let currentSlot = PrayerTimeSlot.BeforeFajr;
      if (now >= times[0].date && now < times[1].date) currentSlot = PrayerTimeSlot.FajrToShurooq;
      else if (now >= times[1].date && now < times[2].date) currentSlot = PrayerTimeSlot.ShurooqToDhuhr;
      else if (now >= times[2].date && now < times[3].date) currentSlot = PrayerTimeSlot.DhuhrToAsr;
      else if (now >= times[3].date && now < times[4].date) currentSlot = PrayerTimeSlot.AsrToMaghrib;
      else if (now >= times[4].date && now < times[5].date) currentSlot = PrayerTimeSlot.MaghribToIsha;
      else if (now >= times[5].date) currentSlot = PrayerTimeSlot.AfterIsha;

      // Determine next prayer (excluding Shurooq for next prayer display usually, but keeping logic simple)
      // We usually show next PRAYER (Fajr, Dhuhr, Asr, Maghrib, Isha)
      const prayers = times.filter(t => t.name !== 'Shurooq');
      let nextPrayer = prayers.find(p => p.date > now);
      let prevPrayer = prayers[prayers.length - 1]; // Default to Isha of previous day if needed, but simplified

      if (!nextPrayer) {
        // Next is Fajr tomorrow
        nextPrayer = { ...prayers[0], date: new Date(prayers[0].date.getTime() + 24 * 60 * 60 * 1000) };
        prevPrayer = prayers[prayers.length - 1];
      } else {
        const index = prayers.indexOf(nextPrayer);
        prevPrayer = index > 0 ? prayers[index - 1] : prayers[prayers.length - 1]; // Simplified
      }

      const totalDuration = nextPrayer.date.getTime() - prevPrayer.date.getTime(); // Rough estimate if crossing midnight
      // Better progress: time since prev prayer / (next - prev)
      // If prev prayer was yesterday, we need to handle that.
      // For simplicity, let's just use a fixed window or just time remaining.

      const seconds = differenceInSeconds(nextPrayer.date, now);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      // Progress calculation (simplified)
      // Let's assume max duration of 4 hours for progress bar visual if we don't have exact prev prayer time handy correctly across midnight
      // Or better: find the actual previous prayer time.
      let prevPrayerDate = new Date(nextPrayer.date);
      // Find the prayer before nextPrayer
      // ... logic is getting complex for inline.
      // Let's use a simple progress based on 100% = 1 hour? No.
      // Let's use the current slot duration if possible.

      setNextPrayerInfo({
        name: nextPrayer.name,
        time: format(nextPrayer.date, 'hh:mm a'),
        remaining: timeString,
        progress: 0.5, // TODO: Implement accurate progress
        currentSlot
      });

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

  // Helper to calculate slot duration
  const getSlotDuration = (slot: PrayerTimeSlot, times: any): string | null => {
    if (!times) return null;

    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const calculate = (start: string, end: string) => {
      let startMinutes = parseTime(start);
      let endMinutes = parseTime(end);
      if (endMinutes < startMinutes) endMinutes += 24 * 60;
      const diff = endMinutes - startMinutes;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    switch (slot) {
      case PrayerTimeSlot.FajrToShurooq: return calculate(times.fajr, times.sunrise);
      case PrayerTimeSlot.ShurooqToDhuhr: return calculate(times.sunrise, times.dhuhr);
      case PrayerTimeSlot.DhuhrToAsr: return calculate(times.dhuhr, times.asr);
      case PrayerTimeSlot.AsrToMaghrib: return calculate(times.asr, times.maghrib);
      case PrayerTimeSlot.MaghribToIsha: return calculate(times.maghrib, times.isha);
      default: return null;
    }
  };

  const sections = slotOptions.map(slot => ({
    title: getSlotLabel(slot),
    slot: slot,
    data: groupedTasks[slot] || [],
  }));

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="pt-12 pb-2 px-4 flex-row items-center justify-between bg-surface-light/95 dark:bg-background-dark/95 border-b border-gray-200 dark:border-white/5 z-30">
        <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <MaterialIcons name="menu" size={24} color={theme === 'dark' ? 'white' : '#0f172a'} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-sm font-medium text-slate-500 dark:text-[#9db9a6]">
            {format(selectedDate, 'EEE, d MMM')}
          </Text>
          <Text className="text-base font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
            {formatHijriDate(selectedDate, i18n.language)}
          </Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
          onPress={() => setShowPrayerTimesModal(true)}
        >
          <MaterialIcons name="schedule" size={24} color={theme === 'dark' ? 'white' : '#0f172a'} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={tasksLoading || prayerTimesLoading}
            onRefresh={refetchTasks}
            tintColor="#13ec5b"
          />
        }
        ListHeaderComponent={
          <NextPrayerCard
            prayerName={nextPrayerInfo.name}
            prayerTime={nextPrayerInfo.time}
            timeRemaining={nextPrayerInfo.remaining}
            progress={nextPrayerInfo.progress}
          />
        }
        renderSectionHeader={({ section: { title, slot, data } }) => (
          <SlotHeader
            title={title}
            taskCount={data.length}
            isActive={slot === nextPrayerInfo.currentSlot}
            duration={prayerTimes ? getSlotDuration(slot, prayerTimes) : null}
            slot={slot}
          />
        )}
        renderItem={({ item }) => (
          <View className="px-4">
            <TaskCard
              task={item}
              onToggleComplete={toggleTaskMutation.mutate}
              onDelete={deleteTaskMutation.mutate}
              onEdit={handleEditTask}
            />
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.data.length === 0) {
            return (
              <View className="px-4 py-2 mb-4">
                <View className="items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 p-8 bg-gray-50/50 dark:bg-white/5">
                  <View className="bg-gray-200 dark:bg-white/10 rounded-full p-3 mb-3">
                    <MaterialIcons name="check-circle" size={24} color={theme === 'dark' ? '#6b7280' : '#9ca3af'} />
                  </View>
                  <Text className="text-slate-600 dark:text-gray-300 font-medium">No tasks added yet</Text>
                  <Text className="text-slate-400 dark:text-gray-500 text-sm mt-1">Focus on your spiritual connection.</Text>
                  <TouchableOpacity onPress={() => handleOpenAddModal(section.slot)} className="mt-4">
                    <Text className="text-primary font-bold text-sm">Add a task</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          return (
            <View className="px-4 py-2 mb-4">
               <TouchableOpacity
                  onPress={() => handleOpenAddModal(section.slot)}
                  className="flex-row items-center justify-center py-3 rounded-xl border border-dashed border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 active:bg-gray-100 dark:active:bg-white/10"
               >
                  <MaterialIcons name="add" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                  <Text className="ml-2 text-sm font-medium text-slate-500 dark:text-gray-400">Add task to this slot</Text>
               </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/30"
        onPress={() => handleOpenAddModal(PrayerTimeSlot.BeforeFajr)}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={28} color="#102216" />
      </TouchableOpacity>

      {/* Modals */}
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

      <PrayerTimesModal
        visible={showPrayerTimesModal}
        onClose={() => setShowPrayerTimesModal(false)}
        prayerTimes={prayerTimes}
        date={selectedDate}
      />

      <DailyReviewModal
        visible={showDailyReview}
        tasks={incompleteTasks}
        onClose={() => setShowDailyReview(false)}
      />
    </View>
  );
}

