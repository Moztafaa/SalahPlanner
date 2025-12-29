import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PrayerTimeSlot, CreateTaskDto, Task, UpdateTaskDto } from '../types';
import { format } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withTiming } from 'react-native-reanimated';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: CreateTaskDto) => Promise<void>;
  onUpdate?: (id: string, task: UpdateTaskDto) => Promise<void>;
  taskToEdit?: Task | null;
  defaultSlot?: PrayerTimeSlot;
  defaultDate?: Date;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function AddTaskModal({
  visible,
  onClose,
  onSubmit,
  onUpdate,
  taskToEdit,
  defaultSlot = PrayerTimeSlot.BeforeFajr,
  defaultDate,
}: AddTaskModalProps) {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slot, setSlot] = useState<PrayerTimeSlot>(defaultSlot);
  const [taskDate, setTaskDate] = useState<Date>(defaultDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const wasVisible = React.useRef(false);

  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
    }
  }, [visible]);

  const pan = Gesture.Pan()
    .onChange((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, {}, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    if (visible && !wasVisible.current) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setSlot(taskToEdit.slot);
        setTaskDate(taskToEdit.taskDate ? new Date(taskToEdit.taskDate) : new Date());
      } else {
        setTitle('');
        setDescription('');
        setSlot(defaultSlot);
        if (defaultDate) {
          setTaskDate(defaultDate);
        }
      }
    }
    wasVisible.current = visible;
  }, [visible, taskToEdit, defaultSlot, defaultDate]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (taskToEdit && onUpdate) {
        await onUpdate(taskToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          slot,
          taskDate,
        });
      } else {
        await onSubmit({
          title: title.trim(),
          description: description.trim() || undefined,
          slot,
          taskDate,
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setSlot(defaultSlot);
      setTaskDate(defaultDate || new Date());
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
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

  const getSuggestedTasks = () => {
    const suggestions: string[] = [];

    switch (slot) {
      case PrayerTimeSlot.FajrToShurooq:
        suggestions.push(t('tasks.morningAdhkar'));
        break;
      case PrayerTimeSlot.DhuhrToAsr:
      case PrayerTimeSlot.AsrToMaghrib:
        suggestions.push(t('tasks.rawatibSunnah'));
        break;
      case PrayerTimeSlot.MaghribToIsha:
        suggestions.push(t('tasks.eveningAdhkar'));
        break;
      case PrayerTimeSlot.AfterIsha:
        suggestions.push(t('tasks.witrPrayer'));
        suggestions.push(t('tasks.surahMulk'));
        break;
    }

    if (taskDate && taskDate.getDay() === 5) {
      suggestions.push(t('tasks.surahKahf'));
    }

    return suggestions;
  };

  const suggestedTasks = getSuggestedTasks();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50"
        >
          <Animated.View
            style={[animatedStyle]}
            className="h-[90%] w-full bg-background-light dark:bg-background-dark rounded-t-[40px] overflow-hidden shadow-2xl border-t-8 border-transparent"
          >
            <GestureDetector gesture={pan}>
              <View>
                {/* Bottom Sheet Handle */}
                <View className="flex w-full flex-col items-center justify-center pt-3 pb-1 bg-background-light dark:bg-background-dark z-10">
                  <View className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-[#3b5443]" />
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between bg-background-light dark:bg-background-dark px-5 py-3 z-10">
                  <View className="w-10" />
                  <Text className="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                    {taskToEdit ? t('tasks.editTaskTitle') : t('tasks.addTaskTitle')}
                  </Text>
                  <View className="flex w-10 items-center justify-end">
                    <TouchableOpacity
                      onPress={onClose}
                      disabled={loading}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-white/10"
                    >
                      <MaterialIcons name="close" size={24} color={loading ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </GestureDetector>

            {/* Scrollable Content */}
            <ScrollView
              className="flex-1 px-5"
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Task Title Input */}
              <View className="mt-4 flex flex-col gap-2">
                <Text className="text-base font-semibold leading-normal text-gray-800 dark:text-white">
                  {t('tasks.taskName')}
                </Text>
                <TextInput
                  className="h-14 w-full rounded-xl border-none bg-surface-light dark:bg-surface-dark px-4 text-base font-normal text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#9db9a6] shadow-sm"
                  placeholder={t('tasks.taskName')}
                  placeholderTextColor="#9ca3af"
                  value={title}
                  onChangeText={setTitle}
                  editable={!loading}
                  maxLength={100}
                />
              </View>

              {/* Suggested Tasks */}
              {suggestedTasks.length > 0 && (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {suggestedTasks.map((task) => (
                    <TouchableOpacity
                      key={task}
                      className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-full px-3 py-1.5 flex-row items-center"
                      onPress={() => setTitle(task)}
                    >
                      <Text className="text-primary-700 dark:text-primary-300 text-xs font-medium">
                        + {task}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Notes Input */}
              <View className="mt-6 flex flex-col gap-2">
                <Text className="text-base font-semibold leading-normal text-gray-800 dark:text-white">
                  {t('tasks.description')}
                </Text>
                <TextInput
                  className="min-h-[140px] w-full rounded-xl border-none bg-surface-light dark:bg-surface-dark px-4 py-4 text-base font-normal text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#9db9a6] shadow-sm"
                  placeholder={t('tasks.description')}
                  placeholderTextColor="#9ca3af"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  editable={!loading}
                  maxLength={500}
                />
              </View>

              {/* Date Picker */}
              <View className="mt-6 flex flex-col gap-2">
                <Text className="text-base font-semibold leading-normal text-gray-800 dark:text-white">
                  {t('tasks.date')}
                </Text>
                <TouchableOpacity
                  className="h-14 w-full rounded-xl border-none bg-surface-light dark:bg-surface-dark px-4 flex-row items-center shadow-sm"
                  onPress={() => setShowDatePicker(true)}
                  disabled={loading}
                >
                  <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
                  <Text className="ms-3 text-base font-normal text-gray-900 dark:text-white flex-1">
                    {format(taskDate, 'MMMM d, yyyy', { locale: i18n.language === 'ar' ? ar : enUS })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={taskDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setTaskDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              {/* Prayer Slot Selector */}
              <View className="mt-8 flex flex-col gap-3">
                <Text className="text-base font-semibold leading-normal text-gray-800 dark:text-white">
                  {t('tasks.prayerTime')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-5 px-5 py-1"
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  {slotOptions.map((slotOption) => {
                    const isSelected = slot === slotOption;
                    return (
                      <TouchableOpacity
                        key={slotOption}
                        onPress={() => setSlot(slotOption)}
                        disabled={loading}
                        className={`mr-3 rounded-full px-5 py-2.5 border shadow-sm transition-all ${
                          isSelected
                            ? 'bg-primary border-primary shadow-primary/20'
                            : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/10'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            isSelected
                              ? 'font-bold text-background-dark'
                              : 'font-medium text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {getSlotLabel(slotOption)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('tasks.prayerTimeHint', { slot: getSlotLabel(slot) })}
                </Text>
              </View>
            </ScrollView>

            {/* Action Bar / Footer */}
            <View className="absolute bottom-0 left-0 right-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-5 border-t border-gray-200 dark:border-white/5 pb-8">
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-transparent py-3.5 items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <Text className="text-base font-semibold text-gray-600 dark:text-gray-400">
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!title.trim() || loading}
                  className={`flex-[2] rounded-xl bg-primary py-3.5 items-center justify-center shadow-lg shadow-primary/25 ${
                    !title.trim() || loading ? 'opacity-70' : ''
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color="#102216" />
                  ) : (
                    <Text className="text-base font-bold text-background-dark">
                      {taskToEdit ? t('common.save') : t('common.add')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}