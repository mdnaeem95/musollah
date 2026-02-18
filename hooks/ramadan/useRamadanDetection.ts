/**
 * Ramadan Detection Hook
 *
 * Auto-detects whether it is currently Ramadan, approaching Ramadan,
 * or post-Ramadan using the Hijri calendar via Aladhan API.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { useQuery } from '@tanstack/react-query';
import { format, addDays, differenceInDays, parseISO, isWithinInterval } from 'date-fns';
import { convertToIslamicDate } from '../../api/services/prayer/api/aladhan';
import { DATE_FORMATS } from '../../api/services/prayer/types/constants';
import { ramadanDetectionKeys } from '../../api/services/ramadan/queries/query-keys';
import {
  RAMADAN_HIJRI_MONTH,
  SHABAN_HIJRI_MONTH,
  APPROACHING_THRESHOLD_DAYS,
  RAMADAN_STALE_TIME,
  RAMADAN_CACHE_TTL,
  MUIS_RAMADAN_DATES,
} from '../../api/services/ramadan/types/constants';
import type { RamadanDetectionResult } from '../../api/services/ramadan/types';
import { useRamadanMode, usePreferencesStore } from '../../stores/userPreferencesStore';
import { useRamadanStore } from '../../stores/useRamadanStore';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Ramadan Detection');

/**
 * Detect current Ramadan status from Hijri calendar
 */
