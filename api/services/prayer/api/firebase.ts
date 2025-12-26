/**
 * Firebase API Client
 * 
 * All Firebase Firestore queries for prayer-related data.
 * 
 * Features:
 * - Prayer times queries from year-specific collections
 * - Prayer log management with nested field updates
 * - Weekly prayer log fetching with date range filtering
 * - Prayer statistics calculation (completion rate, streaks)
 * - User document validation
 * - Performance tracking for all Firestore operations
 * 
 * Data Structure:
 * - Prayer times: Collection per year (prayerTimes2025, etc.)
 * - Prayer logs: Nested in user documents under prayerLogs.{date}
 * - Date format: Firebase uses D/M/YYYY, app uses YYYY-MM-DD
 * 
 * @version 4.0
 * @since 2025-12-24
 */

import { collection, getDocs, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { DailyPrayerTime, PrayerLog, PrayerServiceError, PrayerErrorCode } from '../types/index';
import { FIREBASE_COLLECTIONS, getPrayerTimesCollection, ERROR_MESSAGES } from '../types/constants';
import { db } from '../../../client/firebase';
import { logger } from '../../../../services/logging/logger';

// ============================================================================
// PRAYER TIMES QUERIES
// ============================================================================

/**
 * Fetch daily prayer times from Firebase for a specific date
 * 
 * Firebase stores dates in D/M/YYYY format (e.g., "22/12/2025"). This function
 * converts ISO format (YYYY-MM-DD) to Firebase format and searches the
 * appropriate year collection for matching prayer times.
 * 
 * @param date - ISO format date string (YYYY-MM-DD)
 * @returns Daily prayer time or null if not found
 * @throws {PrayerServiceError} On Firebase errors
 * 
 * @example
 * ```ts
 * const times = await fetchDailyPrayerTimeFromFirebase('2025-12-22');
 * console.log(times?.subuh); // "05:30"
 * ```
 */
export async function fetchDailyPrayerTimeFromFirebase(
  date: string
): Promise<DailyPrayerTime | null> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching prayer times from Firebase', {
      dateISO: date,
      source: 'Firestore',
    });

    // Convert ISO format (YYYY-MM-DD) to Firebase format (D/M/YYYY)
    const [year, month, day] = date.split('-');
    const firebaseDate = `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;

    logger.debug('Date format converted', {
      from: date,
      to: firebaseDate,
      format: 'D/M/YYYY',
    });

    // Get collection for the year
    const collectionName = getPrayerTimesCollection(parseInt(year, 10));
    const prayerTimesRef = collection(db, collectionName);

    logger.debug('Querying Firebase collection', {
      collection: collectionName,
      targetDate: firebaseDate,
    });

    // Fetch all documents (Firebase doesn't support direct lookup by date field)
    const queryStart = performance.now();
    const snapshot = await getDocs(prayerTimesRef);
    const queryDuration = performance.now() - queryStart;

    logger.debug('Firestore query complete', {
      collection: collectionName,
      documentsRetrieved: snapshot.size,
      isEmpty: snapshot.empty,
      duration: `${queryDuration.toFixed(0)}ms`,
    });

    if (snapshot.empty) {
      logger.warn('Firebase collection is empty', {
        collection: collectionName,
        year: parseInt(year, 10),
        duration: `${(performance.now() - startTime).toFixed(0)}ms`,
      });
      return null;
    }

    // Find matching document
    const searchStart = performance.now();
    const matchingDoc = snapshot.docs.find((document: any) => {
      const data = document.data();
      return data.date === firebaseDate;
    });
    const searchDuration = performance.now() - searchStart;

    logger.debug('Document search complete', {
      targetDate: firebaseDate,
      found: !!matchingDoc,
      documentsSearched: snapshot.size,
      duration: `${searchDuration.toFixed(0)}ms`,
    });

    if (!matchingDoc) {
      logger.warn('No prayer times found for date', {
        firebaseDate,
        dateISO: date,
        collection: collectionName,
        documentsSearched: snapshot.size,
        duration: `${(performance.now() - startTime).toFixed(0)}ms`,
      });
      return null;
    }

    const data = matchingDoc.data();
    const prayerCount = Object.keys(data.time || {}).length;

    const totalDuration = performance.now() - startTime;

    logger.success('Prayer times fetched from Firebase', {
      date: firebaseDate,
      dateISO: date,
      prayers: prayerCount,
      collection: collectionName,
      duration: `${totalDuration.toFixed(0)}ms`,
      source: 'Firestore',
    });

    return {
      date: firebaseDate,
      subuh: data.time?.subuh,
      syuruk: data.time?.syuruk,
      zohor: data.time?.zohor,
      asar: data.time?.asar,
      maghrib: data.time?.maghrib,
      isyak: data.time?.isyak,
      source: 'firebase' as const,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to fetch prayer times from Firebase', {
      error: error instanceof Error ? error.message : 'Unknown error',
      dateISO: date,
      duration: `${duration.toFixed(0)}ms`,
    });

    throw new PrayerServiceError(
      PrayerErrorCode.FIREBASE_ERROR,
      ERROR_MESSAGES.FIREBASE_ERROR,
      error
    );
  }
}

/**
 * Fetch monthly prayer times from Firebase
 * 
 * More efficient than fetching day-by-day. Retrieves all documents from the
 * year collection and filters by month. Returns sorted array of daily prayer
 * times for the specified month.
 * 
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Array of daily prayer times for the month
 * @throws {PrayerServiceError} On Firebase errors
 * 
 * @example
 * ```ts
 * const times = await fetchMonthlyPrayerTimesFromFirebase(2025, 12);
 * console.log(times.length); // 31 (for December)
 * ```
 */
export async function fetchMonthlyPrayerTimesFromFirebase(
  year: number,
  month: number
): Promise<DailyPrayerTime[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching monthly prayer times from Firebase', {
      year,
      month,
      source: 'Firestore',
    });

    const monthStr = String(month);
    const yearStr = String(year);

    // Get collection for the year
    const collectionName = getPrayerTimesCollection(year);
    const prayerTimesRef = collection(db, collectionName);

    logger.debug('Querying Firebase collection', {
      collection: collectionName,
      targetMonth: month,
      targetYear: year,
    });

    // Fetch all documents
    const queryStart = performance.now();
    const snapshot = await getDocs(prayerTimesRef);
    const queryDuration = performance.now() - queryStart;

    logger.debug('Firestore query complete', {
      collection: collectionName,
      documentsRetrieved: snapshot.size,
      isEmpty: snapshot.empty,
      duration: `${queryDuration.toFixed(0)}ms`,
    });

    if (snapshot.empty) {
      const duration = performance.now() - startTime;
      
      logger.warn('Firebase collection is empty', {
        collection: collectionName,
        year,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      throw new PrayerServiceError(
        PrayerErrorCode.NOT_FOUND,
        ERROR_MESSAGES.NOT_FOUND
      );
    }

    // Filter and map documents for the specified month
    const filterStart = performance.now();
    const prayerTimesList = snapshot.docs
      .map((document: any) => document.data())
      .filter((prayerTime: any) => {
        // Firebase format: D/M/YYYY
        const [, prayerMonth, prayerYear] = String(prayerTime.date ?? '').split('/');
        return prayerMonth === monthStr && prayerYear === yearStr;
      })
      .map((prayerTime: any) => {
        const [day] = String(prayerTime.date).split('/');
        return {
          date: prayerTime.date,
          subuh: prayerTime.time?.subuh || '',
          syuruk: prayerTime.time?.syuruk || '',
          zohor: prayerTime.time?.zohor || '',
          asar: prayerTime.time?.asar || '',
          maghrib: prayerTime.time?.maghrib || '',
          isyak: prayerTime.time?.isyak || '',
          source: 'firebase' as const,
        } satisfies DailyPrayerTime;
      })
      .sort((a: any, b: any) => (a.day ?? 0) - (b.day ?? 0)); // Sort by day
    
    const filterDuration = performance.now() - filterStart;

    logger.debug('Monthly data filtered and sorted', {
      totalDocuments: snapshot.size,
      matchingDays: prayerTimesList.length,
      filterDuration: `${filterDuration.toFixed(0)}ms`,
    });

    const totalDuration = performance.now() - startTime;

    logger.success('Monthly prayer times fetched from Firebase', {
      year,
      month,
      days: prayerTimesList.length,
      collection: collectionName,
      duration: `${totalDuration.toFixed(0)}ms`,
      source: 'Firestore',
    });

    return prayerTimesList;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to fetch monthly prayer times', {
      error: error instanceof Error ? error.message : 'Unknown error',
      year,
      month,
      duration: `${duration.toFixed(0)}ms`,
    });

    if (error instanceof PrayerServiceError) {
      throw error;
    }

    throw new PrayerServiceError(
      PrayerErrorCode.FIREBASE_ERROR,
      ERROR_MESSAGES.FIREBASE_ERROR,
      error
    );
  }
}

// ============================================================================
// PRAYER LOGS QUERIES
// ============================================================================

/**
 * Fetch prayer log for a specific user and date
 * 
 * Retrieves prayer completion status for a user on a specific date. Prayer
 * logs are stored as nested objects in the user document under prayerLogs.{date}.
 * 
 * @param userId - User ID
 * @param date - ISO format date (YYYY-MM-DD)
 * @returns Prayer log or null if not found
 * @throws {PrayerServiceError} On Firebase errors
 * 
 * @example
 * ```ts
 * const log = await fetchPrayerLog('user123', '2025-12-22');
 * console.log(log?.prayers.Subuh); // true/false
 * ```
 */
export async function fetchPrayerLog(
  userId: string,
  date: string
): Promise<PrayerLog | null> {
  const startTime = performance.now();
  
  try {
    if (!userId) {
      logger.error('User ID required for prayer log fetch', {
        date,
      });
      
      throw new PrayerServiceError(
        PrayerErrorCode.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    logger.debug('Fetching prayer log from Firebase', {
      userId,
      date,
      collection: FIREBASE_COLLECTIONS.USERS,
    });

    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
    
    const queryStart = performance.now();
    const userSnapshot = await getDoc(userRef);
    const queryDuration = performance.now() - queryStart;

    logger.debug('User document fetched', {
      userId,
      exists: userSnapshot.exists(),
      duration: `${queryDuration.toFixed(0)}ms`,
    });

    if (!userSnapshot.exists()) {
      const duration = performance.now() - startTime;
      
      logger.warn('User document not found', {
        userId,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      return null;
    }

    const userData = userSnapshot.data();
    const prayers = userData?.prayerLogs?.[date];

    if (!prayers) {
      const duration = performance.now() - startTime;
      
      logger.debug('No prayer log for date', {
        userId,
        date,
        hasPrayerLogs: !!userData?.prayerLogs,
        totalLogs: Object.keys(userData?.prayerLogs || {}).length,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      return null;
    }

    const totalDuration = performance.now() - startTime;
    const completedPrayers = Object.values(prayers).filter(Boolean).length;
    const totalPrayers = Object.keys(prayers).length;

    logger.success('Prayer log fetched from Firebase', {
      userId,
      date,
      prayers: totalPrayers,
      completed: completedPrayers,
      completionRate: totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0,
      duration: `${totalDuration.toFixed(0)}ms`,
    });

    return {
      userId,
      date,
      prayers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to fetch prayer log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      date,
      duration: `${duration.toFixed(0)}ms`,
    });

    if (error instanceof PrayerServiceError) {
      throw error;
    }

    throw new PrayerServiceError(
      PrayerErrorCode.FIREBASE_ERROR,
      ERROR_MESSAGES.FIREBASE_ERROR,
      error
    );
  }
}

/**
 * Save prayer log for a user and date
 * 
 * Uses Firestore's nested object update to avoid overwriting other dates.
 * Updates the specific date's prayer completion status while preserving
 * all other prayer logs.
 * 
 * @param userId - User ID
 * @param date - ISO format date (YYYY-MM-DD)
 * @param prayers - Prayer completion status
 * @returns Saved prayer log
 * @throws {PrayerServiceError} On Firebase errors
 * 
 * @example
 * ```ts
 * const log = await savePrayerLog('user123', '2025-12-22', {
 *   Subuh: true,
 *   Zohor: true,
 *   Asar: false,
 *   Maghrib: true,
 *   Isyak: true,
 * });
 * ```
 */
export async function savePrayerLog(
  userId: string,
  date: string,
  prayers: PrayerLog['prayers']
): Promise<PrayerLog> {
  const startTime = performance.now();
  
  try {
    if (!userId) {
      logger.error('User ID required for prayer log save', {
        date,
      });
      
      throw new PrayerServiceError(
        PrayerErrorCode.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    const completedPrayers = Object.values(prayers).filter(Boolean).length;
    const totalPrayers = Object.keys(prayers).length;

    logger.debug('Saving prayer log to Firebase', {
      userId,
      date,
      prayers: totalPrayers,
      completed: completedPrayers,
      updatePath: `prayerLogs.${date}`,
    });

    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);

    // Use nested field update to avoid overwriting other dates
    const updateStart = performance.now();
    await updateDoc(userRef, {
      [`prayerLogs.${date}`]: prayers,
    });
    const updateDuration = performance.now() - updateStart;

    const totalDuration = performance.now() - startTime;

    logger.success('Prayer log saved to Firebase', {
      userId,
      date,
      prayers: totalPrayers,
      completed: completedPrayers,
      completionRate: totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0,
      updateDuration: `${updateDuration.toFixed(0)}ms`,
      totalDuration: `${totalDuration.toFixed(0)}ms`,
    });

    return {
      userId,
      date,
      prayers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to save prayer log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      date,
      duration: `${duration.toFixed(0)}ms`,
    });

    if (error instanceof PrayerServiceError) {
      throw error;
    }

    throw new PrayerServiceError(
      PrayerErrorCode.FIREBASE_ERROR,
      ERROR_MESSAGES.FIREBASE_ERROR,
      error
    );
  }
}

/**
 * Fetch weekly prayer logs for a user
 * 
 * Returns logs for a date range (typically 7 days). Filters all user prayer
 * logs to only include dates within the specified range.
 * 
 * @param userId - User ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Object with date keys and prayer completion values
 * @throws {PrayerServiceError} On Firebase errors
 * 
 * @example
 * ```ts
 * const logs = await fetchWeeklyPrayerLogs('user123', '2025-12-15', '2025-12-21');
 * console.log(Object.keys(logs).length); // Up to 7 days
 * ```
 */
export async function fetchWeeklyPrayerLogs(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, PrayerLog['prayers']>> {
  const startTime = performance.now();
  
  try {
    if (!userId) {
      logger.error('User ID required for weekly logs fetch', {
        startDate,
        endDate,
      });
      
      throw new PrayerServiceError(
        PrayerErrorCode.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    logger.debug('Fetching weekly prayer logs from Firebase', {
      userId,
      startDate,
      endDate,
      dateRange: `${startDate} to ${endDate}`,
    });

    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
    
    const queryStart = performance.now();
    const userSnapshot = await getDoc(userRef);
    const queryDuration = performance.now() - queryStart;

    logger.debug('User document fetched', {
      userId,
      exists: userSnapshot.exists(),
      duration: `${queryDuration.toFixed(0)}ms`,
    });

    if (!userSnapshot.exists()) {
      const duration = performance.now() - startTime;
      
      logger.warn('User document not found for weekly logs', {
        userId,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      return {};
    }

    const userData = userSnapshot.data();
    const allLogs = userData?.prayerLogs || {};
    const totalLogs = Object.keys(allLogs).length;

    logger.debug('Filtering logs by date range', {
      totalLogs,
      startDate,
      endDate,
    });

    // Filter logs within date range
    const filterStart = performance.now();
    const weeklyLogs: Record<string, PrayerLog['prayers']> = {};
    let filteredCount = 0;

    Object.keys(allLogs).forEach((date) => {
      if (date >= startDate && date <= endDate) {
        weeklyLogs[date] = allLogs[date];
        filteredCount++;
      }
    });
    
    const filterDuration = performance.now() - filterStart;

    const totalDuration = performance.now() - startTime;

    logger.success('Weekly prayer logs fetched from Firebase', {
      userId,
      totalLogs,
      daysInRange: filteredCount,
      dateRange: `${startDate} to ${endDate}`,
      filterDuration: `${filterDuration.toFixed(0)}ms`,
      totalDuration: `${totalDuration.toFixed(0)}ms`,
    });

    return weeklyLogs;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to fetch weekly prayer logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      startDate,
      endDate,
      duration: `${duration.toFixed(0)}ms`,
    });

    if (error instanceof PrayerServiceError) {
      throw error;
    }

    throw new PrayerServiceError(
      PrayerErrorCode.FIREBASE_ERROR,
      ERROR_MESSAGES.FIREBASE_ERROR,
      error
    );
  }
}

// ============================================================================
// STATISTICS QUERIES
// ============================================================================

/**
 * Calculate prayer statistics for a user
 * 
 * Analyzes all prayer logs to calculate comprehensive statistics including:
 * - Total prayers logged across all days
 * - Completion rate (percentage of prayers completed)
 * - Current streak (consecutive days with all prayers completed)
 * - Longest streak (all-time record)
 * 
 * @param userId - User ID
 * @returns Prayer statistics
 * @throws {PrayerServiceError} On Firebase errors
 * 
 * @example
 * ```ts
 * const stats = await calculatePrayerStats('user123');
 * console.log(`${stats.completionRate}% completion rate`);
 * console.log(`Current streak: ${stats.currentStreak} days`);
 * ```
 */
export async function calculatePrayerStats(
  userId: string
): Promise<{
  totalPrayers: number;
  completedPrayers: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}> {
  const startTime = performance.now();
  
  try {
    if (!userId) {
      logger.error('User ID required for stats calculation', {});
      
      throw new PrayerServiceError(
        PrayerErrorCode.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    logger.debug('Calculating prayer stats from Firebase', {
      userId,
    });

    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
    
    const queryStart = performance.now();
    const userSnapshot = await getDoc(userRef);
    const queryDuration = performance.now() - queryStart;

    logger.debug('User document fetched for stats', {
      userId,
      exists: userSnapshot.exists(),
      duration: `${queryDuration.toFixed(0)}ms`,
    });

    if (!userSnapshot.exists()) {
      const duration = performance.now() - startTime;
      
      logger.warn('User document not found for stats', {
        userId,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      return {
        totalPrayers: 0,
        completedPrayers: 0,
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
      };
    }

    const userData = userSnapshot.data();
    const prayerLogs = userData?.prayerLogs || {};
    const totalDays = Object.keys(prayerLogs).length;

    logger.debug('Analyzing prayer logs for stats', {
      totalDays,
    });

    let totalPrayers = 0;
    let completedPrayers = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Sort dates chronologically
    const calcStart = performance.now();
    const sortedDates = Object.keys(prayerLogs).sort();

    sortedDates.forEach((date, index) => {
      const prayers = prayerLogs[date];
      const prayerNames = Object.keys(prayers);
      const completedCount = Object.values(prayers).filter(Boolean).length;

      totalPrayers += prayerNames.length;
      completedPrayers += completedCount;

      // Check if all prayers completed (for streak)
      const isFullyCompleted = completedCount === prayerNames.length;
      
      if (isFullyCompleted) {
        tempStreak++;
        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }

      if (index % 10 === 0 && index > 0) {
        logger.debug('Stats calculation progress', {
          processedDays: index,
          totalDays,
          currentStreak: tempStreak,
        });
      }
    });
    
    const calcDuration = performance.now() - calcStart;

    const completionRate =
      totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;

    const stats = {
      totalPrayers,
      completedPrayers,
      currentStreak,
      longestStreak,
      completionRate,
    };

    const totalDuration = performance.now() - startTime;

    logger.success('Prayer stats calculated', {
      userId,
      totalDays,
      totalPrayers,
      completedPrayers,
      currentStreak,
      longestStreak,
      completionRate: `${completionRate}%`,
      calcDuration: `${calcDuration.toFixed(0)}ms`,
      totalDuration: `${totalDuration.toFixed(0)}ms`,
    });

    return stats;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to calculate prayer stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      duration: `${duration.toFixed(0)}ms`,
    });

    if (error instanceof PrayerServiceError) {
      throw error;
    }

    throw new PrayerServiceError(
      PrayerErrorCode.FIREBASE_ERROR,
      ERROR_MESSAGES.FIREBASE_ERROR,
      error
    );
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if user document exists in Firestore
 * 
 * Lightweight check to verify user document existence before performing
 * prayer log operations.
 * 
 * @param userId - User ID
 * @returns True if user exists
 * 
 * @example
 * ```ts
 * const exists = await checkUserExists('user123');
 * if (!exists) {
 *   console.log('User not found');
 * }
 * ```
 */
export async function checkUserExists(userId: string): Promise<boolean> {
  const startTime = performance.now();
  
  try {
    logger.debug('Checking user existence', {
      userId,
    });

    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
    const userSnapshot = await getDoc(userRef);
    
    const duration = performance.now() - startTime;
    const exists = userSnapshot.exists();

    logger.debug('User existence check complete', {
      userId,
      exists,
      duration: `${duration.toFixed(0)}ms`,
    });

    return exists;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.warn('Failed to check user existence', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      duration: `${duration.toFixed(0)}ms`,
    });
    
    return false;
  }
}

/**
 * Get all years with prayer time data in Firebase
 * 
 * Useful for showing available years in UI. Currently returns hardcoded
 * list but can be extended to dynamically check collections.
 * 
 * @returns Array of available years
 * 
 * @example
 * ```ts
 * const years = await getAvailablePrayerTimeYears();
 * console.log(years); // [2025]
 * ```
 */
export async function getAvailablePrayerTimeYears(): Promise<number[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching available prayer time years');

    // For now, we only have 2025
    // TODO: Dynamically check collections when we have multiple years
    const years = [2025];

    const duration = performance.now() - startTime;

    logger.debug('Available years fetched', {
      years,
      count: years.length,
      duration: `${duration.toFixed(0)}ms`,
    });

    return years;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.warn('Failed to fetch available years, using defaults', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(0)}ms`,
    });
    
    return [2025];
  }
}