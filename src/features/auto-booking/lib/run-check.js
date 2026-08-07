import { getWeekSchedule, reserveTraining } from '@/entities/training/api/training-api';
import { RECURRING_TRAININGS } from '@/entities/training/config/recurring-trainings';
import { matchRulesAgainstSchedule } from '@/entities/training/lib/match-rules';
import { formatDateTime, formatRuleSlot } from '@/entities/training/lib/format';
import { getISOWeekInfo } from '@/shared/lib/iso-week';
import { getAuthToken } from '@/shared/lib/secure-token';
import { getAttemptResult, setAttemptResult } from './attempts-store';
import { appendLog, getUnreadCount } from './logs-store';
import { sendLocalNotification, setBadgeCount } from './notify';
import { clearPausedScheduleId, getPausedScheduleId } from './pause-store';

function describeApiError(error) {
  if (!error) return 'Неизвестная ошибка';
  if (typeof error.status === 'number') return `HTTP ${error.status}: ${JSON.stringify(error.data)}`;
  return error.message ?? String(error);
}

function isAlreadyReservedError(error) {
  const message = typeof error?.data === 'string' ? error.data : JSON.stringify(error?.data ?? '');
  return /уже записаны/i.test(message);
}

async function notifyOnce(weekKey, notifyKey, title, body) {
  const alreadyNotified = await getAttemptResult(weekKey, notifyKey);
  if (alreadyNotified) return;
  await sendLocalNotification(title, body);
  await setBadgeCount(await getUnreadCount());
  await setAttemptResult(weekKey, notifyKey, true);
}

async function handleNotFound(weekKey, rule) {
  const notifyKey = `${rule.id}__not_found_notified`;
  await appendLog({
    level: 'warning',
    title: rule.title,
    message: `Тренировка не найдена в расписании (ожидалось ${formatRuleSlot(rule)})`,
  });
  await notifyOnce(
    weekKey,
    notifyKey,
    'Тренировка не найдена',
    `${rule.title} (${formatRuleSlot(rule)}) — отсутствует в расписании этой недели`
  );
}

async function handleCanceled(weekKey, rule, entry) {
  const notifyKey = `${entry.id}__canceled_notified`;
  await appendLog({
    level: 'warning',
    title: rule.title,
    message: `Тренировка отменена клубом (${formatDateTime(entry.datetime)})`,
    scheduleId: entry.id,
  });
  await notifyOnce(
    weekKey,
    notifyKey,
    'Тренировка отменена',
    `${rule.title} (${formatDateTime(entry.datetime)}) отменена клубом — автозапись пропущена`
  );
}

async function handleReserveError(weekKey, rule, entry, error) {
  const scheduleId = entry.id;

  if (isAlreadyReservedError(error)) {
    await appendLog({
      level: 'success',
      title: rule.title,
      message: `Уже записаны (${formatDateTime(entry.datetime)})`,
      scheduleId,
    });
    await setAttemptResult(weekKey, scheduleId, 'done');
    return;
  }

  await setAttemptResult(weekKey, scheduleId, null);
  await appendLog({
    level: 'error',
    title: rule.title,
    message: describeApiError(error),
    scheduleId,
  });
  await notifyOnce(
    weekKey,
    `${scheduleId}__error_notified`,
    'Ошибка автозаписи',
    `${rule.title} (${formatDateTime(entry.datetime)}): не удалось записаться, попробуем ещё раз`
  );
}

async function handleMatched(weekKey, rule, entry, now, pausedScheduleId) {
  const scheduleId = entry.id;
  const beginDateMs = new Date(entry.beginDate).getTime();
  const datetimeMs = new Date(entry.datetime).getTime();
  const nowMs = now.getTime();

  const existingResult = await getAttemptResult(weekKey, scheduleId);
  if (['done', 'missed', 'paused', 'booking'].includes(existingResult)) {
    return;
  }

  if (scheduleId === pausedScheduleId) {
    await setAttemptResult(weekKey, scheduleId, 'paused');
    await clearPausedScheduleId();
    return;
  }

  if (nowMs < beginDateMs) {
    return;
  }

  if (nowMs >= datetimeMs) {
    await appendLog({
      level: 'error',
      title: rule.title,
      message: `Не удалось записаться до начала тренировки (${formatDateTime(entry.datetime)})`,
      scheduleId,
    });
    await setAttemptResult(weekKey, scheduleId, 'missed');
    return;
  }

  await setAttemptResult(weekKey, scheduleId, 'booking');

  try {
    await reserveTraining(scheduleId);
  } catch (error) {
    return handleReserveError(weekKey, rule, entry, error);
  }

  await appendLog({
    level: 'success',
    title: rule.title,
    message: `Автозапись выполнена (${formatDateTime(entry.datetime)})`,
    scheduleId,
  });
  await setAttemptResult(weekKey, scheduleId, 'done');
}

export async function runAutoBookingCheck() {
  const token = await getAuthToken();
  if (!token) return;

  const now = new Date();
  const { isoYear, isoWeek } = getISOWeekInfo(now);
  const weekKey = `${isoYear}-${isoWeek}`;

  let schedule;
  try {
    schedule = await getWeekSchedule({ year: isoYear, week: isoWeek });
  } catch (error) {
    await appendLog({
      level: 'error',
      title: 'Расписание',
      message: describeApiError(error),
    });
    await notifyOnce(
      weekKey,
      `schedule__error_notified_${now.toDateString()}`,
      'Ошибка автозаписи',
      'Не удалось загрузить расписание клуба'
    );
    return;
  }

  const matches = matchRulesAgainstSchedule(schedule, RECURRING_TRAININGS);
  const pausedScheduleId = await getPausedScheduleId();

  for (const { rule, entry, status } of matches) {
    if (status === 'not-found') {
      await handleNotFound(weekKey, rule);
    } else if (status === 'canceled') {
      await handleCanceled(weekKey, rule, entry);
    } else {
      await handleMatched(weekKey, rule, entry, now, pausedScheduleId);
    }
  }
}
