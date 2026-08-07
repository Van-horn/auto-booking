import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const isNotificationsSupported = Platform.OS !== 'web';

export function configureNotificationHandler() {
  if (!isNotificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function isPermissionGranted(settings) {
  return settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function requestNotificationPermissions() {
  if (!isNotificationsSupported) return false;

  const current = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(current)) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return isPermissionGranted(requested);
}

export function sendLocalNotification(title, body) {
  if (!isNotificationsSupported) return Promise.resolve();
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export function setBadgeCount(count) {
  if (!isNotificationsSupported) return Promise.resolve();
  return Notifications.setBadgeCountAsync(count);
}
