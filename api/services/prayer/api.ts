import { format } from 'date-fns';
import { aladhanClient, handleApiError } from '../../client/http';
import { db } from '../../client/firebase';
import {
  PrayerTimesResponse,
  IslamicDateResponse,
  PrayerTimesParams,
  DailyPrayerTime,
  NormalizedPrayerTimes,
  CalculationMethod,
} from './types';
import { collection, getDocs } from '@react-native-firebase/firestore';

// ============================================================================
// EXTERNAL API CALLS (Aladhan)
// ============================================================================

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

export async function fetchMonthlyPrayerTimesFromFirebase(
  year: number,
  month: number
): Promise<DailyPrayerTime[]> {
  try {
    console.log(`📅 Fetching monthly prayer times for: ${month}/${year}`);

    const monthStr = String(month);
    const yearStr = String(year);

    // ✅ Modular Firestore read
    const snap = await getDocs(collection(db, 'prayerTimes2025'));

    if (snap.empty) {
      throw new Error('No prayer times found in Firebase');
    }

    const prayerTimesList = snap.docs
      .map((d: any) => d.data() as any)
      .filter((pt: any) => {
        // stored format: D/M/YYYY
        const [, prayerMonth, prayerYear] = String(pt.date ?? '').split('/');
        return prayerMonth === monthStr && prayerYear === yearStr;
      })
      .map((pt: any) => {
        const [day] = String(pt.date).split('/');
        return {
          date: day,
          day: parseInt(day, 10),
          subuh: pt.time?.subuh,
          syuruk: pt.time?.syuruk,
          zohor: pt.time?.zohor,
          asar: pt.time?.asar,
          maghrib: pt.time?.maghrib,
          isyak: pt.time?.isyak,
        } as DailyPrayerTime;
      })
      .sort((a: any, b: any) => (a.day ?? 0) - (b.day ?? 0));

    console.log(`✅ Retrieved ${prayerTimesList.length} records for ${month}/${year}`);
    return prayerTimesList;
  } catch (error) {
    console.error('❌ Error fetching monthly prayer times from Firebase:', error);
    throw error;
  }
}

// ============================================================================
// FIREBASE SINGLE DAY QUERY (NEW - MUIS Accurate)
// ============================================================================

/**
 * Fetch prayer times for a specific date from Firebase
 * 
 * @param date - ISO format YYYY-MM-DD (e.g., "2025-12-17")
 * @returns DailyPrayerTime or null if not found
 */
export async function fetchDailyPrayerTimeFromFirebase(
  date: string
): Promise<DailyPrayerTime | null> {
  try {
    console.log(`📅 Fetching Firebase prayer times for: ${date}`);

    // Convert ISO format (YYYY-MM-DD) to Firebase format (D/M/YYYY)
    const [year, month, day] = date.split('-');
    const firebaseDate = `${parseInt(day)}/${parseInt(month)}/${year}`;
    
    console.log(`🔄 Converted ${date} → ${firebaseDate}`);

    // Query Firebase
    const snap = await getDocs(collection(db, 'prayerTimes2025'));

    if (snap.empty) {
      console.warn('⚠️ Firebase prayerTimes2025 collection is empty');
      return null;
    }

    // Find matching date
    const matchingDoc = snap.docs.find((doc: any) => {
      const data = doc.data();
      return data.date === firebaseDate;
    });

    if (!matchingDoc) {
      console.warn(`⚠️ No Firebase data found for ${firebaseDate}`);
      return null;
    }

    const data = matchingDoc.data();
    console.log(`✅ Found Firebase data for ${firebaseDate}:`, data.time);

    return {
      date: firebaseDate,
      day: parseInt(day),
      subuh: data.time?.subuh,
      syuruk: data.time?.syuruk,
      zohor: data.time?.zohor,
      asar: data.time?.asar,
      maghrib: data.time?.maghrib,
      isyak: data.time?.isyak,
    } as DailyPrayerTime;
  } catch (error) {
    console.error('❌ Error fetching daily prayer time from Firebase:', error);
    return null;
  }
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

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

export function getTodayDateForAPI(): string {
  return format(new Date(), 'dd-MM-yyyy');
}

export function getTodayDateISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isToday(dateString: string): boolean {
  const today = getTodayDateISO();
  return dateString === today;
}

export function parseTimeToDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

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