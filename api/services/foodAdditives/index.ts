/**
 * Food Additives Service
 * 
 * Manages food additives (E-codes) data with caching.
 */

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

/**
 * Fetch all food additives with caching
 */
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

/**
 * Fetch all food additives with caching
 */
export function useFoodAdditives() {
  return useQuery({
    queryKey: FOOD_ADDITIVES_QUERY_KEYS.list,
    queryFn: getFoodAdditives,
    staleTime: TTL.ONE_DAY, // 24 hours
    gcTime: TTL.ONE_DAY * 7, // Keep in cache for 7 days
    retry: 2,
  });
}

/**
 * Fetch a single food additive by E-code
 */
export function useFoodAdditiveByECode(eCode: string) {
  return useQuery({
    queryKey: FOOD_ADDITIVES_QUERY_KEYS.byECode(eCode),
    queryFn: () => fetchFoodAdditiveByECode(eCode),
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_DAY * 7,
    enabled: !!eCode,
  });
}

/**
 * Fetch food additives by status
 */
export function useFoodAdditivesByStatus(status: string) {
  return useQuery({
    queryKey: FOOD_ADDITIVES_QUERY_KEYS.byStatus(status),
    queryFn: () => fetchFoodAdditivesByStatus(status),
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_DAY * 7,
    enabled: !!status,
  });
}

/**
 * Fetch food additives by category
 */
export function useFoodAdditivesByCategory(category: string) {
  return useQuery({
    queryKey: FOOD_ADDITIVES_QUERY_KEYS.byCategory(category),
    queryFn: () => fetchFoodAdditivesByCategory(category),
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_DAY * 7,
    enabled: !!category,
  });
}

/**
 * Prefetch food additives
 */
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

/**
 * Invalidate food additives cache
 */
export function useInvalidateFoodAdditives() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: FOOD_ADDITIVES_QUERY_KEYS.all,
    });
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Search food additives by chemical name or E-code
 */
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

/**
 * Get status color based on additive status
 */
export function getAdditiveStatusColor(status: string, theme: any): string {
  return status.toLowerCase() === 'ok'
    ? theme.colors.text.success
    : theme.colors.text.error;
}

/**
 * Group additives by status
 */
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

/**
 * Group additives by category
 */
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

/**
 * Get unique categories from additives
 */
export function getUniqueCategories(additives: FoodAdditive[]): string[] {
  const categories = new Set(additives.map((a) => a.category));
  return Array.from(categories).sort();
}

/**
 * Sort additives by E-code (numerical)
 */
export function sortByECode(additives: FoodAdditive[]): FoodAdditive[] {
  return [...additives].sort((a, b) => {
    const numA = parseInt(a.eCode.replace(/\D/g, ''), 10);
    const numB = parseInt(b.eCode.replace(/\D/g, ''), 10);
    return numA - numB;
  });
}