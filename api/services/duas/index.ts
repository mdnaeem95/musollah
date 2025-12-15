import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

import { collection, getDocs, orderBy, query } from '@react-native-firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface Doa {
  number: string;
  title: string;
  arabicText: string;
  romanizedText: string;
  englishTranslation: string;
  source: string;
}

// ============================================================================
// API FUNCTIONS (MODULAR FIRESTORE)
// ============================================================================

async function fetchDoas(): Promise<Doa[]> {
  const colRef = collection(db, 'doas');
  const q = query(colRef, orderBy('number', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d: any) => d.data() as Doa);
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const DOAS_QUERY_KEYS = {
  all: ['doas'] as const,
  detail: (number: string) => ['doas', 'detail', number] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

export function useDoas() {
  return useQuery({
    queryKey: DOAS_QUERY_KEYS.all,
    queryFn: async () => {
      const cacheKey = 'doas-all';
      const cached = cache.get<Doa[]>(cacheKey);

      if (cached) {
        console.log('⚡ Using cached duas');
        return cached;
      }

      console.log('🌐 Fetching duas from Firebase');
      const doas = await fetchDoas();

      cache.set(cacheKey, doas, TTL.ONE_WEEK);
      return doas;
    },
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_WEEK,
  });
}

export function useDoa(number: string) {
  const { data: doas } = useDoas();
  return doas?.find((doa) => doa.number === number);
}

export function usePrefetchDoas() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: DOAS_QUERY_KEYS.all,
      queryFn: fetchDoas,
      staleTime: TTL.ONE_DAY,
    });
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function searchDoas(doas: Doa[], queryText: string): Doa[] {
  const lowerQuery = queryText.toLowerCase().trim();
  if (!lowerQuery) return doas;

  return doas.filter(
    (doa) =>
      doa.title.toLowerCase().includes(lowerQuery) ||
      doa.number.includes(lowerQuery)
  );
}