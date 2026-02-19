/**
 * Ramadan Log Mutation Hooks
 *
 * TanStack Query mutations for syncing Ramadan logs to Firebase.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ramadanLogKeys } from './query-keys';
import {
  syncRamadanToFirebase,
  fetchRamadanFromFirebase,
} from '../api/ramadan-firebase';
import type { RamadanTrackerState, RamadanYear } from '../types';
import { createLogger } from '../../../../services/logging/logger';

const logger = createLogger('Ramadan Log Mutations');

/**
 * Mutation to sync local Ramadan tracker state to Firebase.
 */
export function useSyncRamadanToFirebase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      tracker,
    }: {
      userId: string;
      tracker: RamadanTrackerState;
    }) => syncRamadanToFirebase(userId, tracker),
    onSuccess: (_, variables) => {
      logger.success('Ramadan data synced', {
        userId: variables.userId,
        year: variables.tracker.ramadanYear,
      });
      queryClient.invalidateQueries({
        queryKey: ramadanLogKeys.user(variables.userId),
      });
    },
    onError: (error) => {
      logger.error('Sync mutation failed', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    },
  });
}

/**
 * Mutation to restore Ramadan data from Firebase.
 */
export function useRestoreRamadanFromFirebase() {
  return useMutation({
    mutationFn: ({
      userId,
      year,
    }: {
      userId: string;
      year: RamadanYear;
    }) => fetchRamadanFromFirebase(userId, year),
    onSuccess: (data) => {
      if (data) {
        logger.success('Ramadan data restored from Firebase', {
          year: data.ramadanYear,
          fastingDays: Object.keys(data.fastingLogs).length,
        });
      }
    },
    onError: (error) => {
      logger.error('Restore mutation failed', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    },
  });
}
