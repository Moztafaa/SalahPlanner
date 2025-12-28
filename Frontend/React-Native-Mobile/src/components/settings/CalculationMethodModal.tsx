import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { CalculationMethod, CalculationMethodLabels } from '../../types';

interface CalculationMethodModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMethod: CalculationMethod;
  onSelectMethod: (method: CalculationMethod) => void;
}

const calculationMethods = [
  CalculationMethod.ShiaIthnaAshari,
  CalculationMethod.UniversityOfIslamicSciencesKarachi,
  CalculationMethod.IslamicSocietyOfNorthAmerica,
  CalculationMethod.MuslimWorldLeague,
  CalculationMethod.UmmAlQuraUniversityMakkah,
  CalculationMethod.EgyptianGeneralAuthorityOfSurvey,
  CalculationMethod.GulfRegion,
  CalculationMethod.Kuwait,
  CalculationMethod.Qatar,
  CalculationMethod.JAKIM,
];

/**
 * Modal for selecting prayer time calculation method
 * Displays all available methods with the currently selected one highlighted
 */
export default function CalculationMethodModal({
  visible,
  onClose,
  selectedMethod,
  onSelectMethod,
}: CalculationMethodModalProps) {
  const { theme } = useTheme();

  const handleSelect = (method: CalculationMethod) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelectMethod(method);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <TouchableOpacity
          className="absolute inset-0 bg-black/50"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <View className="bg-surface-light dark:bg-surface-dark rounded-t-3xl max-h-[70%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-surface-highlight">
            <Text className="text-gray-900 dark:text-white text-lg font-bold">
              Calculation Method
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-surface-highlight items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          {/* Methods List */}
          <ScrollView
            className="px-4 py-2"
            showsVerticalScrollIndicator={false}
          >
            {calculationMethods.map((method, index) => {
              const isSelected = selectedMethod === method;
              const isLast = index === calculationMethods.length - 1;

              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => handleSelect(method)}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between py-4 ${
                    !isLast ? 'border-b border-gray-100 dark:border-surface-highlight' : ''
                  }`}
                >
                  <View className="flex-1 me-3">
                    <Text
                      className={`text-base ${
                        isSelected
                          ? 'text-primary font-semibold'
                          : 'text-gray-900 dark:text-white font-medium'
                      }`}
                    >
                      {CalculationMethodLabels[method]}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#13ec5b" />
                  )}
                </TouchableOpacity>
              );
            })}
            {/* Bottom spacing */}
            <View className="h-8" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
