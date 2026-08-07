import { registerAutoBookingTask } from './background-task';
import { configureNotificationHandler, requestNotificationPermissions } from './notify';
import { runAutoBookingCheck } from './run-check';

export async function bootstrapAutoBooking() {
  configureNotificationHandler();
  await requestNotificationPermissions();
  await registerAutoBookingTask();
  await runAutoBookingCheck();
}
