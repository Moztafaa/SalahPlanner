import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, handleApiError } from '../../src/services/api';
import { PrayerTimeSlot, PrayerTimeSlotLabels, Task, CreateTaskDto } from '../../src/types';
import TaskCard from '../../src/components/TaskCard';
import AddTaskModal from '../../src/components/AddTaskModal';
import Toast from 'react-native-toast-message';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { useSelectedDate } from '../../src/contexts/DateContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const { theme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [defaultSlot, setDefaultSlot] = useState<PrayerTimeSlot>(PrayerTimeSlot.BeforeFajr);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const isRTL = i18n.language === 'ar';

  // Generate dates for the horizontal strip (current week)
  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 0 }), [selectedDate]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  // Fetch tasks for selected date
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => taskApi.getTasksByDate(selectedDate),
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (task: CreateTaskDto) => taskApi.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({ type: 'success', text1: t('common.success'), text2: t('tasks.createSuccess') });
      setShowAddModal(false);
    },
    onError: (error) => Toast.show({ type: 'error', text1: t('common.error'), text2: handleApiError(error) }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateTaskDto> }) =>
      taskApi.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({ type: 'success', text1: t('common.success'), text2: t('tasks.updateSuccess') });
      setShowAddModal(false);
      setEditingTask(null);
    },
    onError: (error) => Toast.show({ type: 'error', text1: t('common.error'), text2: handleApiError(error) }),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.toggleTaskComplete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (error) => Toast.show({ type: 'error', text1: t('common.error'), text2: handleApiError(error) }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({ type: 'success', text1: t('common.success'), text2: t('tasks.deleteSuccess') });
    },
    onError: (error) => Toast.show({ type: 'error', text1: t('common.error'), text2: handleApiError(error) }),
  });

  const handleAddTask = async (task: CreateTaskDto) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, updates: task });
    } else {
      await createTaskMutation.mutateAsync(task);
    }
  };

  const handleOpenAddModal = (slot: PrayerTimeSlot, task?: Task) => {
    setDefaultSlot(slot);
    setEditingTask(task || null);
    setShowAddModal(true);
  };

  // Group tasks
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.slot]) acc[task.slot] = [];
    acc[task.slot].push(task);
    return acc;
  }, {} as Record<PrayerTimeSlot, Task[]>);



  const slotOptions = Object.values(PrayerTimeSlot).filter(
    (v) => typeof v === 'number'
  ) as PrayerTimeSlot[];

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

  const getSlotIcon = (slot: PrayerTimeSlot) => {
    switch (slot) {
      case PrayerTimeSlot.BeforeFajr: return { name: 'nights-stay', color: '#a78bfa' }; // Indigo
      case PrayerTimeSlot.FajrToShurooq: return { name: 'wb-twilight', color: '#9db9a6' }; // Sage
      case PrayerTimeSlot.ShurooqToDhuhr: return { name: 'wb-sunny', color: '#facc15' }; // Yellow
      case PrayerTimeSlot.DhuhrToAsr: return { name: 'wb-sunny', color: '#fbbf24' }; // Amber
      case PrayerTimeSlot.AsrToMaghrib: return { name: 'wb-cloudy', color: '#fdba74' }; // Orange
      case PrayerTimeSlot.MaghribToIsha: return { name: 'nights-stay', color: '#c084fc' }; // Purple
      case PrayerTimeSlot.AfterIsha: return { name: 'bedtime', color: '#818cf8' }; // Indigo
      default: return { name: 'schedule', color: '#9ca3af' };
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
      <View className="bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-white/5 pt-12 pb-4 z-20">
        <View className="flex-row items-center justify-between px-4 pb-2">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">{t('calendar.title')}</Text>
          <TouchableOpacity
            onPress={() => handleDateSelect(new Date())}
            className="active:opacity-70"
          >
            <Text className="text-primary text-sm font-bold uppercase tracking-wide">{t('calendar.today')}</Text>
          </TouchableOpacity>
        </View>

        {/* Month/Year */}
        <View className="flex-row items-center justify-between px-4 pb-4">
          <Text className="text-sm font-medium text-slate-500 dark:text-[#9db9a6]">
            {format(selectedDate, 'MMMM yyyy', { locale: isRTL ? ar : enUS })}
          </Text>
          <MaterialIcons name="calendar-today" size={20} color={theme === 'dark' ? '#6b7280' : '#9ca3af'} />
        </View>

        {/* Week Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          className="flex-grow-0"
        >
          {weekDates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <TouchableOpacity
                key={date.toISOString()}
                onPress={() => handleDateSelect(date)}
                className={`flex-col items-center justify-center min-w-[56px] h-[72px] rounded-2xl border ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  isSelected ? 'text-background-dark' : 'text-slate-500 dark:text-[#9db9a6]'
                }`}>
                  {format(date, 'EEE', { locale: isRTL ? ar : enUS })}
                </Text>
                <Text className={`text-lg font-bold mt-1 ${
                  isSelected ? 'text-background-dark' : 'text-slate-900 dark:text-white'
                }`}>
                  {format(date, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Timeline Line (Visual only) */}
      <View className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-white/10 z-0 hidden sm:block" />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderSectionHeader={({ section: { title, slot } }) => {
          const iconInfo = getSlotIcon(slot);
          return (
            <View className="bg-background-light/95 dark:bg-background-dark/95 border-b border-gray-200 dark:border-white/5 px-4 py-3 flex-row items-center justify-between z-10">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name={iconInfo.name as any} size={20} color={iconInfo.color} />
                <Text className="text-base font-bold text-slate-900 dark:text-white leading-tight">{title}</Text>
              </View>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View className="px-4 py-2">
            <TouchableOpacity
              onPress={() => handleOpenAddModal(item.slot, item)}
              className="flex-row items-center gap-4 bg-white dark:bg-surface-dark p-3 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm"
            >
              <View className={`flex items-center justify-center rounded-lg w-10 h-10 shrink-0 ${
                item.isCompleted ? 'bg-primary/20' : 'bg-gray-100 dark:bg-white/5'
              }`}>
                <MaterialIcons
                  name={item.isCompleted ? "check" : "event-note"}
                  size={20}
                  color={item.isCompleted ? (theme === 'dark' ? '#13ec5b' : '#15803d') : (theme === 'dark' ? '#9ca3af' : '#6b7280')}
                />
              </View>

              <View className="flex-1 justify-center">
                <Text className={`text-base font-medium leading-normal ${
                  item.isCompleted
                    ? 'text-slate-400 dark:text-gray-500 line-through'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text className="text-slate-500 dark:text-[#9db9a6] text-xs font-normal leading-normal mt-0.5" numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => toggleTaskMutation.mutate(item.id)}
                className={`w-6 h-6 rounded border items-center justify-center ${
                  item.isCompleted
                    ? 'bg-primary border-primary'
                    : 'border-gray-300 dark:border-[#3b5443] bg-transparent'
                }`}
              >
                {item.isCompleted && <MaterialIcons name="check" size={14} color="#102216" />}
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.data.length === 0) {
            return (
              <View className="px-4 py-6 items-center justify-center opacity-40">
                <MaterialIcons name="event-available" size={32} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Text className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-2">
                  {t('home.noTasks')}
                </Text>
                <TouchableOpacity onPress={() => handleOpenAddModal(section.slot)} className="mt-2">
                   <Text className="text-primary text-xs font-bold uppercase">{t('tasks.addTask')}</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        }}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/30"
        onPress={() => handleOpenAddModal(PrayerTimeSlot.BeforeFajr)}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={28} color="#102216" />
      </TouchableOpacity>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleAddTask}
        onUpdate={async (id, updates) => {
          await updateTaskMutation.mutateAsync({ id, updates });
        }}
        taskToEdit={editingTask}
        defaultSlot={defaultSlot}
        defaultDate={selectedDate}
      />
    </View>
  );
}
