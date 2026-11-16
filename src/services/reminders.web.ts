/**
 * Website stand-in for reminders. A browser tab can't fire a notification
 * once it's closed, so reminders are a phone-app feature. The reminder time
 * is still saved, so it's ready when the same habit lives in the mobile app.
 */
import type { Habit } from '../types';

export const remindersSupported = false;

export async function cancelReminder(_habitId: number): Promise<void> {}

export async function syncReminder(_habit: Habit): Promise<boolean> {
  return true;
}
