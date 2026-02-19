/**
 * Ramadan Times API
 *
 * Fetch Imsak times and full Ramadan schedule from Aladhan API.
 * Cross-validates Imsak against MUIS Subuh - 10 minutes.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { format, addDays } from 'date-fns';
import { fetchPrayerTimesFromAladhan, fetchMonthlyCalendar } from '../../prayer/api/aladhan';
import { fetchMonthlyPrayerTimesFromFirebase } from '../../prayer/api/firebase';
import { normalizeFirebaseTime } from '../../prayer/api/transformers';
import {
  CalculationMethod,
  School,
  DEFAULT_LOCATION,
  DATE_FORMATS,
} from '../../prayer/types/constants';
import {
  IMSAK_OFFSET_MINUTES,
  IMSAK_VALIDATION_THRESHOLD_MINUTES,
  LAYLATUL_QADR_NIGHTS,
  LAST_TEN_NIGHTS_START,
} from '../types/constants';
import type { RamadanDaySchedule, RamadanYear } from '../types';
import { RamadanServiceError, RamadanErrorCode } from '../types';
import { createLogger } from '../../../../services/logging/logger';

const logger = createLogger('Ramadan Times API');

// ============================================================================
// HELPERS
// ============================================================================

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function cleanTimezone(time: string): string {
  return time.replace(/\s*\([A-Z]+\)$/, '').trim();
}

/**
 * Validate Aladhan Imsak against MUIS Subuh - 10 minutes
 */
function validateImsak(aladhanImsak: string, muisSubuh: string): string {
  const aladhanMinutes = timeToMinutes(aladhanImsak);
  const muisImsakMinutes = timeToMinutes(muisSubuh) - IMSAK_OFFSET_MINUTES;
  const diff = Math.abs(aladhanMinutes - muisImsakMinutes);

  if (diff > IMSAK_VALIDATION_THRESHOLD_MINUTES) {
    logger.warn('Imsak validation: using MUIS-derived value', {
      aladhanImsak,
      muisSubuh,
      muisImsak: minutesToTime(muisImsakMinutes),
      diffMinutes: diff,
    });
    return minutesToTime(muisImsakMinutes);
  }

  return aladhanImsak;
}

// ============================================================================
// FULL RAMADAN SCHEDULE
// ============================================================================

/**
 * Fetch the full Ramadan schedule (all 29-30 days).
 *
 * Strategy:
 * 1. Fetch MUIS prayer times from Firebase for the month(s) that overlap Ramadan
 * 2. Fetch Aladhan calendar for Imsak times
 * 3. Cross-validate Imsak against MUIS Subuh - 10 minutes
 * 4. Build per-day schedule with special night indicators
 */
