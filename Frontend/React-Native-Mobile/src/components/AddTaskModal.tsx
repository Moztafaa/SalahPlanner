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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PrayerTimeSlot, PrayerTimeSlotLabels, CreateTaskDto, Task, UpdateTaskDto } from '../types';
import { format } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: CreateTaskDto) => Promise<void>;
  onUpdate?: (id: string, task: UpdateTaskDto) => Promise<void>;
  taskToEdit?: Task | null;
  defaultSlot?: PrayerTimeSlot;
  defaultDate?: Date;
}

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
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
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
  }, [visible, defaultSlot, defaultDate, taskToEdit]);

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
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-[#f3f4f6] dark:bg-gray-900 rounded-t-3xl p-6 max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {taskToEdit ? t('tasks.editTaskTitle') : t('tasks.addTaskTitle')}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white font-medium mb-2">{t('tasks.taskName')} *</Text>
              <TextInput
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-start"
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
              <View className="mb-4">
                <Text className="text-xs text-green-600 dark:text-green-400 font-medium mb-2 uppercase tracking-wider">
                  {t('tasks.quickAdd')}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {suggestedTasks.map((task) => (
                    <TouchableOpacity
                      key={task}
                      className="bg-green-900/10 dark:bg-green-900/30 border border-green-800/20 dark:border-green-400/20 rounded-full px-3 py-1 flex-row items-center"
                      onPress={() => setTitle(task)}
                    >
                      <Text className="text-green-800 dark:text-green-100 text-sm">
                        + {task}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Description Input */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white font-medium mb-2">{t('tasks.description')}</Text>
              <TextInput
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-start"
                placeholder={t('tasks.description')}
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
                maxLength={500}
              />
            </View>

            {/* Date Picker */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white font-medium mb-2">{t('tasks.date')}</Text>
              <TouchableOpacity
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex-row items-center"
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
                <Text className="ms-3 text-gray-900 dark:text-white flex-1">
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

            {/* Prayer Time Slot Picker */}
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-white font-medium mb-2">{t('tasks.prayerTime')} *</Text>
              <TouchableOpacity
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex-row items-center"
                onPress={() => setShowSlotPicker(!showSlotPicker)}
                disabled={loading}
              >
                <Ionicons name="time-outline" size={20} color="#9ca3af" />
                <Text className="ms-3 text-gray-900 dark:text-white flex-1">
                  {getSlotLabel(slot)}
                </Text>
                <Ionicons
                  name={showSlotPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>

              {showSlotPicker && (
                <View className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {slotOptions.map((slotOption) => (
                    <TouchableOpacity
                      key={slotOption}
                      className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
                        slot === slotOption ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                      onPress={() => {
                        setSlot(slotOption);
                        setShowSlotPicker(false);
                      }}
                      disabled={loading}
                    >
                      <Text
                        className={`${
                          slot === slotOption
                            ? 'text-primary-600 dark:text-primary-400 font-semibold'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {getSlotLabel(slotOption)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`bg-primary-500 dark:bg-primary-600 rounded-xl py-4 mb-4 ${
                !title.trim() || loading ? 'opacity-50' : ''
              }`}
              onPress={handleSubmit}
              disabled={!title.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  {taskToEdit ? t('common.save') : t('common.add')}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}