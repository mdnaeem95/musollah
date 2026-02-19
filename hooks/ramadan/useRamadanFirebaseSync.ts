/**
 * Ramadan Firebase Sync Hook
 *
 * Handles two-way sync between local Zustand store and Firebase:
 * - On mount: restores data from Firebase if local is empty
 * - On changes: debounced sync to Firebase
 *
 * Only runs when user is authenticated.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRamadanStore } from '../../stores/useRamadanStore';
import { useUserId } from '../../stores/useAuthStore';
import {
  useSyncRamadanToFirebase,
  useRestoreRamadanFromFirebase,
} from '../../api/services/ramadan/queries/ramadan-logs';
import type { RamadanYear } from '../../api/services/ramadan/types';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Ramadan Firebase Sync');

const SYNC_DEBOUNCE_MS = 5000;

export function useRamadanFirebaseSync() {
  const userId = useUserId();
  const tracker = useRamadanStore((s) => s.tracker);
  const restoreTracker = useRamadanStore((s) => s.restoreTracker);

  const syncMutation = useSyncRamadanToFirebase();
  const restoreMutation = useRestoreRamadanFromFirebase();

  const hasRestoredRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from Firebase on first mount (if local is empty)
  useEffect(() => {
    if (!userId || hasRestoredRef.current) return;

    const localTracker = useRamadanStore.getState().tracker;
    if (localTracker) {
      // Local data exists, no need to restore
      hasRestoredRef.current = true;
      return;
    }

    hasRestoredRef.current = true;

    // Try to restore - we need the current Hijri year
    // Use a reasonable default year based on current date
    const currentYear = new Date().getFullYear();
    // Hijri year is roughly Gregorian year - 579
    const estimatedHijriYear = (currentYear - 579) as RamadanYear;

    logger.info('Attempting to restore Ramadan data from Firebase', {
      userId,
      estimatedYear: estimatedHijriYear,
    });

    restoreMutation.mutate(
      { userId, year: estimatedHijriYear },
      {
        onSuccess: (data) => {
          if (data) {
            restoreTracker(data);
            logger.success('Ramadan data restored from Firebase');
          } else {
            logger.debug('No Ramadan data found in Firebase');
          }
        },
      }
    );
  }, [userId]);

  // Debounced sync to Firebase when tracker changes
  const syncToFirebase = useCallback(() => {
    const currentTracker = useRamadanStore.getState().tracker;
    if (!userId || !currentTracker) return;

    syncMutation.mutate({ userId, tracker: currentTracker });
  }, [userId, syncMutation]);

  useEffect(() => {
    if (!userId || !tracker) return;

    // Clear previous timer
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    // Debounce sync
    syncTimerRef.current = setTimeout(() => {
      logger.debug('Syncing Ramadan data to Firebase (debounced)');
      syncToFirebase();
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [tracker, userId, syncToFirebase]);
}
