import { getJSON, setJSON } from '@/shared/lib/storage';

const LOGS_KEY = 'auto_booking_logs';
const UNREAD_COUNT_KEY = 'auto_booking_logs_unread_count';
const MAX_LOGS = 200;

export async function appendLog({ level, title, message, scheduleId }) {
  const logs = await getJSON(LOGS_KEY, []);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    level,
    title,
    message,
    scheduleId,
  };
  const nextLogs = [entry, ...logs].slice(0, MAX_LOGS);
  await setJSON(LOGS_KEY, nextLogs);

  const unreadCount = await getJSON(UNREAD_COUNT_KEY, 0);
  await setJSON(UNREAD_COUNT_KEY, unreadCount + 1);

  return entry;
}

export function getLogs() {
  return getJSON(LOGS_KEY, []);
}

export function clearLogs() {
  return setJSON(LOGS_KEY, []);
}

export function getUnreadCount() {
  return getJSON(UNREAD_COUNT_KEY, 0);
}

export function markLogsRead() {
  return setJSON(UNREAD_COUNT_KEY, 0);
}
