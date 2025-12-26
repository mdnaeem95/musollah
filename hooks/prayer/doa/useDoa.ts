/**
 * Doa Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Better error handling and lifecycle tracking
 * 
 * Custom hook for fetching Dua after prayer data.
 * Wraps TanStack Query service for backward compatibility.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useMemo, useEffect } from 'react';
import { DoaAfterPrayer, useDoa as useDoaService } from '../../../api/services/duaAfterPrayer';

// ✅ Import structured logging
import { createLogger } from '../../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Dua Service');

// ============================================================================
// TYPES
// ============================================================================

interface UseDoaState {
  doas: DoaAfterPrayer[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook for fetching Doa after prayer data
 * Handles loading, error states, and data fetching logic
 * 
 * @returns {UseDoaState} Doa state with data, loading, error, and refetch
 * 
 * @example
 * ```tsx
 * const { doas, loading, error, refetch } = useDoa();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorComponent error={error} />;
 * 
 * return (
 *   <FlatList
 *     data={doas}
 *     renderItem={({ item }) => <DoaCard doa={item} />}
 *   />
 * );
 * ```
 */
export const useDoa = (): UseDoaState => {
  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Dua hook mounted');
    
    return () => {
      logger.debug('Dua hook unmounted');
    };
  }, []);

  const { data, isLoading, error, refetch } = useDoaService();

  // ✅ Log data fetch results
  useEffect(() => {
    if (isLoading) {
      logger.debug('Loading duas...');
      return;
    }

    if (error) {
      logger.error('Failed to load duas', error as Error);
      return;
    }

    if (data) {
      logger.success('Duas loaded', {
        count: data.length,
        hasData: data.length > 0,
        firstDoa: data[0]?.step,
        lastDoa: data[data.length - 1]?.step,
      });
    }
  }, [data, isLoading, error]);

  // ✅ Memoize refetch function with logging
  const handleRefetch = useMemo(() => {
    return async () => {
      logger.info('Refetching duas', {
        currentCount: data?.length ?? 0,
      });
      
      try {
        logger.time('refetch-duas');
        await refetch();
        logger.timeEnd('refetch-duas');
        logger.success('Duas refetched successfully');
      } catch (err) {
        logger.error('Failed to refetch duas', err as Error);
        logger.timeEnd('refetch-duas');
        throw err;
      }
    };
  }, [refetch, data?.length]);

  return {
    doas: data || [],
    loading: isLoading,
    error: error as Error | null,
    refetch: handleRefetch,
  };
};

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export types and utilities for convenience
export type { DoaAfterPrayer } from '../../../api/services/duaAfterPrayer';
export {
  useDoaByStep,
  usePrefetchDoa,
  searchDoa,
  getNextDoa,
  getPreviousDoa,
  formatDoaForSharing,
} from '../../../api/services/duaAfterPrayer';