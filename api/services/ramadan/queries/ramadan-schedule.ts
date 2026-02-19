/**
 * Ramadan Schedule Query Hooks
 *
 * TanStack Query hooks for fetching Ramadan schedule and times.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { useQuery } from '@tanstack/react-query';
import { ramadanTimeKeys } from './query-keys';
import { fetchRamadanSchedule, fetchTodayRamadanTimes } from '../api/ramadan-times';
import { RAMADAN_CACHE_TTL, RAMADAN_STALE_TIME } from '../types/constants';
import type { RamadanYear, RamadanDaySchedule } from '../types';

/**
 * Fetch the full Ramadan schedule (all days with prayer times).
 */
export function useRamadanSchedule(
  startDate: string | undefined,
  totalDays: number,
  ramadanYear: RamadanYear | undefined
) {
  return useQuery<RamadanDaySchedule[]>({
    queryKey: ramadanTimeKeys.schedule(ramadanYear ?? 0),
    queryFn: () =>
      fetchRamadanSchedule(startDate!, totalDays, ramadanYear!),
    enabled: !!startDate && !!ramadanYear,
    staleTime: RAMADAN_STALE_TIME.SCHEDULE,
    gcTime: RAMADAN_CACHE_TTL.SCHEDULE,
  });
}

/**
 * Fetch today's Imsak and Iftar times (lightweight).
 */
export function useTodayRamadanTimes() {
  const todayStr = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ramadanTimeKeys.imsak(todayStr),
    queryFn: fetchTodayRamadanTimes,
    staleTime: RAMADAN_STALE_TIME.DAILY_TIMES,
    gcTime: RAMADAN_CACHE_TTL.DAILY_TIMES,
  });
}