async function detectRamadan(): Promise<RamadanDetectionResult> {
  const startTime = performance.now();

  try {
    const now = new Date();
    const today = format(now, DATE_FORMATS.API);
    logger.debug('Detecting Ramadan status', { gregorianDate: today });

    const result = await convertToIslamicDate(today);

    const hijriDay = parseInt(result.hijri.day, 10);
    const hijriMonthName = result.hijri.month;
    const hijriYear = parseInt(result.hijri.year, 10);
    const hijriMonthNumber = getHijriMonthNumber(hijriMonthName);

    // Check for MUIS override dates (Aladhan can be off by 1 day vs MUIS)
    // Look at current and adjacent Hijri years to handle edge cases
    const muisOverride = MUIS_RAMADAN_DATES[hijriYear] ?? MUIS_RAMADAN_DATES[hijriYear + 1];

    let isRamadan: boolean;
    let isApproaching: boolean;
    let currentDay: number;
    let daysUntilRamadan: number;
    let startDate: string;
    let endDate: string;
    let effectiveMonthName = hijriMonthName;

    if (muisOverride) {
      // Use MUIS official dates instead of Aladhan calculation
      const muisStart = parseISO(muisOverride.start);
      const muisEnd = parseISO(muisOverride.end);

      isRamadan = isWithinInterval(now, { start: muisStart, end: muisEnd });
      currentDay = isRamadan ? differenceInDays(now, muisStart) + 1 : 0;
      startDate = isRamadan ? muisOverride.start : '';
      endDate = isRamadan ? muisOverride.end : '';

      // Check approaching: within threshold days before MUIS start
      const daysToStart = differenceInDays(muisStart, now);
      isApproaching = !isRamadan && daysToStart > 0 && daysToStart <= APPROACHING_THRESHOLD_DAYS;
      daysUntilRamadan = isRamadan ? 0 : (daysToStart > 0 ? daysToStart : -1);

      if (isRamadan) effectiveMonthName = 'Ramadan';

      logger.info('Using MUIS override dates for Ramadan detection', {
        muisStart: muisOverride.start,
        muisEnd: muisOverride.end,
        isRamadan,
        currentDay,
        aladhanSays: hijriMonthName,
      });
    } else {
      // Fallback to Aladhan API result
      isRamadan = hijriMonthNumber === RAMADAN_HIJRI_MONTH;
      const isShaban = hijriMonthNumber === SHABAN_HIJRI_MONTH;
      isApproaching = isShaban && hijriDay >= (30 - APPROACHING_THRESHOLD_DAYS);
      currentDay = isRamadan ? hijriDay : 0;
      daysUntilRamadan = isRamadan ? 0 : (isApproaching ? 30 - hijriDay : -1);
      startDate = isRamadan ? estimateRamadanStart(hijriDay) : '';
      endDate = isRamadan ? estimateRamadanEnd(hijriDay) : '';
    }

    const detection: RamadanDetectionResult = {
      isRamadan,
      isApproaching,
      currentDay,
      daysUntilRamadan,
      ramadanYear: hijriYear,
      startDate,
      endDate,
      hijriMonth: isRamadan ? RAMADAN_HIJRI_MONTH : hijriMonthNumber,
      hijriMonthName: effectiveMonthName,
    };

    const duration = performance.now() - startTime;
    logger.success('Ramadan detection complete', {
      isRamadan,
      isApproaching,
      currentDay: detection.currentDay,
      hijriMonth: effectiveMonthName,
      hijriYear,
      usedMuisOverride: !!muisOverride,
      duration: `${duration.toFixed(0)}ms`,
    });

    return detection;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Ramadan detection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(0)}ms`,
    });

    // Return safe defaults — assume not Ramadan
    return {
      isRamadan: false,
      isApproaching: false,
      currentDay: 0,
      daysUntilRamadan: -1,
      ramadanYear: 0,
      startDate: '',
      endDate: '',
      hijriMonth: 0,
      hijriMonthName: '',
    };
  }
}

/**
 * Map Hijri month name to number
 */
function getHijriMonthNumber(monthName: string): number {
  const months: Record<string, number> = {
    'Muharram': 1,
    'Muḥarram': 1,
    'Safar': 2,
    'Ṣafar': 2,
    "Rabi' al-Awwal": 3,
    "Rabī' al-Awwal": 3,
    "Rabi al-Awwal": 3,
    "Rabi' al-Thani": 4,
    "Rabī' al-Thānī": 4,
    "Rabi al-Thani": 4,
    "Jumada al-Ula": 5,
    "Jumādá al-Ūlá": 5,
    "Jumada al-Awwal": 5,
    "Jumada al-Thani": 6,
    "Jumādá al-Thānī": 6,
    "Jumada al-Akhirah": 6,
    'Rajab': 7,
    "Sha'ban": 8,
    "Sha'bān": 8,
    'Shaban': 8,
    'Ramadan': 9,
    'Ramaḍān': 9,
    'Ramadhan': 9,
    'Shawwal': 10,
    'Shawwāl': 10,
    "Dhul Qi'dah": 11,
    "Dhū al-Qa'dah": 11,
    "Dhu al-Qi'dah": 11,
    'Dhul Hijjah': 12,
    'Dhū al-Ḥijjah': 12,
    'Dhu al-Hijjah': 12,
  };

  // Try exact match first
  if (months[monthName]) return months[monthName];

  // Try case-insensitive partial match
  const lower = monthName.toLowerCase();
  for (const [key, value] of Object.entries(months)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Try starts-with for common prefixes
  if (lower.startsWith('ram')) return 9;
  if (lower.startsWith('sha\'') || lower.startsWith('shab')) return 8;
  if (lower.startsWith('shaw')) return 10;

  logger.warn('Unknown Hijri month name', { monthName });
  return 0;
}

/**
 * Estimate Gregorian start date of current Ramadan
 * (Subtracts current day to get back to day 1)
 */
function estimateRamadanStart(currentDay: number): string {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (currentDay - 1));
  return format(start, 'yyyy-MM-dd');
}

/**
 * Estimate Gregorian end date of current Ramadan
 * (Assumes 30-day Ramadan for estimation)
 */
function estimateRamadanEnd(currentDay: number): string {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + (30 - currentDay));
  return format(end, 'yyyy-MM-dd');
}

// ============================================================================
// DEV OVERRIDE
// ============================================================================

/**
 * Generate mock Ramadan detection data for testing outside Ramadan.
 * Simulates day 5 of Ramadan starting from today - 4 days.
 */
function getMockDetection(): RamadanDetectionResult {
  const mockDay = 5;
  const today = new Date();
  const startDate = format(addDays(today, -(mockDay - 1)), 'yyyy-MM-dd');
  const endDate = format(addDays(today, 30 - mockDay), 'yyyy-MM-dd');

  logger.info('DEV MODE: Using mock Ramadan detection', { mockDay });

  return {
    isRamadan: true,
    isApproaching: false,
    currentDay: mockDay,
    daysUntilRamadan: 0,
    ramadanYear: 1447,
    startDate,
    endDate,
    hijriMonth: 9,
    hijriMonthName: 'Ramadan',
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to detect current Ramadan status.
 *
 * When ramadanMode is manually enabled but it's not actually Ramadan,
 * returns mock data so you can test the full experience.
 */
export function useRamadanDetection() {
  const isRamadanMode = useRamadanMode();
  const initializeRamadan = useRamadanStore((s) => s.initializeRamadan);

  const query = useQuery({
    queryKey: [...ramadanDetectionKeys.current(), isRamadanMode],
    queryFn: async () => {
      const real = await detectRamadan();

      // If it's actually Ramadan, auto-enable and initialize
      if (real.isRamadan) {
        // Auto-enable Ramadan mode if not already on
        if (!usePreferencesStore.getState().ramadanMode) {
          logger.info('Auto-enabling Ramadan mode (Ramadan detected)');
          usePreferencesStore.getState().toggleRamadanMode();
        }

        // Auto-initialize tracker with real dates
        initializeRamadan(
          real.ramadanYear,
          real.startDate,
          real.endDate,
          30
        );

        return real;
      }

      // If ramadanMode is manually enabled but not Ramadan, use mock data for dev/testing
      if (isRamadanMode && !real.isRamadan) {
        const mock = getMockDetection();

        // Auto-initialize the store with mock data so trackers work
        initializeRamadan(mock.ramadanYear, mock.startDate, mock.endDate, 30);

        return mock;
      }

      return real;
    },
    staleTime: RAMADAN_STALE_TIME.DETECTION,
    gcTime: RAMADAN_CACHE_TTL.DETECTION,
  });

  return query;
}
