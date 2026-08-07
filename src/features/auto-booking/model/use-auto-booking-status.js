import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getWeekSchedule } from '@/entities/training/api/training-api';
import { RECURRING_TRAININGS } from '@/entities/training/config/recurring-trainings';
import { matchRulesAgainstSchedule } from '@/entities/training/lib/match-rules';
import { getISOWeekInfo } from '@/shared/lib/iso-week';
import { getAuthToken } from '@/shared/lib/secure-token';
import { getAttemptsForWeek } from '../lib/attempts-store';
import { getPausedScheduleId, setPausedScheduleId } from '../lib/pause-store';

const TERMINAL_STATES = ['done', 'missed', 'paused'];

const dateOf = (isoDateTime) => isoDateTime.slice(0, 10);

export function useAutoBookingStatus() {
  const { isoYear, isoWeek } = getISOWeekInfo(new Date());
  const weekKey = `${isoYear}-${isoWeek}`;

  const [hasToken, setHasToken] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [pausedScheduleId, setPausedIdState] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  const loadSchedule = useCallback(async () => {
    setIsLoadingSchedule(true);
    try {
      const data = await getWeekSchedule({ year: isoYear, week: isoWeek });
      setSchedule(data);
      setScheduleError(null);
    } catch (error) {
      setScheduleError(error);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [isoYear, isoWeek]);

  const reloadLocalState = useCallback(async () => {
    const [attemptsMap, pausedId, token] = await Promise.all([
      getAttemptsForWeek(weekKey),
      getPausedScheduleId(),
      getAuthToken(),
    ]);
    setAttempts(attemptsMap);
    setPausedIdState(pausedId);
    setHasToken(Boolean(token));
    return Boolean(token);
  }, [weekKey]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const tokenPresent = await reloadLocalState();
        if (tokenPresent) await loadSchedule();
      })();
    }, [reloadLocalState, loadSchedule])
  );

  const matches = useMemo(() => {
    if (!schedule) return [];
    return matchRulesAgainstSchedule(schedule, RECURRING_TRAININGS);
  }, [schedule]);

  const pendingSorted = useMemo(() => {
    return matches
      .filter((match) => match.status === 'matched')
      .filter((match) => !TERMINAL_STATES.includes(attempts[match.entry.id]))
      .filter((match) => match.entry.id !== pausedScheduleId)
      .sort((a, b) => new Date(a.entry.datetime) - new Date(b.entry.datetime));
  }, [matches, attempts, pausedScheduleId]);

  const nextDayTrainings = useMemo(() => {
    if (pendingSorted.length === 0) return [];
    const nextDate = dateOf(pendingSorted[0].entry.datetime);
    return pendingSorted.filter((match) => dateOf(match.entry.datetime) === nextDate);
  }, [pendingSorted]);

  const pausedMatch = useMemo(
    () => matches.find((match) => match.status === 'matched' && match.entry.id === pausedScheduleId) ?? null,
    [matches, pausedScheduleId]
  );

  const pauseTraining = useCallback(
    async (scheduleId) => {
      await setPausedScheduleId(scheduleId);
      await reloadLocalState();
    },
    [reloadLocalState]
  );

  return {
    isLoading: hasToken === null || isLoadingSchedule,
    hasToken: Boolean(hasToken),
    error: scheduleError,
    nextDayTrainings,
    pausedMatch,
    pauseTraining,
  };
}
