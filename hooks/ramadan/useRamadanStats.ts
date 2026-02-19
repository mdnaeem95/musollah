/**
 * Ramadan Stats Hook
 *
 * Computes comprehensive stats from the Ramadan store.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { useMemo } from 'react';
import { useRamadanStore } from '../../stores/useRamadanStore';
import { useRamadanDetection } from './useRamadanDetection';
import { computeRamadanStats } from '../../api/services/ramadan/api/transformers';
import type { RamadanStats } from '../../api/services/ramadan/types';

/**
 * Returns computed Ramadan stats derived from the tracker state.
 * Memoized to avoid unnecessary recomputation.
 */
export function useRamadanStats(): RamadanStats | null {
  const tracker = useRamadanStore((s) => s.tracker);
  const { data: detection } = useRamadanDetection();

  return useMemo(() => {
    if (!tracker) return null;
    const currentDay = detection?.currentDay ?? 0;
    return computeRamadanStats(tracker, currentDay);
  }, [tracker, detection?.currentDay]);
}
