import { apiRequest } from '@/shared/api/http-client';
import { CLUB_ID } from '../config/recurring-trainings';

export async function getWeekSchedule({ year, week }) {
  const data = await apiRequest(`club/${CLUB_ID}/schedule.json?year=${year}&week=${week}`);
  return data.schedule;
}

export function reserveTraining(scheduleId) {
  return apiRequest('account/reserve.json', {
    method: 'POST',
    body: JSON.stringify({ scheduleId, clubId: CLUB_ID }),
  });
}
