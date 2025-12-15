import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface DoaAfterPrayer {
  id: string;
  arabicText: string;
  englishTranslation: string;
  romanized: string;
  step: number;
  title: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const DOA_QUERY_KEYS = {
  all: ['doa'] as const,
  afterPrayer: ['doa', 'after-prayer'] as const,
};

// ============================================================================
// API FUNCTIONS (MODULAR FIRESTORE)
// ============================================================================

async function fetchDoaAfterPrayer(): Promise<DoaAfterPrayer[]> {
  try {
    console.log('🌐 Fetching Dua after prayer from Firebase');

    const colRef = collection(db, 'DoaAfterPrayer');
    const q = query(colRef, orderBy('step', 'asc'));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn('⚠️ No Dua found in Firebase');
      return [];
    }

    const doas = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<DoaAfterPrayer, 'id'>),
    }));

    console.log(`✅ Retrieved ${doas.length} Dua after prayer`);
    return doas;
  } catch (error) {
    console.error('❌ Error fetching Dua after prayer:', error);
    throw error;
  }
}

async function fetchDoaByStep(step: number): Promise<DoaAfterPrayer | null> {
  try {
    const colRef = collection(db, 'DoaAfterPrayer');
    const q = query(colRef, where('step', '==', step), limit(1));

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const d = snapshot.docs[0];
    return {
      id: d.id,
      ...(d.data() as Omit<DoaAfterPrayer, 'id'>),
    };
  } catch (error) {
    console.error(`❌ Error fetching Dua step ${step}:`, error);
    throw error;
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

export function useDoa() {
  return useQuery({
    queryKey: DOA_QUERY_KEYS.afterPrayer,
    queryFn: async () => {
      const cacheKey = 'doa-after-prayer';
      const cached = cache.get<DoaAfterPrayer[]>(cacheKey);

      if (cached) {
        console.log('🎯 Using cached Dua after prayer');
        return cached;
      }

      const doas = await fetchDoaAfterPrayer();

      // Cache indefinitely - Dua never changes
      cache.set(cacheKey, doas, TTL.ONE_MONTH * 12);

      return doas;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });
}

export function useDoaByStep(step: number) {
  return useQuery({
    queryKey: [...DOA_QUERY_KEYS.afterPrayer, 'step', step] as const,
    queryFn: async () => {
      const cacheKey = `doa-step-${step}`;
      const cached = cache.get<DoaAfterPrayer>(cacheKey);

      if (cached) {
        console.log(`🎯 Using cached Dua step ${step}`);
        return cached;
      }

      const doa = await fetchDoaByStep(step);

      // ✅ Only cache if it exists (avoid caching null + truthy checks)
      if (doa) {
        cache.set(cacheKey, doa, TTL.ONE_MONTH * 12);
      }

      return doa;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    enabled: step >= 1 && step <= 8,
  });
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

export function usePrefetchDoa() {
  const queryClient = useQueryClient();

  return {
    prefetchAll: async () => {
      await queryClient.prefetchQuery({
        queryKey: DOA_QUERY_KEYS.afterPrayer,
        queryFn: fetchDoaAfterPrayer,
        staleTime: Infinity,
      });
    },

    prefetchStep: async (step: number) => {
      await queryClient.prefetchQuery({
        queryKey: [...DOA_QUERY_KEYS.afterPrayer, 'step', step] as const,
        queryFn: () => fetchDoaByStep(step),
        staleTime: Infinity,
      });
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function searchDoa(doas: DoaAfterPrayer[], queryText: string): DoaAfterPrayer[] {
  const lowerQuery = queryText.toLowerCase();
  return doas.filter(
    (doa) =>
      doa.title.toLowerCase().includes(lowerQuery) ||
      doa.englishTranslation.toLowerCase().includes(lowerQuery) ||
      doa.romanized.toLowerCase().includes(lowerQuery)
  );
}

export function getNextDoa(currentStep: number, doas: DoaAfterPrayer[]): DoaAfterPrayer | null {
  const nextStep = currentStep + 1;
  return doas.find((doa) => doa.step === nextStep) || null;
}

export function getPreviousDoa(currentStep: number, doas: DoaAfterPrayer[]): DoaAfterPrayer | null {
  const prevStep = currentStep - 1;
  return doas.find((doa) => doa.step === prevStep) || null;
}

export function formatDoaForSharing(doa: DoaAfterPrayer): string {
  return `
${doa.title}

${doa.arabicText}

${doa.romanized}

${doa.englishTranslation}
  `.trim();
}
