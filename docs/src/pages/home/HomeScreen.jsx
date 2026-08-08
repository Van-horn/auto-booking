import { useCallback, useEffect, useMemo, useState } from 'react';

import { getWeekSchedule } from '@/entities/training/api/training-api';
import { RECURRING_TRAININGS } from '@/entities/training/config/recurring-trainings';
import { formatDateTime, formatWeekday } from '@/entities/training/lib/format';
import { matchRulesAgainstSchedule } from '@/entities/training/lib/match-rules';
import { getPausedScheduleId, setPausedScheduleId } from '@/shared/api/github-api';
import { getISOWeekInfo } from '@/shared/lib/iso-week';
import { getAuthToken } from '@/shared/lib/mobifit-token';

const dateOf = (isoDateTime) => isoDateTime.slice(0, 10);

export function HomeScreen() {
  const [hasToken, setHasToken] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [pausedScheduleId, setPausedIdState] = useState(null);
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

    try {
      setPausedIdState(await getPausedScheduleId());
    } catch {
      setPausedIdState(null);
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
      .filter((match) => match.entry.id !== pausedScheduleId)
      .sort((a, b) => new Date(a.entry.datetime) - new Date(b.entry.datetime));
  }, [matches, pausedScheduleId]);

  const nextDayTrainings = useMemo(() => {
    if (pendingSorted.length === 0) return [];
    const nextDate = dateOf(pendingSorted[0].entry.datetime);
    return pendingSorted.filter((match) => dateOf(match.entry.datetime) === nextDate);
  }, [pendingSorted]);

  const pausedMatch = useMemo(
    () => matches.find((match) => match.status === 'matched' && match.entry.id === pausedScheduleId) ?? null,
    [matches, pausedScheduleId]
  );

  const onPause = async (match) => {
    const confirmed = window.confirm(
      `Пропустить автозапись?\n${match.rule.title} — ${formatDateTime(match.entry.datetime)}`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await setPausedScheduleId(match.entry.id);
      setPausedIdState(match.entry.id);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen">
      <h1 className="screen-title">Автозапись</h1>

      {hasToken === false ? <p className="status-text">Необходим токен</p> : null}

      {hasToken ? (
        <>
          {pausedMatch ? (
            <p className="paused-note">
              Приостановлено: {pausedMatch.rule.title} ({formatDateTime(pausedMatch.entry.datetime)})
            </p>
          ) : null}

          {isLoading ? <p className="status-text">Загрузка…</p> : null}

          {error ? <p className="status-text">{error.message || 'Не удалось загрузить расписание'}</p> : null}

          {!isLoading && !error && nextDayTrainings.length > 0
            ? nextDayTrainings.map((match) => (
                <div key={match.entry.id} className="card">
                  <div className="card-title">
                    {match.rule.title} ({formatWeekday(match.rule)})
                  </div>
                  <button className="button" onClick={() => onPause(match)}>
                    Пропустить один раз
                  </button>
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
