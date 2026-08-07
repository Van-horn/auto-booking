import { getJSON, removeKey, setJSON } from '@/shared/lib/storage';

const PAUSED_SCHEDULE_ID_KEY = 'auto_booking_paused_schedule_id';

export function getPausedScheduleId() {
  return getJSON(PAUSED_SCHEDULE_ID_KEY, null);
}

export function setPausedScheduleId(scheduleId) {
  return setJSON(PAUSED_SCHEDULE_ID_KEY, scheduleId);
}

export function clearPausedScheduleId() {
  return removeKey(PAUSED_SCHEDULE_ID_KEY);
}
