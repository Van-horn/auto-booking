export function getISOWeekInfo(date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);

  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);

  return { isoYear, isoWeek };
}

export function parseMobifitnessDateTime(isoString) {
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
