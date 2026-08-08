import { parseMobifitnessDateTime } from '@/shared/lib/iso-week';

const WEEKDAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function formatRuleSlot(rule) {
  return `${WEEKDAY_NAMES[rule.weekday]} ${rule.time}`;
}

export function formatWeekday(rule) {
  return WEEKDAY_NAMES[rule.weekday];
}

export function formatDateTime(isoString) {
  const { day, month, time } = parseMobifitnessDateTime(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(day)}.${pad(month)} ${time}`;
}
