import { format, parse, isValid } from 'date-fns';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import * as Location from 'expo-location';
import { storage } from '../utils/storage'; // Your MMKV storage

import { DailyPrayerTimes, PrayerName, PrayerLog } from '../utils/types/prayer.types';
import { DATE_FORMATS, CACHE_KEYS, CACHE_DURATION } from '../constants/prayer.constants';
import { ApiError } from '../utils/errors';
import { Platform } from 'react-native';
import { updatePrayerTimesWidget } from '../utils/widgetBridge';
import { CalculationMethod, fetchDailyPrayerTimeFromFirebase, fetchPrayerTimes } from '../api/services/prayer';

interface CachedData<T> { data: T; timestamp: number; version: string;}

/**
 * Modern Prayer Service with MMKV storage
 * Follows Single Responsibility Principle
 * Handles prayer times, caching, and Firebase interactions
 */
class ModernPrayerService {
  private readonly API_BASE_URL = 'https://api.aladhan.com/v1';
  private readonly CACHE_VERSION = '2.0.0'; // Incremented for MMKV migration
  private readonly STALE_CACHE_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Get cached data from MMKV (synchronous!)
   */
  private getCachedData<T>(key: string): T | null {
    try {
      const cached = storage.getString(key);
      if (!cached) return null;

      const parsedCache: CachedData<T> = JSON.parse(cached);

      if (parsedCache.version !== this.CACHE_VERSION) {
        storage.delete(key);
        return null;
      }

      const cacheAge = Date.now() - parsedCache.timestamp;
      if (cacheAge > CACHE_DURATION.PRAYER_TIMES) return null;

      return parsedCache.data;
    } catch (error) {
      const raw = storage.getString(key);
      console.error('❌ Cache JSON parse failed (deleting key):', {
        key,
        preview: raw ? raw.slice(0, 80) : raw,
        error,
      });
      storage.delete(key); // ✅ important
      return null;
    }
  }

  /**
   * Get stale cache (up to 7 days old) as fallback
   */
  private getStaleCachedData<T>(key: string): T | null {
    try {
      const cached = storage.getString(key);
      if (!cached) return null;

      const parsedCache: CachedData<T> = JSON.parse(cached);

      const cacheAge = Date.now() - parsedCache.timestamp;
      if (cacheAge < this.STALE_CACHE_THRESHOLD) return parsedCache.data;

      return null;
    } catch (error) {
      const raw = storage.getString(key);
      console.error('❌ Stale cache JSON parse failed (deleting key):', {
        key,
        preview: raw ? raw.slice(0, 80) : raw,
        error,
      });
      storage.delete(key);
      return null;
    }
  }

