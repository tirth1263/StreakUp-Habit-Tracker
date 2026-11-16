/**
 * Daily reminders on phones. These are LOCAL notifications: the phone itself
 * fires them on a schedule, so they work offline and need no server.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit } from '../types';

export const remindersSupported = true;

const CHANNEL_ID = 'daily-reminders';
const idFor = (habitId: number) => `habit-${habitId}`;

// Show the reminder even if the app happens to be open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelReminder(habitId: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(idFor(habitId)).catch(() => {});
}

/**
 * Make the phone's schedule match the habit: cancel the old reminder, then
 * schedule a new one if the habit has a time.
 * Returns false only when a reminder was wanted but permission was denied.
 */
export async function syncReminder(habit: Habit): Promise<boolean> {
  await cancelReminder(habit.id);
  if (!habit.reminderTime) return true;
  if (!(await ensurePermission())) return false;

  const [hour, minute] = habit.reminderTime.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    // A fixed id per habit means re-saving replaces rather than duplicates.
    identifier: idFor(habit.id),
    content: {
      title: habit.name,
      body: "Don't break your streak — tap to check in for today.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}
