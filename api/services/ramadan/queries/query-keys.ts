/**
 * Ramadan Query Keys
 *
 * TanStack Query key factory for Ramadan-related queries.
 * Follows the same pattern as prayer query keys.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import type { RamadanYear } from '../types';

export const ramadanTimeKeys = {
  all: ['ramadan', 'times'] as const,
  schedule: (year: RamadanYear) =>
    [...ramadanTimeKeys.all, 'schedule', year] as const,
  daySchedule: (year: RamadanYear, day: number) =>
    [...ramadanTimeKeys.all, 'day', year, day] as const,
  imsak: (date: string) =>
    [...ramadanTimeKeys.all, 'imsak', date] as const,
} as const;

export const ramadanDetectionKeys = {
  all: ['ramadan', 'detection'] as const,
  current: () => [...ramadanDetectionKeys.all, 'current'] as const,
} as const;

export const ramadanLogKeys = {
  all: ['ramadan', 'logs'] as const,
  user: (userId: string) =>
    [...ramadanLogKeys.all, userId] as const,
  fasting: (userId: string, year: RamadanYear) =>
    [...ramadanLogKeys.user(userId), 'fasting', year] as const,
  tarawih: (userId: string, year: RamadanYear) =>
    [...ramadanLogKeys.user(userId), 'tarawih', year] as const,
  quranKhatam: (userId: string, year: RamadanYear) =>
    [...ramadanLogKeys.user(userId), 'quran', year] as const,
} as const;

export const ramadanQueryKeys = {
  times: ramadanTimeKeys,
  detection: ramadanDetectionKeys,
  logs: ramadanLogKeys,
} as const;