  /**
   * Set cached data in MMKV (synchronous!)
   */
  private setCachedData<T>(key: string, data: T): void {
    try {
      if (data === undefined) {
        console.warn('⚠️ Refusing to cache undefined. Deleting key:', key);
        storage.delete(key);
        return;
      }

      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };

      const str = JSON.stringify(cacheData);
      if (!str) {
        console.warn('⚠️ JSON.stringify returned empty/undefined. Deleting key:', key);
        storage.delete(key);
        return;
      }

      storage.set(key, str);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Check network connection
   */
  private async checkNetworkConnection(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }
  
  private convertISOToFirebaseDate(isoDate: string): string {
    // ISO: '2025-01-19' → Firebase: '19/1/2025'
    const [year, month, day] = isoDate.split('-');
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
  }

  /**
   * Fetch prayer times for a specific date
   * 
   * ✅ FIXED: Uses Firebase (MUIS) as PRIMARY source, Aladhan as fallback
   * 
   * @param date - ISO format YYYY-MM-DD
   */
  async fetchPrayerTimesForDate(date: string): Promise<DailyPrayerTimes> {
    const cacheKey = `prayer-times-${date}`;

    try {
      // 1️⃣ Check MMKV cache first (fastest)
      const cached = this.getCachedData<DailyPrayerTimes>(cacheKey);
      if (cached) {
        console.log(`✅ MMKV Cache HIT for ${date}`);
        return cached;
      }

      console.log(`⚠️ MMKV Cache MISS for ${date}, fetching from Firebase...`);

      // 2️⃣ Fetch from Firebase (MUIS accurate data - PRIMARY SOURCE)
      const firebaseData = await fetchDailyPrayerTimeFromFirebase(date);
      
      if (firebaseData) {
        console.log(`✅ Firebase data found for ${date}`);
        
        // Convert Firebase format to app format
        const result: DailyPrayerTimes = {
          date,
          hijriDate: '', // ✅ Firebase data doesn't have hijri date, will be populated separately
          prayers: {
            Subuh: firebaseData.subuh || '',
            Syuruk: firebaseData.syuruk || '',
            Zohor: firebaseData.zohor || '',
            Asar: firebaseData.asar || '',
            Maghrib: firebaseData.maghrib || '',
            Isyak: firebaseData.isyak || '',
          },
          location: {
            latitude: 1.3521,
            longitude: 103.8198,
            city: 'Singapore',
            country: 'Singapore',
          },
        };

        // Cache for 24 hours (Firebase data is official)
        this.setCachedData(cacheKey, result);
        
        return result;
      }

      console.warn(`⚠️ No Firebase data for ${date}, falling back to Aladhan API...`);

      // 3️⃣ Fallback to Aladhan API (for dates not in Firebase)
      const [year, month, day] = date.split('-');
      const aladhanDate = `${day}-${month}-${year}`; // DD-MM-YYYY format
      
      const response = await fetchPrayerTimes({
        latitude: 1.3521, // Singapore
        longitude: 103.8198,
        method: CalculationMethod.SINGAPORE,
        date: aladhanDate,
      });

      // Helper function to clean API times (remove timezone suffix)
      const cleanTime = (time: string) => time.split(' ')[0];

      // Format hijri date from API response
      const hijriDate = `${response.data.date.hijri.day} ${response.data.date.hijri.month.en} ${response.data.date.hijri.year}`;

      const result: DailyPrayerTimes = {
        date,
        hijriDate,
        prayers: {
          Subuh: cleanTime(response.data.timings.Fajr),
          Syuruk: cleanTime(response.data.timings.Sunrise),
          Zohor: cleanTime(response.data.timings.Dhuhr),
          Asar: cleanTime(response.data.timings.Asr),
          Maghrib: cleanTime(response.data.timings.Maghrib),
          Isyak: cleanTime(response.data.timings.Isha),
        },
        location: {
          latitude: response.data.meta.latitude,
          longitude: response.data.meta.longitude,
          city: 'Singapore',
          country: 'Singapore',
        },
      };

      // Cache for 1 hour (API data is less reliable)
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error) {
      console.error(`❌ Error fetching prayer times for ${date}:`, error);
      
      // Last resort: Check if we have any cached data (even if stale)
      const staleCache = this.getCachedData<DailyPrayerTimes>(cacheKey);
      if (staleCache) {
        console.warn(`⚠️ Returning stale cache for ${date}`);
        return staleCache;
      }

      throw new Error(`Failed to fetch prayer times for ${date}`);
    }
  }

  /**
   * Fetch prayer times by location
   */
  async fetchPrayerTimesByLocation(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<DailyPrayerTimes> {
    const targetDate = date || format(new Date(), DATE_FORMATS.API);
    const cacheKey = `${CACHE_KEYS.PRAYER_TIMES}_${latitude}_${longitude}_${targetDate}`;
    
    try {
      // Check cache
      const cached = this.getCachedData<DailyPrayerTimes>(cacheKey);
      if (cached) {
        console.log('✅ Cache hit (location):', targetDate);
        return cached;
      }

      // Fetch from API
      const response = await fetch(
        `${this.API_BASE_URL}/timings/${targetDate}?latitude=${latitude}&longitude=${longitude}&method=11`
      );

      if (!response.ok) {
        throw new ApiError(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200) {
        throw new ApiError(data.data || 'Unknown API error');
      }

      // Get location details
      const locationDetails = await this.reverseGeocode(latitude, longitude);

      // Transform data
      const prayerTimes: DailyPrayerTimes = {
        date: targetDate,
        hijriDate: this.formatIslamicDate(data.data.date.hijri),
        prayers: {
          [PrayerName.SUBUH]: data.data.timings.Fajr.split(' ')[0],
          [PrayerName.SYURUK]: data.data.timings.Sunrise.split(' ')[0],
          [PrayerName.ZOHOR]: data.data.timings.Dhuhr.split(' ')[0],
          [PrayerName.ASAR]: data.data.timings.Asr.split(' ')[0],
          [PrayerName.MAGHRIB]: data.data.timings.Maghrib.split(' ')[0],
          [PrayerName.ISYAK]: data.data.timings.Isha.split(' ')[0],
        },
        location: {
          latitude,
          longitude,
          ...locationDetails,
        },
      };

      // Cache result
      this.setCachedData(cacheKey, prayerTimes);

      return prayerTimes;
    } catch (error) {
      console.error('❌ Error fetching by location:', error);
      
      // Try stale cache
      const staleCache = this.getStaleCachedData<DailyPrayerTimes>(cacheKey);
      if (staleCache) {
        console.log('⚠️ Using stale cache (location error)');
        return staleCache;
      }

      throw error;
    }
  }

  /**
   * Fetch Islamic date
   */
  private islamicDateInFlight = new Map<string, Promise<string>>();
  private readonly instanceId = Math.random().toString(16).slice(2);

  private async fetchIslamicDate(gregorianDateISO: string): Promise<string> {
    // ✅ DEDUPE: if same date requested concurrently, reuse promise
    console.log('🧩 prayerService instance:', this.instanceId);
    const existing = this.islamicDateInFlight.get(gregorianDateISO);
    if (existing) return existing;

    const task = (async () => {
      console.log('📅 Fetching Islamic date for:', gregorianDateISO);

      try {
        const parsedDate = parse(gregorianDateISO, DATE_FORMATS.API, new Date());
        if (!isValid(parsedDate)) return 'Invalid date';

        const formattedDate = format(parsedDate, DATE_FORMATS.ISLAMIC_API);
        const url = `${this.API_BASE_URL}/gToH/${formattedDate}`;

        const response = await fetch(url);
        const contentType = response.headers.get('content-type') || 'unknown';
        console.log('📡 Response status:', response.status, 'content-type:', contentType);

        // Read as text first (most debuggable)
        const rawStr = await response.text();

        // ✅ Make logs safe even if something weird happens
        const rawSafe = typeof rawStr === 'string' ? rawStr : String(rawStr);
        if (__DEV__) {
          console.log('🧾 gToH raw preview:', rawSafe.slice(0, 200));
          console.log('🧾 gToH raw length:', rawSafe.length);
        }

        // If not OK, log body and bail
        if (!response.ok) {
          console.error('❌ gToH non-OK:', response.status, rawSafe.slice(0, 300));
          return `API error: ${response.status}`;
        }

        // ✅ Handle the exact failure you're seeing
        if (rawSafe.trim() === 'undefined' || rawSafe.trim() === '') {
          console.error('❌ gToH returned empty/undefined body (200). URL:', url);
          return 'Unable to fetch Islamic date';
        }

        // Parse JSON
        let json: any;
        try {
          json = JSON.parse(rawSafe);
        } catch {
          console.error('❌ gToH returned non-JSON body (despite 200):', rawSafe.slice(0, 300));
          return 'Unable to fetch Islamic date';
        }

        return this.formatIslamicDate(json?.data?.hijri);
      } catch (error) {
        console.error('❌ fetchIslamicDate error:', error);
        return 'Unable to fetch Islamic date';
      } finally {
        this.islamicDateInFlight.delete(gregorianDateISO);
      }
    })();

    this.islamicDateInFlight.set(gregorianDateISO, task);
    return task;
  }

  /**
   * Format Islamic date
   */
  private formatIslamicDate(hijriData: any): string {
    try {
      const { day, month, year } = hijriData;
      return `${day} ${month.en} ${year}`;
    } catch {
      return 'Invalid Islamic date';
    }
  }

  /**
   * Reverse geocode coordinates to location
   */
  private async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{ city: string; country: string }> {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (result.length > 0) {
        const location = result[0];
        return {
          city: location.city || location.district || 'Unknown',
          country: location.country || 'Unknown',
        };
      }

      return { city: 'Unknown', country: 'Unknown' };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { city: 'Unknown', country: 'Unknown' };
    }
  }

  /**
   * Fetch monthly prayer times
   */
  async fetchMonthlyPrayerTimes(
    year: number,
    month: number
  ): Promise<DailyPrayerTimes[]> {
    const cacheKey = `${CACHE_KEYS.MONTHLY_TIMES}_${year}_${month}`;
    
    try {
      // Check cache
      const cached = this.getCachedData<DailyPrayerTimes[]>(cacheKey);
      if (cached) {
        console.log('✅ Cache hit (monthly):', `${month}/${year}`);
        return cached;
      }

      console.log(`📅 Fetching monthly times: ${month}/${year}`);

      // Query Firebase
      const snapshot = await firestore()
        .collection('prayerTimes2025')
        .get();

      const monthlyData: DailyPrayerTimes[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const [day, docMonth, docYear] = data.date.split('/').map(Number);

        if (docMonth === month && docYear === year) {
          monthlyData.push({
            date: format(new Date(year, month - 1, day), DATE_FORMATS.API),
            hijriDate: '',
            prayers: {
              [PrayerName.SUBUH]: data.time.subuh,
              [PrayerName.SYURUK]: data.time.syuruk,
              [PrayerName.ZOHOR]: data.time.zohor,
              [PrayerName.ASAR]: data.time.asar,
              [PrayerName.MAGHRIB]: data.time.maghrib,
              [PrayerName.ISYAK]: data.time.isyak,
            },
          });
        }
      });

      // Sort by date
      monthlyData.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Cache
      this.setCachedData(cacheKey, monthlyData);

      // ✅ UPDATE WIDGET with monthly data
      if (Platform.OS === 'ios' && monthlyData.length > 0) {
        try {
          await updatePrayerTimesWidget(monthlyData);
          console.log('✅ Widget updated with monthly data');
        } catch (widgetError) {
          console.error('⚠️ Widget update failed:', widgetError);
          // Don't throw - widget update failure shouldn't break prayer times fetch
        }
      }

      return monthlyData;
    } catch (error) {
      console.error('❌ Error fetching monthly times:', error);
      
      // Try stale cache
      const staleCache = this.getStaleCachedData<DailyPrayerTimes[]>(cacheKey);
      if (staleCache) {
        console.log('⚠️ Using stale cache (monthly error)');
        return staleCache;
      }

      throw error;
    }
  }

  /**
   * Save prayer log to Firebase
   */
  async savePrayerLog(log: Omit<PrayerLog, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const logWithTimestamps: PrayerLog = {
        ...log,
        createdAt: now,
        updatedAt: now,
      };

      await firestore()
        .collection('prayerLogs')
        .doc(`${log.userId}_${log.date}`)
        .set(logWithTimestamps, { merge: true });

      // Invalidate cache
      const cacheKey = `${CACHE_KEYS.PRAYER_LOGS}_${log.userId}_${log.date}`;
      storage.delete(cacheKey);
      
      console.log('✅ Prayer log saved');
    } catch (error) {
      console.error('❌ Error saving prayer log:', error);
      throw error;
    }
  }

