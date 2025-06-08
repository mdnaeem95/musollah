// services/prayer.service.ts
import { format, parse, subDays, isValid } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import * as Location from 'expo-location';

import {
  DailyPrayerTimes,
  PrayerName,
  IslamicDate,
  PrayerLog,
} from '../utils/types/prayer.types';
import {
  DATE_FORMATS,
  CACHE_KEYS,
  CACHE_DURATION,
} from '../constants/prayer.constants';
import { ApiError, NetworkError, ValidationError } from '../utils/errors';

interface CachedData<T> {
  data: T;
  timestamp: number;
  version: string;
}

class PrayerService {
  private readonly API_BASE_URL = 'https://api.aladhan.com/v1';
  private readonly CACHE_VERSION = '1.0.0';

  // Cache management
  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const parsedCache: CachedData<T> = JSON.parse(cached);
      
      // Check version compatibility
      if (parsedCache.version !== this.CACHE_VERSION) {
        await AsyncStorage.removeItem(key);
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

  private async setCachedData<T>(key: string, data: T): Promise<void> {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Network check
  private async checkNetworkConnection(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  // Date validation and formatting
  private validateAndFormatDate(dateString: string, inputFormat: string): string {
    const parsedDate = parse(dateString, inputFormat, new Date());
    
    if (!isValid(parsedDate)) {
      throw new ValidationError(`Invalid date: ${dateString}`);
    }

    return format(parsedDate, DATE_FORMATS.API);
  }

  // Fetch prayer times from Firebase
  async fetchPrayerTimesForDate(date: string): Promise<DailyPrayerTimes> {
    try {
      // Check cache first
      const cacheKey = `${CACHE_KEYS.PRAYER_TIMES}_${date}`;
      const cached = await this.getCachedData<DailyPrayerTimes>(cacheKey);
      
      if (cached) {
        console.log('✅ Returning cached prayer times for:', date);
        return cached;
      }

      // Check network
      const isOnline = await this.checkNetworkConnection();
      if (!isOnline) {
        throw new NetworkError('No internet connection');
      }

      console.log('🔍 Fetching prayer times from Firebase for:', date);

      // Query Firebase
      const snapshot = await firestore()
        .collection('prayerTimes2025')
        .where('date', '==', date)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new ApiError(`No prayer times found for date: ${date}`);
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // Transform Firebase data to our format
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

      // Cache the result
      await this.setCachedData(cacheKey, prayerTimes);

      return prayerTimes;
    } catch (error) {
      console.error('❌ Error fetching prayer times:', error);
      
      // Try to return stale cache if available
      const cacheKey = `${CACHE_KEYS.PRAYER_TIMES}_${date}`;
      const staleCache = await AsyncStorage.getItem(cacheKey);
      
      if (staleCache) {
        console.log('⚠️ Returning stale cache due to error');
        const parsed = JSON.parse(staleCache);
        return parsed.data;
      }

      throw error;
    }
  }

  // Fetch prayer times by location
  async fetchPrayerTimesByLocation(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<DailyPrayerTimes> {
    try {
      const targetDate = date || format(new Date(), DATE_FORMATS.API);
      const cacheKey = `${CACHE_KEYS.PRAYER_TIMES}_${latitude}_${longitude}_${targetDate}`;
      
      // Check cache
      const cached = await this.getCachedData<DailyPrayerTimes>(cacheKey);
      if (cached) return cached;

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
      await this.setCachedData(cacheKey, prayerTimes);

      return prayerTimes;
    } catch (error) {
      console.error('❌ Error fetching prayer times by location:', error);
      throw error;
    }
  }

  // Fetch Islamic date
  private async fetchIslamicDate(gregorianDate: string): Promise<string> {
    try {
      // Format date for API (subtract one day for accurate Islamic date)
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

  // Format Islamic date
  private formatIslamicDate(hijriData: any): string {
    try {
      const { day, month, year } = hijriData;
      return `${day} ${month.en} ${year}`;
    } catch {
      return 'Invalid Islamic date';
    }
  }

  // Reverse geocoding for location
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

  // Fetch monthly prayer times
  async fetchMonthlyPrayerTimes(
    year: number,
    month: number
  ): Promise<DailyPrayerTimes[]> {
    try {
      const cacheKey = `${CACHE_KEYS.MONTHLY_TIMES}_${year}_${month}`;
      
      // Check cache
      const cached = await this.getCachedData<DailyPrayerTimes[]>(cacheKey);
      if (cached) return cached;

      console.log(`📅 Fetching monthly prayer times for ${month}/${year}`);

      // Query Firebase for the entire month
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
            hijriDate: '', // Will be filled if needed
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

      // Cache with longer duration for monthly data
      await this.setCachedData(cacheKey, monthlyData);

      return monthlyData;
    } catch (error) {
      console.error('❌ Error fetching monthly prayer times:', error);
      throw error;
    }
  }

  // Save prayer log
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
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('❌ Error saving prayer log:', error);
      throw error;
    }
  }

  // Fetch prayer log
  async fetchPrayerLog(userId: string, date: string): Promise<PrayerLog | null> {
    try {
      const cacheKey = `${CACHE_KEYS.PRAYER_LOGS}_${userId}_${date}`;
      
      // Check cache
      const cached = await this.getCachedData<PrayerLog>(cacheKey);
      if (cached) return cached;

      const doc = await firestore()
        .collection('prayerLogs')
        .doc(`${userId}_${date}`)
        .get();

      if (!doc.exists) return null;

      const log = doc.data() as PrayerLog;
      
      // Cache the result
      await this.setCachedData(cacheKey, log);

      return log;
    } catch (error) {
      console.error('❌ Error fetching prayer log:', error);
      throw error;
    }
  }

  // Clear all caches
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prayerKeys = keys.filter(key => 
        Object.values(CACHE_KEYS).some(cacheKey=> key.includes(cacheKey))
      );
      
      await AsyncStorage.multiRemove(prayerKeys);
      console.log('✅ Prayer cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
}

export const prayerService = new PrayerService();