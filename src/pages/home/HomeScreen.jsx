import { useCallback, useEffect, useMemo, useState } from 'react';

import { getWeekSchedule } from '@/entities/training/api/training-api';
import { RECURRING_TRAININGS } from '@/entities/training/config/recurring-trainings';
import { formatWeekday } from '@/entities/training/lib/format';
import { matchRulesAgainstSchedule } from '@/entities/training/lib/match-rules';
import { getISOWeekInfo } from '@/shared/lib/iso-week';
import { getAuthToken } from '@/shared/lib/mobifit-token';

const dateOf = (isoDateTime) => isoDateTime.slice(0, 10);

export function HomeScreen() {
  const [hasToken, setHasToken] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const token = getAuthToken();
    setHasToken(Boolean(token));
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const { isoYear, isoWeek } = getISOWeekInfo(new Date());
      const data = await getWeekSchedule({ year: isoYear, week: isoWeek });
      setSchedule(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const matches = useMemo(() => {
    if (!schedule) return [];
    return matchRulesAgainstSchedule(schedule, RECURRING_TRAININGS);
  }, [schedule]);

  const pendingSorted = useMemo(() => {
    return matches
      .filter((match) => match.status === 'matched')
      .sort((a, b) => new Date(a.entry.datetime) - new Date(b.entry.datetime));
  }, [matches]);

  const nextDayTrainings = useMemo(() => {
    if (pendingSorted.length === 0) return [];
    const nextDate = dateOf(pendingSorted[0].entry.datetime);
    return pendingSorted.filter((match) => dateOf(match.entry.datetime) === nextDate);
  }, [pendingSorted]);

  return (
    <div className="screen">
      <h1 className="screen-title">Автозапись</h1>

      {hasToken === false ? <p className="status-text">Необходим токен</p> : null}

      {hasToken ? (
        <>
          {isLoading ? <p className="status-text">Загрузка…</p> : null}

          {error ? <p className="status-text">{error.message || 'Не удалось загрузить расписание'}</p> : null}

          {!isLoading && !error && nextDayTrainings.length > 0
            ? nextDayTrainings.map((match) => (
                <div key={match.entry.id} className="card">
                  <div className="card-title">
                    {match.rule.title} ({formatWeekday(match.rule)})
                  </div>
                </div>
              ))
            : null}

          {!isLoading && !error && nextDayTrainings.length === 0 ? (
            <p className="status-text">Нет предстоящих тренировок для автозаписи на этой неделе</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
