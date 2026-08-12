const CLUB_ID = 6119;
const BASE_URL = 'https://mobifitness.ru/api/v8/';

// weekday: ISO weekday, 1 = Monday .. 7 = Sunday
const RECURRING_TRAININGS = [
  { id: 'press-abs-glutes-tue', weekday: 2, time: '18:00', activityId: 65804, title: 'ПРЕСС-БЕДРА-ЯГОДИЦЫ' },
  { id: 'boxing-tue', weekday: 2, time: '19:00', activityId: 78616, title: 'БОКС' },
  { id: 'circuit-thu', weekday: 4, time: '18:00', activityId: 65803, title: 'КРУГОВАЯ ТРЕНИРОВКА' },
  { id: 'boxing-thu', weekday: 4, time: '19:00', activityId: 78616, title: 'БОКС' },
  { id: 'total-body-sat', weekday: 6, time: '14:30', activityId: 65802, title: 'TOTAL BODY' },
  { id: 'mini-group-sat', weekday: 6, time: '16:00', activityId: 241613, title: 'Мини-группа тренажёрный зал' },
  { id: 'total-body-sun', weekday: 7, time: '13:00', activityId: 65802, title: 'TOTAL BODY' },
  { id: 'stretching-mfr-sun', weekday: 7, time: '14:00', activityId: 207382, title: 'STRETCHING + МФР' },
  { id: 'mini-group-sun', weekday: 7, time: '16:00', activityId: 241613, title: 'Мини-группа тренажёрный зал' },
];

const WEEKDAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMobifitnessDateTime(isoString) {
  const [datePart, timePart] = isoString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const weekday = getISOWeekdayFromParts(year, month, day);
  const time = timePart.slice(0, 5);
  return { year, month, day, time, weekday };
}

function getISOWeekdayFromParts(year, month, day) {
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getISOWeekInfo(date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);

  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);

  return { isoYear, isoWeek };
}

function formatRuleSlot(rule) {
  return `${WEEKDAY_NAMES[rule.weekday]} ${rule.time}`;
}

function formatDateTime(isoString) {
  const { day, month, time } = parseMobifitnessDateTime(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(day)}.${pad(month)} ${time}`;
}

function matchRulesAgainstSchedule(scheduleArray, rules) {
  return rules.map((rule) => {
    const entry = scheduleArray.find((item) => {
      if (item.activity?.id !== rule.activityId) return false;
      const { weekday, time } = parseMobifitnessDateTime(item.datetime);
      return weekday === rule.weekday && time === rule.time;
    });

    if (!entry) return { rule, entry: null, status: 'not-found' };
    if (entry.change?.type === 'canceled') return { rule, entry, status: 'canceled' };
    return { rule, entry, status: 'matched' };
  });
}

function describeApiError(error) {
  if (!error) return 'Неизвестная ошибка';
  if (typeof error.status === 'number') return `HTTP ${error.status}: ${JSON.stringify(error.data)}`;
  return error.message ?? String(error);
}

function isAlreadyReservedError(error) {
  const message = typeof error?.data === 'string' ? error.data : JSON.stringify(error?.data ?? '');
  return /уже записаны/i.test(message);
}

async function apiRequest(token, apiPath, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${apiPath}`, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function getWeekSchedule(token, { year, week }) {
  const data = await apiRequest(token, `club/${CLUB_ID}/schedule.json?year=${year}&week=${week}`);
  return data.schedule;
}

function reserveTraining(token, scheduleId) {
  return apiRequest(token, 'account/reserve.json', {
    method: 'POST',
    body: JSON.stringify({ scheduleId, clubId: CLUB_ID }),
  });
}

// 09:00 Europe/Minsk (UTC+3, no DST) on the current UTC calendar day, plus a
// small safety margin so minor clock drift on the runner can never make the
// first reserve request go out before 09:00:00.
const SAFETY_MARGIN_MS = 2500;

function nineAmMinskUtc(now) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0, SAFETY_MARGIN_MS));
}

function isoWeekdayOf(date) {
  const jsDay = date.getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

const DELAY_BETWEEN_BOOKINGS_MS = 1800;

async function attemptReserveWithRetries(token, rule, entry) {
  const maxAttempts = 3;
  const delayMs = 1500;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await reserveTraining(token, entry.id);
      console.log(`[success] ${rule.title}: Автозапись выполнена (${formatDateTime(entry.datetime)})`);
      return;
    } catch (error) {
      if (isAlreadyReservedError(error)) {
        console.log(`[success] ${rule.title}: Уже записаны (${formatDateTime(entry.datetime)})`);
        return;
      }
      if (attempt === maxAttempts) {
        console.error(`[error] ${rule.title}: ${describeApiError(error)}`);
        return;
      }
      await sleepMs(delayMs);
    }
  }
}

async function main() {
  const token = process.env.MOBIFIT_TOKEN;

  if (!token) {
    console.error('[error] Токен: MOBIFIT_TOKEN не задан в secrets репозитория');
    return;
  }

  const now = new Date();
  const { isoYear, isoWeek } = getISOWeekInfo(now);

  let schedule;
  try {
    schedule = await getWeekSchedule(token, { year: isoYear, week: isoWeek });
  } catch (error) {
    console.error(`[error] Расписание: ${describeApiError(error)}`);
    return;
  }

  const matches = matchRulesAgainstSchedule(schedule, RECURRING_TRAININGS);

  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const tomorrowWeekday = isoWeekdayOf(tomorrow);

  for (const match of matches) {
    if (match.rule.weekday !== tomorrowWeekday) continue;
    if (match.status === 'not-found') {
      console.warn(`[warning] ${match.rule.title}: Тренировка не найдена в расписании (ожидалось ${formatRuleSlot(match.rule)})`);
    } else if (match.status === 'canceled') {
      console.warn(`[warning] ${match.rule.title}: Тренировка отменена клубом (${formatDateTime(match.entry.datetime)})`);
    }
  }

  const dueMatches = matches.filter((match) => match.status === 'matched' && match.rule.weekday === tomorrowWeekday);

  if (dueMatches.length === 0) {
    console.warn('[warning] Автозапись: Нет тренировок для бронирования на сегодняшнее открытие записи');
    return;
  }

  const target = nineAmMinskUtc(now);
  const waitMs = target.getTime() - Date.now();
  console.log(`Открытие записи в ${target.toISOString()} (09:00 МСК/Минск). Ожидание ${Math.max(0, Math.round(waitMs / 1000))} c...`);
  if (waitMs > 0) await sleepMs(waitMs);

  let isFirstBooking = true;
  for (const { rule, entry } of dueMatches) {
    if (!isFirstBooking) await sleepMs(DELAY_BETWEEN_BOOKINGS_MS);
    isFirstBooking = false;
    await attemptReserveWithRetries(token, rule, entry);
  }
}

main().catch((error) => {
  console.error(`[error] Скрипт: ${describeApiError(error)}`);
});
