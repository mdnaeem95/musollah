import { format, parse, subDays, isValid } from 'date-fns';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import * as Location from 'expo-location';
import { storage } from '../utils/storage'; // Your MMKV storage

import { DailyPrayerTimes, PrayerName, PrayerLog } from '../utils/types/prayer.types';
import { DATE_FORMATS, CACHE_KEYS, CACHE_DURATION } from '../constants/prayer.constants';
import { ApiError, NetworkError, ValidationError } from '../utils/errors';

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
      
      // Check version compatibility
      if (parsedCache.version !== this.CACHE_VERSION) {
        storage.delete(key);
        return null;
      }

      // Check if cache is still valid
      const now = Date.now();
      const cacheAge = now - parsedCache.timestamp;
      
      if (cacheAge > CACHE_DURATION.PRAYER_TIMES) {
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.error('Cache read error:', error);
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
      const now = Date.now();
      const cacheAge = now - parsedCache.timestamp;

      // Return stale cache only if it's not too old
      if (cacheAge < this.STALE_CACHE_THRESHOLD) {
        return parsedCache.data;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Set cached data in MMKV (synchronous!)
   */
  private setCachedData<T>(key: string, data: T): void {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };
      storage.set(key, JSON.stringify(cacheData));
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

  /**
   * Validate and format date
   */
  private validateAndFormatDate(dateString: string, inputFormat: string): string {
    const parsedDate = parse(dateString, inputFormat, new Date());
    
    if (!isValid(parsedDate)) {
      throw new ValidationError(`Invalid date: ${dateString}`);
    }

    return format(parsedDate, DATE_FORMATS.API);
  }

  /**
   * Fetch prayer times for a specific date
   * Cache-first strategy with stale-while-revalidate
   */
  async fetchPrayerTimesForDate(date: string): Promise<DailyPrayerTimes> {
    const cacheKey = `${CACHE_KEYS.PRAYER_TIMES}_${date}`;

    try {
      // 1. Check fresh cache first (synchronous!)
      const cached = this.getCachedData<DailyPrayerTimes>(cacheKey);
      if (cached) {
        console.log('✅ Cache hit (fresh):', date);
        return cached;
      }

      // 2. Check network
      const isOnline = await this.checkNetworkConnection();
      
      if (!isOnline) {
        // Try stale cache as fallback
        const staleCache = this.getStaleCachedData<DailyPrayerTimes>(cacheKey);
        if (staleCache) {
          console.log('⚠️ Using stale cache (offline):', date);
          return staleCache;
        }
        throw new NetworkError('No internet connection and no cached data');
      }

      // 3. Fetch from Firebase
      console.log('🔄 Fetching from Firebase:', date);
      const snapshot = await firestore()
        .collection('prayerTimes2025')
        .where('date', '==', date)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Try stale cache as fallback
        const staleCache = this.getStaleCachedData<DailyPrayerTimes>(cacheKey);
        if (staleCache) {
          console.log('⚠️ Using stale cache (no data):', date);
          return staleCache;
        }
        throw new ApiError(`No prayer times found for date: ${date}`);
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // 4. Transform and validate data
      const prayerTimes: DailyPrayerTimes = {
        date: this.validateAndFormatDate(date, DATE_FORMATS.FIREBASE),
        hijriDate: await this.fetchIslamicDate(date),
        prayers: {
          [PrayerName.SUBUH]: data.time.subuh,
          [PrayerName.SYURUK]: data.time.syuruk,
          [PrayerName.ZOHOR]: data.time.zohor,
          [PrayerName.ASAR]: data.time.asar,
          [PrayerName.MAGHRIB]: data.time.maghrib,
          [PrayerName.ISYAK]: data.time.isyak,
        },
      };

      // 5. Cache the result (synchronous!)
      this.setCachedData(cacheKey, prayerTimes);
      console.log('✅ Cached successfully:', date);

      return prayerTimes;
    } catch (error) {
      console.error('❌ Error fetching prayer times:', error);
      
      // Last resort: try stale cache
      const staleCache = this.getStaleCachedData<DailyPrayerTimes>(cacheKey);
      if (staleCache) {
        console.log('⚠️ Using stale cache (error):', date);
        return staleCache;
      }

      throw error;
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
  private async fetchIslamicDate(gregorianDate: string): Promise<string> {
    try {
      const adjustedDate = subDays(
        parse(gregorianDate, DATE_FORMATS.FIREBASE, new Date()),
        1
      );
      const formattedDate = format(adjustedDate, DATE_FORMATS.ISLAMIC_API);

      const response = await fetch(
        `${this.API_BASE_URL}/gToH/${formattedDate}`
      );

      if (!response.ok) {
        throw new ApiError(`Islamic date API failed: ${response.status}`);
      }

      const data = await response.json();
      return this.formatIslamicDate(data.data.hijri);
    } catch (error) {
      console.error('Error fetching Islamic date:', error);
      return 'Unable to fetch Islamic date';
    }
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