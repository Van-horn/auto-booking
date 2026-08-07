import { getJSON, setJSON } from '@/shared/lib/storage';

const keyFor = (weekKey) => `auto_booking_attempts_${weekKey}`;

export async function getAttemptResult(weekKey, scheduleId) {
  const attempts = await getJSON(keyFor(weekKey), {});
  return attempts[scheduleId] ?? null;
}

export async function setAttemptResult(weekKey, scheduleId, result) {
  const attempts = await getJSON(keyFor(weekKey), {});
  attempts[scheduleId] = result;
  await setJSON(keyFor(weekKey), attempts);
}

export function getAttemptsForWeek(weekKey) {
  return getJSON(keyFor(weekKey), {});
}
