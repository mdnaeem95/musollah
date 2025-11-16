/**
 * Duas Service
 * Replaces doasSlice.ts
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  category?: string;
  reference?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchDuas(): Promise<Dua[]> {
  const snapshot = await db.collection('duas').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Dua[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const DUAS_QUERY_KEYS = {
  all: ['duas'] as const,
  detail: (id: string) => ['duas', 'detail', id] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

export function useDuas() {
  return useQuery({
    queryKey: DUAS_QUERY_KEYS.all,
    queryFn: async () => {
      const cacheKey = 'duas';
      const cached = cache.get<Dua[]>(cacheKey);
      
      if (cached) {
        console.log('⚡ Using cached duas');
        return cached;
      }

      console.log('🌐 Fetching duas from Firebase');
      const duas = await fetchDuas();
      
      cache.set(cacheKey, duas, TTL.ONE_WEEK);
      return duas;
    },
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_WEEK,
  });
}

export function usePrefetchDuas() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: DUAS_QUERY_KEYS.all,
      queryFn: fetchDuas,
      staleTime: TTL.ONE_DAY,
    });
  };
}