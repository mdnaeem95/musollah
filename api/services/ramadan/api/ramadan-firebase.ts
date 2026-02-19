/**
 * Ramadan Firebase CRUD
 *
 * Firebase Firestore operations for syncing Ramadan tracking data.
 * Fasting/tarawih/quran logs are stored in user documents under
 * `ramadanLogs.{year}` for cross-device persistence.
 *
 * Primary storage is Zustand + MMKV (offline-first).
 * Firebase sync is secondary for backup and cross-device.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { db } from '../../../client/firebase';
import { FIREBASE_COLLECTIONS } from '../../prayer/types/constants';
import type {
  RamadanYear,
  RamadanTrackerState,
} from '../types';
import { RamadanServiceError, RamadanErrorCode } from '../types';
import { createLogger } from '../../../../services/logging/logger';

const logger = createLogger('Ramadan Firebase');

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync local Ramadan tracker state to Firebase.
 * Saves the entire tracker under `ramadanLogs.{year}`.
 */
export async function syncRamadanToFirebase(
  userId: string,
  tracker: RamadanTrackerState
): Promise<void> {
  const startTime = performance.now();

  try {
    if (!userId) {
      logger.warn('Cannot sync: no user ID');
      return;
    }

    const year = tracker.ramadanYear;
    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);

    logger.debug('Syncing Ramadan data to Firebase', {
      userId,
      year,
      fastingDays: Object.keys(tracker.fastingLogs).length,
      tarawihDays: Object.keys(tracker.tarawihLogs).length,
      juzCompleted: Object.values(tracker.quranKhatamLogs).filter((j) => j.completed).length,
    });

    await updateDoc(userRef, {
      [`ramadanLogs.${year}`]: {
        ramadanYear: tracker.ramadanYear,
        ramadanStartGregorian: tracker.ramadanStartGregorian,
        ramadanEndGregorian: tracker.ramadanEndGregorian,
        totalDays: tracker.totalDays,
        fastingLogs: tracker.fastingLogs,
        tarawihLogs: tracker.tarawihLogs,
        quranKhatamLogs: tracker.quranKhatamLogs,
        syncedAt: new Date().toISOString(),
      },
    });

    const duration = performance.now() - startTime;
    logger.success('Ramadan data synced to Firebase', {
      userId,
      year,
      duration: `${duration.toFixed(0)}ms`,
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Failed to sync Ramadan data', {
      error: error instanceof Error ? error.message : 'Unknown',
      userId,
      duration: `${duration.toFixed(0)}ms`,
    });

    throw new RamadanServiceError(
      RamadanErrorCode.FIREBASE_ERROR,
      'Failed to sync Ramadan data to Firebase',
      error
    );
  }
}

/**
 * Fetch Ramadan tracker state from Firebase.
 * Used for restoring data on a new device or after app reinstall.
 */
export async function fetchRamadanFromFirebase(
  userId: string,
  year: RamadanYear
): Promise<RamadanTrackerState | null> {
  const startTime = performance.now();

  try {
    if (!userId) {
      logger.warn('Cannot fetch: no user ID');
      return null;
    }

    logger.debug('Fetching Ramadan data from Firebase', { userId, year });

    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      logger.warn('User document not found', { userId });
      return null;
    }

    const userData = snapshot.data();
    const ramadanData = userData?.ramadanLogs?.[year];

    if (!ramadanData) {
      logger.debug('No Ramadan data for year', { userId, year });
      return null;
    }

    const duration = performance.now() - startTime;
    logger.success('Ramadan data fetched from Firebase', {
      userId,
      year,
      fastingDays: Object.keys(ramadanData.fastingLogs ?? {}).length,
      tarawihDays: Object.keys(ramadanData.tarawihLogs ?? {}).length,
      duration: `${duration.toFixed(0)}ms`,
    });

    return {
      ramadanYear: ramadanData.ramadanYear,
      ramadanStartGregorian: ramadanData.ramadanStartGregorian,
      ramadanEndGregorian: ramadanData.ramadanEndGregorian,
      totalDays: ramadanData.totalDays,
      fastingLogs: ramadanData.fastingLogs ?? {},
      tarawihLogs: ramadanData.tarawihLogs ?? {},
      quranKhatamLogs: ramadanData.quranKhatamLogs ?? {},
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Failed to fetch Ramadan data', {
      error: error instanceof Error ? error.message : 'Unknown',
      userId,
      year,
      duration: `${duration.toFixed(0)}ms`,
    });

    return null;
  }
}
