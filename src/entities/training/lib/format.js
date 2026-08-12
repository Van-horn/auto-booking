const WEEKDAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function formatRuleSlot(rule) {
  return `${WEEKDAY_NAMES[rule.weekday]} ${rule.time}`;
}

export function formatWeekday(rule) {
  return WEEKDAY_NAMES[rule.weekday];
}
