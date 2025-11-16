import { useState, useEffect, useCallback } from 'react';
import { getDoaAfterPrayer } from '../../../api/firebase';
import type { DoaAfterPrayer } from '../../../types/doa.types';

interface UseDoaState {
  doas: DoaAfterPrayer[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching Doa after prayer data
 * Handles loading, error states, and data fetching logic
 */
export const useDoa = (): UseDoaState => {
  const [doas, setDoas] = useState<DoaAfterPrayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDoas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDoaAfterPrayer();
      setDoas(data);
    } catch (err) {
      console.error('Error fetching doas:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch doas'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoas();
  }, [fetchDoas]);

  return {
    doas,
    loading,
    error,
    refetch: fetchDoas,
  };
};