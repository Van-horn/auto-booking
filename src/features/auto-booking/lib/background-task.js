import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';

import { appendLog } from './logs-store';
import { runAutoBookingCheck } from './run-check';

export const AUTO_BOOKING_TASK_NAME = 'auto-booking-check';
const isBackgroundTaskSupported = Platform.OS !== 'web';

if (isBackgroundTaskSupported) {
  TaskManager.defineTask(AUTO_BOOKING_TASK_NAME, async () => {
    try {
      await runAutoBookingCheck();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerAutoBookingTask() {
  if (!isBackgroundTaskSupported) return;

  const status = await BackgroundTask.getStatusAsync();
  if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
    await appendLog({
      level: 'warning',
      title: 'Фоновая задача',
      message: 'Недоступна на этом устройстве (проверьте Background App Refresh / Low Power Mode)',
    });
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(AUTO_BOOKING_TASK_NAME);
  if (isRegistered) return;
  await BackgroundTask.registerTaskAsync(AUTO_BOOKING_TASK_NAME, { minimumInterval: 15 });
}
