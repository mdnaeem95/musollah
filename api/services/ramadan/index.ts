/**
 * Ramadan Service — Barrel Exports
 *
 * @version 1.0
 * @since 2026-02-14
 */

// Types
export type {
  RamadanYear,
  FastingStatus,
  MissedReason,
  FastingDayLog,
  TarawihLocation,
  TarawihDayLog,
  QuranJuzLog,
  RamadanDaySchedule,
  RamadanTrackerState,
  RamadanStats,
  RamadanDetectionResult,
  RamadanNotificationPrefs,
  RamadanDailyContent,
} from './types';
export { RamadanErrorCode, RamadanServiceError } from './types';

// Constants
export {
  RAMADAN_HIJRI_MONTH,
  SHABAN_HIJRI_MONTH,
  LAYLATUL_QADR_NIGHTS,
  LAST_TEN_NIGHTS_START,
  IMSAK_OFFSET_MINUTES,
  TOTAL_JUZ,
  PAGES_PER_JUZ,
  RAMADAN_DAILY_CONTENT,
  IFTAR_DUA,
  SUHOOR_DUA,
  DEFAULT_RAMADAN_NOTIFICATION_PREFS,
} from './types/constants';

// API
export { fetchRamadanSchedule, fetchTodayRamadanTimes } from './api/ramadan-times';
export { syncRamadanToFirebase, fetchRamadanFromFirebase } from './api/ramadan-firebase';
export { computeRamadanStats, formatStatsForSharing } from './api/transformers';

// Query hooks
export { useRamadanSchedule, useTodayRamadanTimes } from './queries/ramadan-schedule';
export { useSyncRamadanToFirebase, useRestoreRamadanFromFirebase } from './queries/ramadan-logs';

// Query keys
export { ramadanQueryKeys, ramadanTimeKeys, ramadanDetectionKeys, ramadanLogKeys } from './queries/query-keys';
