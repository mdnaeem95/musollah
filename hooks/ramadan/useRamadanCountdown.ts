/**
 * Ramadan Countdown Hook
 *
 * Real-time countdown to the next Suhoor (Imsak) or Iftar (Maghrib).
 * Switches between targets based on current time.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { fetchPrayerTimesFromAladhan } from '../../api/services/prayer/api/aladhan';
import { fetchDailyPrayerTimeFromFirebase } from '../../api/services/prayer/api/firebase';
import { normalizeFirebaseTime } from '../../api/services/prayer/api/transformers';
import {
  CalculationMethod,
  School,
  DEFAULT_LOCATION,
  DATE_FORMATS,
} from '../../api/services/prayer/types/constants';
import { IMSAK_OFFSET_MINUTES, IMSAK_VALIDATION_THRESHOLD_MINUTES } from '../../api/services/ramadan/types/constants';
import { ramadanTimeKeys } from '../../api/services/ramadan/queries/query-keys';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Ramadan Countdown');

interface CountdownState {
  target: 'suhoor' | 'iftar';
  timeRemaining: string;
  imsakTime: string | null;
  iftarTime: string | null;
  isLoading: boolean;
}

/**
 * Parse HH:MM time string to today's Date object
 */
function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Format milliseconds to "Xh Ym Zs" countdown string
 */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '0h 0m';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

/**
 * Validate Aladhan Imsak against MUIS Subuh - 10 minutes
 */
function validateImsak(aladhanImsak: string, muisSubuh: string): string {
  const aladhanMinutes = timeToMinutes(aladhanImsak);
  const muisImsakMinutes = timeToMinutes(muisSubuh) - IMSAK_OFFSET_MINUTES;
  const diff = Math.abs(aladhanMinutes - muisImsakMinutes);

  if (diff > IMSAK_VALIDATION_THRESHOLD_MINUTES) {
    logger.warn('Imsak validation: using MUIS Subuh - 10min', {
      aladhanImsak,
      muisSubuh,
      muisImsak: minutesToTime(muisImsakMinutes),
      diffMinutes: diff,
    });
    return minutesToTime(muisImsakMinutes);
  }

  return aladhanImsak;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Fetch today's Imsak and Iftar times
 */
async function fetchTodayRamadanTimes(): Promise<{
  imsak: string;
  iftar: string;
}> {
  const todayISO = format(new Date(), DATE_FORMATS.ISO);

  // Get MUIS times from Firebase first
  let muisSubuh: string | null = null;
  let muisMaghrib: string | null = null;

  try {
    const firebaseData = await fetchDailyPrayerTimeFromFirebase(todayISO);
    if (firebaseData) {
      const normalized = normalizeFirebaseTime(firebaseData);
      muisSubuh = normalized.subuh;
      muisMaghrib = normalized.maghrib;
    }
  } catch (error) {
    logger.warn('Firebase fetch failed for Ramadan times', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }

  // Get Aladhan data for Imsak
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
      // Clean timezone marker if present
      aladhanImsak = imsak.replace(/\s*\([A-Z]+\)$/, '');
    }

    // Fallback Maghrib from Aladhan if Firebase failed
    if (!muisMaghrib) {
      muisMaghrib = response.data.timings.Maghrib.replace(/\s*\([A-Z]+\)$/, '');
    }
    if (!muisSubuh) {
      muisSubuh = response.data.timings.Fajr.replace(/\s*\([A-Z]+\)$/, '');
    }
  } catch (error) {
    logger.warn('Aladhan fetch failed for Imsak', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }

  // Determine Imsak
  let imsak: string;
  if (aladhanImsak && muisSubuh) {
    imsak = validateImsak(aladhanImsak, muisSubuh);
  } else if (muisSubuh) {
    // Fallback: MUIS Subuh - 10 minutes
    imsak = minutesToTime(timeToMinutes(muisSubuh) - IMSAK_OFFSET_MINUTES);
  } else if (aladhanImsak) {
    imsak = aladhanImsak;
  } else {
    imsak = '05:20'; // Emergency fallback for Singapore
  }

  const iftar = muisMaghrib ?? '19:10'; // Emergency fallback

  logger.success('Ramadan times resolved', { imsak, iftar });

  return { imsak, iftar };
}

// ============================================================================
// HOOK
// ============================================================================

export function useRamadanCountdown(): CountdownState {
  const [countdown, setCountdown] = useState<CountdownState>({
    target: 'iftar',
    timeRemaining: '--:--:--',
    imsakTime: null,
    iftarTime: null,
    isLoading: true,
  });

  const todayStr = format(new Date(), DATE_FORMATS.ISO);

  const { data: times } = useQuery({
    queryKey: ramadanTimeKeys.imsak(todayStr),
    queryFn: fetchTodayRamadanTimes,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
  });

  const timesRef = useRef(times);
  timesRef.current = times;

  const updateCountdown = useCallback(() => {
    const currentTimes = timesRef.current;
    if (!currentTimes) return;

    const now = new Date();
    const imsakDate = parseTimeToDate(currentTimes.imsak);
    const iftarDate = parseTimeToDate(currentTimes.iftar);

    let target: 'suhoor' | 'iftar';
    let msRemaining: number;

    if (now < imsakDate) {
      // Before Imsak: counting down to Suhoor end
      target = 'suhoor';
      msRemaining = imsakDate.getTime() - now.getTime();
    } else if (now < iftarDate) {
      // Between Imsak and Maghrib: counting down to Iftar
      target = 'iftar';
      msRemaining = iftarDate.getTime() - now.getTime();
    } else {
      // After Iftar: counting to tomorrow's Suhoor
      target = 'suhoor';
      const tomorrowImsak = new Date(imsakDate);
      tomorrowImsak.setDate(tomorrowImsak.getDate() + 1);
      msRemaining = tomorrowImsak.getTime() - now.getTime();
    }

    setCountdown({
      target,
      timeRemaining: formatCountdown(msRemaining),
      imsakTime: currentTimes.imsak,
      iftarTime: currentTimes.iftar,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    if (!times) return;

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [times, updateCountdown]);

  return countdown;
}
