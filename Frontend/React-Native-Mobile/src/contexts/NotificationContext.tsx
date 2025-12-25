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
import { useTranslation } from 'react-i18next';

// Configure notifications
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.warn('Failed to set notification handler:', error);
}

const NOTIFICATION_SETTINGS_KEY = 'notification_settings_enabled';
const NOTIFICATION_BUFFER_KEY = 'notification_buffer_minutes';

interface NotificationContextType {
  isEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  bufferMinutes: number;
  setBufferMinutes: (minutes: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

import { format } from 'date-fns';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [bufferMinutes, setBufferMinutesState] = useState(15);
  const { todayPrayerTimes } = usePrayerTimes();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTaskIds, setModalTaskIds] = useState<string[]>([]);
  const [modalSlot, setModalSlot] = useState<PrayerTimeSlot>(PrayerTimeSlot.BeforeFajr);

  // Fetch today's tasks to check for incomplete ones
  const { data: tasks } = useQuery({
    queryKey: ['tasks', format(new Date(), 'yyyy-MM-dd')],
    queryFn: () => taskApi.getTasksByDate(new Date()),
    enabled: isAuthenticated && isEnabled,
    refetchInterval: 60000, // Check every minute? Or rely on invalidation.
  });

  // Handle notification tap
  useEffect(() => {
    let subscription: Notifications.Subscription | undefined;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener(response => {
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
    } catch (error) {
      console.warn('Failed to add notification listener:', error);
    }

    return () => subscription?.remove();
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
      const buffer = await SecureStore.getItemAsync(NOTIFICATION_BUFFER_KEY);
      if (buffer) {
        setBufferMinutesState(parseInt(buffer, 10));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const setBufferMinutes = async (minutes: number) => {
    setBufferMinutesState(minutes);
    await SecureStore.setItemAsync(NOTIFICATION_BUFFER_KEY, minutes.toString());
  };

  // Schedule/Cancel notifications when dependencies change
  useEffect(() => {
    if (isEnabled && todayPrayerTimes && tasks) {
      scheduleSlotNotifications(tasks);
    } else if (!isEnabled) {
      cancelAllNotifications();
    }
  }, [isEnabled, todayPrayerTimes, tasks, bufferMinutes]);

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const scheduleSlotNotifications = async (currentTasks: Task[]) => {
    await cancelAllNotifications();

    if (!todayPrayerTimes) return;

    // Schedule Buffer Notifications (Wrap-Up)
    const prayers = [
      { name: t('home.fajr'), time: todayPrayerTimes.fajr },
      { name: t('home.dhuhr'), time: todayPrayerTimes.dhuhr },
      { name: t('home.asr'), time: todayPrayerTimes.asr },
      { name: t('home.maghrib'), time: todayPrayerTimes.maghrib },
      { name: t('home.isha'), time: todayPrayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const pTime = parseTime(prayer.time);
      const triggerDate = new Date(pTime.getTime() - bufferMinutes * 60 * 1000);
      const now = new Date();

      if (triggerDate > now) {
        const seconds = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: t('notifications.wrap_up_title', { prayer: prayer.name }),
              body: t('notifications.wrap_up_body', { minutes: bufferMinutes }),
              data: { type: 'buffer', prayer: prayer.name },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds,
              repeats: false,
            },
          });
        } catch (error) {
          console.warn('Failed to schedule buffer notification:', error);
        }
      }
    }

    // Define slot end times (start of next prayer)
    // Slot 0: Before Fajr -> Ends at Fajr
    // Slot 1: Fajr -> Ends at Shurooq
    // Slot 2: Shurooq -> Ends at Dhuhr
    // Slot 3: Dhuhr -> Ends at Asr
    // Slot 4: Asr -> Ends at Maghrib
    // Slot 5: Maghrib -> Ends at Isha
    // Slot 6: After Isha -> No end time notification usually, or maybe midnight?

    const scheduleForSlot = async (slot: PrayerTimeSlot, endTimeStr: string) => {
      const endTime = parseTime(endTimeStr);
      const now = new Date();

      // If time has passed, don't schedule
      if (endTime <= now) return;

      // Check if there are incomplete tasks for this slot
      const incompleteTasks = currentTasks.filter(
        t => t.slot === slot && !t.isCompleted
      );

      if (incompleteTasks.length > 0) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: t('notifications.unfinished_title'),
              body: t('notifications.unfinished_body', { count: incompleteTasks.length, slot: t(`prayer_slots.${slot}`) }),
              data: { slot, action: 'move_tasks' },
            },
            trigger: endTime,
          });
        } catch (error) {
          console.warn('Failed to schedule notification:', error);
        }
      }
    };

    await scheduleForSlot(PrayerTimeSlot.BeforeFajr, todayPrayerTimes.fajr);
    await scheduleForSlot(PrayerTimeSlot.FajrToShurooq, todayPrayerTimes.sunrise);
    await scheduleForSlot(PrayerTimeSlot.ShurooqToDhuhr, todayPrayerTimes.dhuhr);
    await scheduleForSlot(PrayerTimeSlot.DhuhrToAsr, todayPrayerTimes.asr);
    await scheduleForSlot(PrayerTimeSlot.AsrToMaghrib, todayPrayerTimes.maghrib);
    await scheduleForSlot(PrayerTimeSlot.MaghribToIsha, todayPrayerTimes.isha);
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Failed to cancel notifications:', error);
    }
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
    <NotificationContext.Provider value={{ isEnabled, toggleNotifications, bufferMinutes, setBufferMinutes }}>
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