  /**
   * Fetch prayer log from Firebase
   */
  async fetchPrayerLog(userId: string, date: string): Promise<PrayerLog | null> {
    const cacheKey = `${CACHE_KEYS.PRAYER_LOGS}_${userId}_${date}`;
    
    try {
      // Check cache
      const cached = this.getCachedData<PrayerLog>(cacheKey);
      if (cached) return cached;

      const doc = await firestore()
        .collection('prayerLogs')
        .doc(`${userId}_${date}`)
        .get();

      if (!doc.exists) return null;

      const log = doc.data() as PrayerLog;
      
      // Cache result
      this.setCachedData(cacheKey, log);

      return log;
    } catch (error) {
      console.error('❌ Error fetching prayer log:', error);
      throw error;
    }
  }

  /**
   * Clear all prayer caches
   */
  clearCache(): void {
    try {
      const keys = storage.getAllKeys();
      const prayerKeys = keys.filter(key => 
        Object.values(CACHE_KEYS).some(cacheKey => key.includes(cacheKey))
      );
      
      prayerKeys.forEach(key => storage.delete(key));
      console.log('✅ Prayer cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Prefetch prayer times for multiple dates
   * Useful for offline support
   */
  async prefetchPrayerTimes(dates: string[]): Promise<void> {
    console.log('🔄 Prefetching prayer times...');
    
    const promises = dates.map(date => 
      this.fetchPrayerTimesForDate(date).catch(err => {
        console.warn(`Failed to prefetch ${date}:`, err);
        return null;
      })
    );

    await Promise.all(promises);
    console.log('✅ Prefetch complete');
  }
}

export const modernPrayerService = new ModernPrayerService();