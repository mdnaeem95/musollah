import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFoodAdditives, fetchFoodAdditiveByECode, fetchFoodAdditivesByStatus, fetchFoodAdditivesByCategory } from './queries';
import { FoodAdditive } from '../../../utils/types';
import { cache, TTL } from '../../client/storage';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY = 'food-additives';

// ============================================================================
// QUERY KEYS
// ============================================================================

const FOOD_ADDITIVES_QUERY_KEYS = {
  all: ['foodAdditives'] as const,
  list: ['foodAdditives', 'list'] as const,
  byECode: (eCode: string) => ['foodAdditives', 'eCode', eCode] as const,
  byStatus: (status: string) => ['foodAdditives', 'status', status] as const,
  byCategory: (category: string) => ['foodAdditives', 'category', category] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function getFoodAdditives(): Promise<FoodAdditive[]> {
  try {
    // Check MMKV cache first
    const cached = cache.get<FoodAdditive[]>(CACHE_KEY);
    if (cached) {
      console.log('⚡ Using cached food additives');
      return cached;
    }

    // Fetch from Firebase
    console.log('🌐 Fetching food additives from Firebase');
    const additives = await fetchFoodAdditives();

    // Cache for 24 hours
    cache.set(CACHE_KEY, additives, TTL.ONE_DAY);

    return additives;
  } catch (error) {
    console.error('❌ Error fetching food additives:', error);
    throw error;
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

export function useFoodAdditives() {
  return useQuery({
    queryKey: FOOD_ADDITIVES_QUERY_KEYS.list,
    queryFn: getFoodAdditives,
    staleTime: TTL.ONE_DAY, // 24 hours
    gcTime: TTL.ONE_DAY * 7, // Keep in cache for 7 days
    retry: 2,
  });
}

export function useFoodAdditiveByECode(eCode: string) {
  return useQuery({
    queryKey: FOOD_ADDITIVES_QUERY_KEYS.byECode(eCode),
    queryFn: () => fetchFoodAdditiveByECode(eCode),
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_DAY * 7,
    enabled: !!eCode,
  });
}

export function useFoodAdditivesByStatus(status: string) {
  return useQuery({
    queryKey: FOOD_ADDITIVES_QUERY_KEYS.byStatus(status),
    queryFn: () => fetchFoodAdditivesByStatus(status),
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_DAY * 7,
    enabled: !!status,
  });
}

export function useFoodAdditivesByCategory(category: string) {
  return useQuery({
    queryKey: FOOD_ADDITIVES_QUERY_KEYS.byCategory(category),
    queryFn: () => fetchFoodAdditivesByCategory(category),
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_DAY * 7,
    enabled: !!category,
  });
}

export function usePrefetchFoodAdditives() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: FOOD_ADDITIVES_QUERY_KEYS.list,
      queryFn: getFoodAdditives,
      staleTime: TTL.ONE_DAY,
    });
  };
}

export function useInvalidateFoodAdditives() {
  const queryClient = useQueryClient();

  return () => {
    cache.clear(CACHE_KEY); // ✅ clear MMKV cache too
    queryClient.invalidateQueries({ queryKey: FOOD_ADDITIVES_QUERY_KEYS.all });
  };
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function searchFoodAdditives(
  additives: FoodAdditive[],
  query: string
): FoodAdditive[] {
  if (!query.trim()) return additives;

  const lowerQuery = query.toLowerCase();
  return additives.filter(
    (additive) =>
      additive.chemicalName.toLowerCase().includes(lowerQuery) ||
      additive.eCode.toLowerCase().includes(lowerQuery) ||
      additive.category.toLowerCase().includes(lowerQuery)
  );
}

export function getAdditiveStatusColor(status: string, theme: any): string {
  return status.toLowerCase() === 'ok'
    ? theme.colors.text.success
    : theme.colors.text.error;
}

export function groupAdditivesByStatus(additives: FoodAdditive[]): {
  ok: FoodAdditive[];
  notOk: FoodAdditive[];
} {
  return additives.reduce(
    (acc, additive) => {
      if (additive.status.toLowerCase() === 'ok') {
        acc.ok.push(additive);
      } else {
        acc.notOk.push(additive);
      }
      return acc;
    },
    { ok: [] as FoodAdditive[], notOk: [] as FoodAdditive[] }
  );
}

export function groupAdditivesByCategory(
  additives: FoodAdditive[]
): Record<string, FoodAdditive[]> {
  return additives.reduce((acc, additive) => {
    const category = additive.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(additive);
    return acc;
  }, {} as Record<string, FoodAdditive[]>);
}

export function getUniqueCategories(additives: FoodAdditive[]): string[] {
  const categories = new Set(additives.map((a) => a.category));
  return Array.from(categories).sort();
}

export function sortByECode(additives: FoodAdditive[]): FoodAdditive[] {
  return [...additives].sort((a, b) => {
    const numA = parseInt(a.eCode.replace(/\D/g, ''), 10);
    const numB = parseInt(b.eCode.replace(/\D/g, ''), 10);
    return numA - numB;
  });
}