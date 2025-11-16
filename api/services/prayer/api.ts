/**
 * Prayer Service API
 * 
 * API functions for fetching prayer times and Islamic dates.
 * Uses Aladhan API as the external data source.
 */

import { format } from 'date-fns';
import { aladhanClient, handleApiError } from '../../client/http';
import { db } from '../../client/firebase';
import {
  PrayerTimesResponse,
  IslamicDateResponse,
  PrayerTimesParams,
  DailyPrayerTime,
  MonthlyPrayerTimes,
  NormalizedPrayerTimes,
  CalculationMethod,
} from './types';

// ============================================================================
// EXTERNAL API CALLS (Aladhan)
// ============================================================================

/**
 * Fetch prayer times for a specific location and date
 * 
 * @param params - Location coordinates and optional calculation parameters
 * @returns Prayer times for the specified location and date
 */
export async function fetchPrayerTimes(
  params: PrayerTimesParams
): Promise<PrayerTimesResponse> {
  try {
    const { latitude, longitude, method = CalculationMethod.SINGAPORE, school = 0, date } = params;
    
    const response = await aladhanClient.get<PrayerTimesResponse>('/timings', {
      params: {
        latitude,
        longitude,
        method,
        school,
        ...(date && { date }), // Optional date parameter
      },
    });

    return response.data;
  } catch (error) {
    handleApiError(error, 'fetchPrayerTimes');
  }
}

/**
 * Convert Gregorian date to Islamic (Hijri) date
 * 
 * @param date - Gregorian date in DD-MM-YYYY format
 * @returns Islamic date information
 */
export async function convertToIslamicDate(
  date: string
): Promise<IslamicDateResponse> {
  try {
    const response = await aladhanClient.get<IslamicDateResponse>(
      `/gToH/${date}`
    );

    return response.data;
  } catch (error) {
    handleApiError(error, 'convertToIslamicDate');
  }
}

/**
 * Fetch prayer times for today at a specific location
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Today's prayer times
 */
export async function fetchTodayPrayerTimes(
  latitude: number,
  longitude: number
): Promise<PrayerTimesResponse> {
  return fetchPrayerTimes({
    latitude,
    longitude,
    method: CalculationMethod.SINGAPORE,
  });
}

/**
 * Fetch prayer times for a specific date
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param date - Date object to fetch prayer times for
 * @returns Prayer times for the specified date
 */
export async function fetchPrayerTimesByDate(
  latitude: number,
  longitude: number,
  date: Date
): Promise<PrayerTimesResponse> {
  const formattedDate = format(date, 'dd-MM-yyyy');
  
  return fetchPrayerTimes({
    latitude,
    longitude,
    date: formattedDate,
    method: CalculationMethod.SINGAPORE,
  });
}

// ============================================================================
// FIREBASE QUERIES (Legacy - to be migrated)
// ============================================================================

/**
 * Fetch monthly prayer times from Firebase
 * 
 * @deprecated Use client-side calculations instead
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Array of daily prayer times for the month
 */
export async function fetchMonthlyPrayerTimesFromFirebase(
  year: number,
  month: number
): Promise<DailyPrayerTime[]> {
  try {
    console.log(`📅 Fetching monthly prayer times for: ${month}/${year}`);

    const monthStr = month.toString();
    
    const snapshot = await db
      .collection('prayerTimes2025')
      .get();

    if (snapshot.empty) {
      throw new Error('No prayer times found in Firebase');
    }

    const prayerTimesList = snapshot.docs
      .map(doc => doc.data() as any)
      .filter(prayerTime => {
        // Extract month from stored date format (D/M/YYYY)
        const [, prayerMonth, prayerYear] = prayerTime.date.split('/');
        return prayerMonth === monthStr && prayerYear === year.toString();
      })
      .map(prayerTime => {
        const [day] = prayerTime.date.split('/');
        return {
          date: day,
          day: parseInt(day, 10),
          subuh: prayerTime.time.subuh,
          syuruk: prayerTime.time.syuruk,
          zohor: prayerTime.time.zohor,
          asar: prayerTime.time.asar,
          maghrib: prayerTime.time.maghrib,
          isyak: prayerTime.time.isyak,
        };
      })
      .sort((a, b) => a.day! - b.day!);

    console.log(`✅ Retrieved ${prayerTimesList.length} records for ${month}/${year}`);
    return prayerTimesList;
  } catch (error) {
    console.error('❌ Error fetching monthly prayer times from Firebase:', error);
    throw error;
  }
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Normalize prayer times from Aladhan format to app format
 * 
 * @param data - Aladhan prayer times data
 * @returns Normalized prayer times
 */
export function normalizePrayerTimes(
  data: PrayerTimesResponse['data']
): NormalizedPrayerTimes {
  return {
    date: data.date.gregorian.date,
    fajr: data.timings.Fajr,
    sunrise: data.timings.Sunrise,
    dhuhr: data.timings.Dhuhr,
    asr: data.timings.Asr,
    maghrib: data.timings.Maghrib,
    isha: data.timings.Isha,
  };
}

/**
 * Convert local format prayer times to normalized format
 * 
 * @param localTime - Prayer time in local format (subuh, syuruk, etc.)
 * @returns Normalized prayer times
 */
export function normalizeLocalPrayerTimes(
  localTime: DailyPrayerTime
): NormalizedPrayerTimes {
  return {
    date: localTime.date,
    fajr: localTime.subuh,
    sunrise: localTime.syuruk,
    dhuhr: localTime.zohor,
    asr: localTime.asar,
    maghrib: localTime.maghrib,
    isha: localTime.isyak,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current date in DD-MM-YYYY format (Aladhan API format)
 */
export function getTodayDateForAPI(): string {
  return format(new Date(), 'dd-MM-yyyy');
}

/**
 * Get current date in YYYY-MM-DD format (ISO format)
 */
export function getTodayDateISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Check if prayer times are for today
 */
export function isToday(dateString: string): boolean {
  const today = getTodayDateISO();
  return dateString === today;
}

/**
 * Parse time string (HH:MM) to Date object for today
 */
export function parseTimeToDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Get next prayer based on current time
 */
export function getNextPrayer(prayerTimes: NormalizedPrayerTimes): {
  name: string;
  time: string;
} | null {
  const now = new Date();
  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Sunrise', time: prayerTimes.sunrise },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha },
  ];

  for (const prayer of prayers) {
    const prayerTime = parseTimeToDate(prayer.time);
    if (prayerTime > now) {
      return prayer;
    }
  }

  // If no prayer left today, return first prayer of next day
  return { name: 'Fajr', time: prayerTimes.fajr };
}