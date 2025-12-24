import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrayerTimeSlot, PrayerTimeSlotLabels } from '../types';
import { taskApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

interface MoveTasksModalProps {
  visible: boolean;
  onClose: () => void;
  taskIds: string[];
  currentSlot: PrayerTimeSlot;
}

export default function MoveTasksModal({ visible, onClose, taskIds, currentSlot }: MoveTasksModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Determine next slot
  const nextSlot = currentSlot < PrayerTimeSlot.AfterIsha ? currentSlot + 1 : PrayerTimeSlot.BeforeFajr;

  const handleMove = async (slot: PrayerTimeSlot) => {
    try {
      setIsSubmitting(true);
      await taskApi.updateTaskSlot({
        taskIds,
        newSlot: slot
      });

      // Invalidate tasks query
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      Toast.show({
        type: 'success',
        text1: 'Tasks Moved',
        text2: `Moved ${taskIds.length} tasks to ${PrayerTimeSlotLabels[slot]}`
      });

      onClose();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to move tasks'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-900">Unfinished Tasks</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 mb-6">
            You have {taskIds.length} unfinished tasks in {PrayerTimeSlotLabels[currentSlot]}.
            What would you like to do?
          </Text>

          <TouchableOpacity
            className="bg-emerald-600 p-4 rounded-xl flex-row justify-center items-center mb-3"
            onPress={() => handleMove(nextSlot)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-semibold text-lg mr-2">
                  Move to {PrayerTimeSlotLabels[nextSlot]}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <Text className="text-center text-gray-500 my-2">or choose another slot</Text>

          <ScrollView className="max-h-60">
            <View className="flex-row flex-wrap justify-between pb-4">
                {Object.values(PrayerTimeSlot)
                .filter((val): val is PrayerTimeSlot => typeof val === 'number' && val !== currentSlot)
                .map((slot) => {
                    return (
                    <TouchableOpacity
                        key={slot}
                        className="w-[48%] bg-gray-100 p-3 rounded-lg mb-2 items-center"
                        onPress={() => handleMove(slot)}
                        disabled={isSubmitting}
                    >
                        <Text className="text-gray-700 text-sm text-center">
                        {PrayerTimeSlotLabels[slot]}
                        </Text>
                    </TouchableOpacity>
                    );
                })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
