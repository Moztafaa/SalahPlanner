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
import { PrayerTimeSlot, PrayerTimeSlotLabels, CreateTaskDto } from '../types';
import { format } from 'date-fns';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: CreateTaskDto) => Promise<void>;
  defaultSlot?: PrayerTimeSlot;
  defaultDate?: Date;
}

export default function AddTaskModal({
  visible,
  onClose,
  onSubmit,
  defaultSlot = PrayerTimeSlot.BeforeFajr,
  defaultDate,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slot, setSlot] = useState<PrayerTimeSlot>(defaultSlot);
  const [taskDate, setTaskDate] = useState<Date>(defaultDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSlot(defaultSlot);
      if (defaultDate) {
        setTaskDate(defaultDate);
      }
    }
  }, [visible, defaultSlot, defaultDate]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        slot,
        taskDate,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSlot(defaultSlot);
      setTaskDate(defaultDate || new Date());
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const slotOptions = Object.values(PrayerTimeSlot).filter(
    (v) => typeof v === 'number'
  ) as PrayerTimeSlot[];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-[#f3f4f6] rounded-t-3xl p-6 max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-text-primary">Add Task</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View className="mb-4">
              <Text className="text-text-primary font-medium mb-2">Title *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                placeholder="Enter task title"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                editable={!loading}
                maxLength={100}
              />
            </View>

            {/* Description Input */}
            <View className="mb-4">
              <Text className="text-text-primary font-medium mb-2">Description</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                placeholder="Enter task description (optional)"
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
              <Text className="text-text-primary font-medium mb-2">Date</Text>
              <TouchableOpacity
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
                <Text className="ml-3 text-text-primary flex-1">
                  {format(taskDate, 'MMMM d, yyyy')}
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
              <Text className="text-text-primary font-medium mb-2">Prayer Time Slot *</Text>
              <TouchableOpacity
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
                onPress={() => setShowSlotPicker(!showSlotPicker)}
                disabled={loading}
              >
                <Ionicons name="time-outline" size={20} color="#9ca3af" />
                <Text className="ml-3 text-text-primary flex-1">
                  {PrayerTimeSlotLabels[slot]}
                </Text>
                <Ionicons
                  name={showSlotPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>

              {showSlotPicker && (
                <View className="mt-2 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  {slotOptions.map((slotOption) => (
                    <TouchableOpacity
                      key={slotOption}
                      className={`px-4 py-3 border-b border-gray-200 ${
                        slot === slotOption ? 'bg-primary-50' : ''
                      }`}
                      onPress={() => {
                        setSlot(slotOption);
                        setShowSlotPicker(false);
                      }}
                      disabled={loading}
                    >
                      <Text
                        className={`${
                          slot === slotOption ? 'text-primary-600 font-semibold' : 'text-text-primary'
                        }`}
                      >
                        {PrayerTimeSlotLabels[slotOption]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`bg-primary-500 rounded-xl py-4 mb-4 ${
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
                  Create Task
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
