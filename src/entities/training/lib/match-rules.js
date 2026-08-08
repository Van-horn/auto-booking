import { parseMobifitnessDateTime } from '@/shared/lib/iso-week';

export function matchRulesAgainstSchedule(scheduleArray, rules) {
  return rules.map((rule) => {
    const entry = scheduleArray.find((item) => {
      if (item.activity?.id !== rule.activityId) return false;
      const { weekday, time } = parseMobifitnessDateTime(item.datetime);
      return weekday === rule.weekday && time === rule.time;
    });

    if (!entry) {
      return { rule, entry: null, status: 'not-found' };
    }

    if (entry.change?.type === 'canceled') {
      return { rule, entry, status: 'canceled' };
    }

    return { rule, entry, status: 'matched' };
  });
}
