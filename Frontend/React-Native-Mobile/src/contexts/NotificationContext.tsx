import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useQuery } from '@tanstack/react-query';
import { usePrayerTimes } from './PrayerTimesContext';
import { useAuth } from './AuthContext';
import { taskApi } from '../services/api';
import { PrayerTimeSlot, PrayerTimeSlotLabels, Task } from '../types';
import { Platform } from 'react-native';
import MoveTasksModal from '../components/MoveTasksModal';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_SETTINGS_KEY = 'notification_settings_enabled';

interface NotificationContextType {
  isEnabled: boolean;
  toggleNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const { todayPrayerTimes } = usePrayerTimes();
  const { isAuthenticated } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTaskIds, setModalTaskIds] = useState<string[]>([]);
  const [modalSlot, setModalSlot] = useState<PrayerTimeSlot>(PrayerTimeSlot.BeforeFajr);

  // Fetch today's tasks to check for incomplete ones
  const { data: tasks } = useQuery({
    queryKey: ['tasks', new Date().toISOString().split('T')[0]],
    queryFn: () => taskApi.getTasksByDate(new Date()),
    enabled: isAuthenticated && isEnabled,
    refetchInterval: 60000, // Check every minute? Or rely on invalidation.
  });

  // Handle notification tap
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data.action === 'move_tasks' && tasks) {
        const slot = data.slot as PrayerTimeSlot;
        const incomplete = tasks.filter(t => t.slot === slot && !t.isCompleted).map(t => t.id);

        if (incomplete.length > 0) {
            setModalSlot(slot);
            setModalTaskIds(incomplete);
            setModalVisible(true);
        }
      }
    });

    return () => subscription.remove();
  }, [tasks]);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await SecureStore.getItemAsync(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setIsEnabled(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  // Schedule/Cancel notifications when dependencies change
  useEffect(() => {
    if (isEnabled && todayPrayerTimes && tasks) {
      scheduleSlotNotifications(tasks);
    } else if (!isEnabled) {
      cancelAllNotifications();
    }
  }, [isEnabled, todayPrayerTimes, tasks]);

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const scheduleSlotNotifications = async (currentTasks: Task[]) => {
    await cancelAllNotifications();

    if (!todayPrayerTimes) return;

    // Define slot end times (start of next prayer)
    // Slot 0: Before Fajr -> Ends at Fajr
    // Slot 1: Fajr -> Ends at Shurooq
    // Slot 2: Shurooq -> Ends at Dhuhr
    // Slot 3: Dhuhr -> Ends at Asr
    // Slot 4: Asr -> Ends at Maghrib
    // Slot 5: Maghrib -> Ends at Isha
    // Slot 6: After Isha -> No end time notification usually, or maybe midnight?

    const scheduleForSlot = async (slot: PrayerTimeSlot, endTimeStr: string, slotName: string) => {
      const endTime = parseTime(endTimeStr);
      const now = new Date();

      // If time has passed, don't schedule
      if (endTime <= now) return;

      // Check if there are incomplete tasks for this slot
      const incompleteTasks = currentTasks.filter(
        t => t.slot === slot && !t.isCompleted
      );

      if (incompleteTasks.length > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Unfinished Tasks",
            body: `You have ${incompleteTasks.length} unfinished tasks for ${slotName}. Tap to move them.`,
            data: { slot, action: 'move_tasks' },
          },
          trigger: endTime,
        });
      }
    };

    await scheduleForSlot(PrayerTimeSlot.BeforeFajr, todayPrayerTimes.fajr, "Before Fajr");
    await scheduleForSlot(PrayerTimeSlot.FajrToShurooq, todayPrayerTimes.sunrise, "Fajr");
    await scheduleForSlot(PrayerTimeSlot.ShurooqToDhuhr, todayPrayerTimes.dhuhr, "Shurooq");
    await scheduleForSlot(PrayerTimeSlot.DhuhrToAsr, todayPrayerTimes.asr, "Dhuhr");
    await scheduleForSlot(PrayerTimeSlot.AsrToMaghrib, todayPrayerTimes.maghrib, "Asr");
    await scheduleForSlot(PrayerTimeSlot.MaghribToIsha, todayPrayerTimes.isha, "Maghrib");
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const toggleNotifications = async () => {
    if (!isEnabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setIsEnabled(true);
        await SecureStore.setItemAsync(NOTIFICATION_SETTINGS_KEY, JSON.stringify(true));
      } else {
        alert('Permission required to enable notifications.');
      }
    } else {
      setIsEnabled(false);
      await SecureStore.setItemAsync(NOTIFICATION_SETTINGS_KEY, JSON.stringify(false));
    }
  };

  return (
    <NotificationContext.Provider value={{ isEnabled, toggleNotifications }}>
      {children}
      <MoveTasksModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        taskIds={modalTaskIds}
        currentSlot={modalSlot}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
