/**
 * Doa Hook
 * 
 * Custom hook for fetching Dua after prayer data.
 * Wraps TanStack Query service for backward compatibility.
 */

import { useMemo } from 'react';
import { DoaAfterPrayer, useDoa as useDoaService } from '../../../api/services/duaAfterPrayer';

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
  const { data, isLoading, error, refetch } = useDoaService();

  // Memoize refetch function to maintain referential equality
  const handleRefetch = useMemo(() => {
    return async () => {
      await refetch();
    };
  }, [refetch]);

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