export async function fetchRamadanSchedule(
  startDate: string,
  totalDays: number,
  ramadanYear: RamadanYear
): Promise<RamadanDaySchedule[]> {
  const startTime = performance.now();

  logger.info('Fetching full Ramadan schedule', {
    startDate,
    totalDays,
    ramadanYear,
  });

  try {
    const start = new Date(startDate);
    const schedule: RamadanDaySchedule[] = [];

    // Determine which Gregorian months overlap with Ramadan
    const monthsNeeded = new Set<string>();
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(start, i);
      monthsNeeded.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
    }

    // Fetch MUIS times from Firebase for each month
    const muisTimesByDate: Record<string, { subuh: string; maghrib: string; isyak: string; syuruk: string; zohor: string; asar: string }> = {};
    for (const monthKey of monthsNeeded) {
      const [year, month] = monthKey.split('-').map(Number);
      try {
        const firebaseTimes = await fetchMonthlyPrayerTimesFromFirebase(year, month);
        for (const ft of firebaseTimes) {
          const normalized = normalizeFirebaseTime(ft);
          muisTimesByDate[normalized.date] = {
            subuh: normalized.subuh,
            maghrib: normalized.maghrib,
            isyak: normalized.isyak,
            syuruk: normalized.syuruk,
            zohor: normalized.zohor,
            asar: normalized.asar,
          };
        }
      } catch (error) {
        logger.warn('Firebase monthly fetch failed', {
          year,
          month,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }

    // Fetch Aladhan calendar for each overlapping month (for Imsak)
    const aladhanTimesByDate: Record<string, string> = {};
    for (const monthKey of monthsNeeded) {
      const [year, month] = monthKey.split('-').map(Number);
      try {
        const calendar = await fetchMonthlyCalendar(
          year,
          month,
          DEFAULT_LOCATION.latitude,
          DEFAULT_LOCATION.longitude
        );
        for (const day of calendar) {
          const dateStr = format(
            new Date(day.data.date.gregorian.date),
            DATE_FORMATS.ISO
          );
          const imsak = day.data.timings.Imsak;
          if (imsak) {
            aladhanTimesByDate[dateStr] = cleanTimezone(imsak);
          }
        }
      } catch (error) {
        logger.warn('Aladhan calendar fetch failed', {
          year,
          month,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }

    // Build per-day schedule
    for (let i = 0; i < totalDays; i++) {
      const day = i + 1;
      const date = addDays(start, i);
      const dateISO = format(date, DATE_FORMATS.ISO);
      const muisTimes = muisTimesByDate[dateISO];
      const aladhanImsak = aladhanTimesByDate[dateISO];

      // Determine Imsak
      let imsak: string;
      if (aladhanImsak && muisTimes?.subuh) {
        imsak = validateImsak(aladhanImsak, muisTimes.subuh);
      } else if (muisTimes?.subuh) {
        imsak = minutesToTime(timeToMinutes(muisTimes.subuh) - IMSAK_OFFSET_MINUTES);
      } else if (aladhanImsak) {
        imsak = aladhanImsak;
      } else {
        imsak = '05:20'; // Emergency fallback
      }

      schedule.push({
        day,
        hijriDate: `${day} Ramadan ${ramadanYear}`,
        gregorianDate: dateISO,
        imsak,
        subuh: muisTimes?.subuh ?? '05:30',
        syuruk: muisTimes?.syuruk ?? '07:00',
        zohor: muisTimes?.zohor ?? '13:00',
        asar: muisTimes?.asar ?? '16:30',
        maghrib: muisTimes?.maghrib ?? '19:10',
        isyak: muisTimes?.isyak ?? '20:20',
        isSpecialNight: (LAYLATUL_QADR_NIGHTS as readonly number[]).includes(day),
        isLastTenNights: day >= LAST_TEN_NIGHTS_START,
        holidays: [],
      });
    }

    const duration = performance.now() - startTime;
    logger.success('Ramadan schedule built', {
      days: schedule.length,
      duration: `${duration.toFixed(0)}ms`,
      muisDaysAvailable: Object.keys(muisTimesByDate).length,
      aladhanDaysAvailable: Object.keys(aladhanTimesByDate).length,
    });

    return schedule;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Failed to fetch Ramadan schedule', {
      error: error instanceof Error ? error.message : 'Unknown',
      duration: `${duration.toFixed(0)}ms`,
    });

    throw new RamadanServiceError(
      RamadanErrorCode.API_ERROR,
      'Failed to fetch Ramadan schedule',
      error
    );
  }
}

/**
 * Fetch today's Ramadan times (Imsak + Iftar) - lightweight version
 */
export async function fetchTodayRamadanTimes(): Promise<{
  imsak: string;
  iftar: string;
}> {
  const todayISO = format(new Date(), DATE_FORMATS.ISO);

  let muisSubuh: string | null = null;
  let muisMaghrib: string | null = null;

  try {
    const { fetchDailyPrayerTimeFromFirebase } = await import('../../prayer/api/firebase');
    const firebaseData = await fetchDailyPrayerTimeFromFirebase(todayISO);
    if (firebaseData) {
      const normalized = normalizeFirebaseTime(firebaseData);
      muisSubuh = normalized.subuh;
      muisMaghrib = normalized.maghrib;
    }
  } catch (error) {
    logger.warn('Firebase fetch failed for today', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }

  let aladhanImsak: string | null = null;

  try {
    const todayAPI = format(new Date(), DATE_FORMATS.API);
    const response = await fetchPrayerTimesFromAladhan({
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      method: CalculationMethod.SINGAPORE,
      school: School.SHAFI,
      date: todayAPI,
    });

    const imsak = response.data.timings.Imsak;
    if (imsak) {
      aladhanImsak = cleanTimezone(imsak);
    }

    if (!muisMaghrib) {
      muisMaghrib = cleanTimezone(response.data.timings.Maghrib);
    }
    if (!muisSubuh) {
      muisSubuh = cleanTimezone(response.data.timings.Fajr);
    }
  } catch (error) {
    logger.warn('Aladhan fetch failed for today', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }

  let imsak: string;
  if (aladhanImsak && muisSubuh) {
    imsak = validateImsak(aladhanImsak, muisSubuh);
  } else if (muisSubuh) {
    imsak = minutesToTime(timeToMinutes(muisSubuh) - IMSAK_OFFSET_MINUTES);
  } else if (aladhanImsak) {
    imsak = aladhanImsak;
  } else {
    imsak = '05:20';
  }

  const iftar = muisMaghrib ?? '19:10';

  logger.success('Today Ramadan times resolved', { imsak, iftar });

  return { imsak, iftar };
}
