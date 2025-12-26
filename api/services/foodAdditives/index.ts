/**
 * Food Additives Service - Structured Logging Version
 * 
 * Manages halal food additive (E-code) data with TanStack Query hooks,
 * MMKV caching, and comprehensive utilities for searching and filtering.
 * 
 * @version 2.0 - Structured logging migration
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFoodAdditives, fetchFoodAdditiveByECode, fetchFoodAdditivesByStatus, fetchFoodAdditivesByCategory } from './queries';
import { FoodAdditive } from "../../../functions/src/types";
import { cache, TTL } from '../../client/storage';
import { logger } from '../../../services/logging/logger';

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
 * Gets food additives with MMKV caching
 * 
 * @async
 * @function getFoodAdditives
 * @returns {Promise<FoodAdditive[]>} Array of all food additives
 * @throws {Error} If Firebase fetch fails
 * 
 * Cache Strategy:
 * - MMKV: 24 hours
 * - Stale time: 24 hours
 * - GC time: 7 days
 */
async function getFoodAdditives(): Promise<FoodAdditive[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Getting food additives', { cacheKey: CACHE_KEY });

    // Check MMKV cache first
    const cached = cache.get<FoodAdditive[]>(CACHE_KEY);
    if (cached) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('Using cached food additives', {
        count: cached.length,
        cacheKey: CACHE_KEY,
        source: 'MMKV',
        duration: `${duration}ms`,
      });
      return cached;
    }

    logger.debug('Cache miss - fetching from Firebase', { cacheKey: CACHE_KEY });

    // Fetch from Firebase
    const additives = await fetchFoodAdditives();
    const duration = Math.round(performance.now() - startTime);

    logger.success('Food additives fetched and cached', {
      count: additives.length,
      duration: `${duration}ms`,
      cacheKey: CACHE_KEY,
      ttl: '24 hours',
    });

    // Cache for 24 hours
    cache.set(CACHE_KEY, additives, TTL.ONE_DAY);

    return additives;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to get food additives', {
      error: error.message,
      duration: `${duration}ms`,
      cacheKey: CACHE_KEY,
    });
    
    throw error;
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all food additives
 * 
 * @function useFoodAdditives
 * @returns {UseQueryResult<FoodAdditive[]>} Query result with food additives
 * 
 * @example
 * const { data: additives, isLoading } = useFoodAdditives();
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
 * Hook to fetch food additive by E-code
 * 
 * @function useFoodAdditiveByECode
 * @param {string} eCode - E-code to search for (e.g., "100", "200")
 * @returns {UseQueryResult<FoodAdditive | null>} Query result
 * 
 * @example
 * const { data: additive } = useFoodAdditiveByECode('100');
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
 * Hook to fetch food additives by status
 * 
 * @function useFoodAdditivesByStatus
 * @param {string} status - Status to filter by ("Ok" or "Not Ok")
 * @returns {UseQueryResult<FoodAdditive[]>} Query result
 * 
 * @example
 * const { data: halalAdditives } = useFoodAdditivesByStatus('Ok');
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
 * Hook to fetch food additives by category
 * 
 * @function useFoodAdditivesByCategory
 * @param {string} category - Category to filter by (e.g., "Antioxidant")
 * @returns {UseQueryResult<FoodAdditive[]>} Query result
 * 
 * @example
 * const { data: antioxidants } = useFoodAdditivesByCategory('Antioxidant');
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
 * Hook to prefetch food additives
 * 
 * @function usePrefetchFoodAdditives
 * @returns {Function} Prefetch function
 * 
 * @example
 * const prefetch = usePrefetchFoodAdditives();
 * await prefetch();
 */
export function usePrefetchFoodAdditives() {
  const queryClient = useQueryClient();
  const startTime = performance.now();

  return async () => {
    logger.debug('Prefetching food additives');

    await queryClient.prefetchQuery({
      queryKey: FOOD_ADDITIVES_QUERY_KEYS.list,
      queryFn: getFoodAdditives,
      staleTime: TTL.ONE_DAY,
    });

    const duration = Math.round(performance.now() - startTime);
    logger.success('Food additives prefetched', {
      duration: `${duration}ms`,
    });
  };
}

/**
 * Hook to invalidate food additives cache
 * 
 * @function useInvalidateFoodAdditives
 * @returns {Function} Invalidate function
 * 
 * @example
 * const invalidate = useInvalidateFoodAdditives();
 * invalidate();
 */
export function useInvalidateFoodAdditives() {
  const queryClient = useQueryClient();

  return () => {
    logger.info('Invalidating food additives cache', {
      cacheKey: CACHE_KEY,
    });

    cache.clear(CACHE_KEY); // Clear MMKV cache
    queryClient.invalidateQueries({ queryKey: FOOD_ADDITIVES_QUERY_KEYS.all });

    logger.success('Food additives cache invalidated');
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Searches food additives by E-code, chemical name, or category
 * 
 * @function searchFoodAdditives
 * @param {FoodAdditive[]} additives - Additives to search
 * @param {string} query - Search query
 * @returns {FoodAdditive[]} Filtered additives
 * 
 * @example
 * const results = searchFoodAdditives(additives, 'vitamin');
 */
export function searchFoodAdditives(
  additives: FoodAdditive[],
  query: string
): FoodAdditive[] {
  if (!query.trim()) {
    logger.debug('Empty search query - returning all', {
      count: additives.length,
    });
    return additives;
  }

  logger.debug('Searching food additives', {
    query,
    totalCount: additives.length,
  });

  const lowerQuery = query.toLowerCase();
  const results = additives.filter(
    (additive) =>
      additive.chemicalName.toLowerCase().includes(lowerQuery) ||
      additive.eCode.toLowerCase().includes(lowerQuery) ||
      additive.category.toLowerCase().includes(lowerQuery)
  );

  logger.debug('Food additive search results', {
    query,
    resultCount: results.length,
    matchRate: `${((results.length / additives.length) * 100).toFixed(1)}%`,
  });

  return results;
}

/**
 * Gets color for additive status display
 * 
 * @function getAdditiveStatusColor
 * @param {string} status - Status ("Ok" or "Not Ok")
 * @param {any} theme - Theme object with colors
 * @returns {string} Color string
 * 
 * @example
 * const color = getAdditiveStatusColor('Ok', theme);
 */
export function getAdditiveStatusColor(status: string, theme: any): string {
  const isOk = status.toLowerCase() === 'ok';
  const color = isOk ? theme.colors.text.success : theme.colors.text.error;
  
  logger.debug('Additive status color determined', {
    status,
    isOk,
    color,
  });

  return color;
}

/**
 * Groups food additives by status (Ok vs Not Ok)
 * 
 * @function groupAdditivesByStatus
 * @param {FoodAdditive[]} additives - Additives to group
 * @returns {Object} Object with ok and notOk arrays
 * 
 * @example
 * const { ok, notOk } = groupAdditivesByStatus(additives);
 */
export function groupAdditivesByStatus(additives: FoodAdditive[]): {
  ok: FoodAdditive[];
  notOk: FoodAdditive[];
} {
  logger.debug('Grouping additives by status', {
    totalCount: additives.length,
  });

  const grouped = additives.reduce(
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

  logger.debug('Additives grouped by status', {
    totalCount: additives.length,
    okCount: grouped.ok.length,
    notOkCount: grouped.notOk.length,
  });

  return grouped;
}

/**
 * Groups food additives by category
 * 
 * @function groupAdditivesByCategory
 * @param {FoodAdditive[]} additives - Additives to group
 * @returns {Record<string, FoodAdditive[]>} Object with category keys
 * 
 * @example
 * const byCategory = groupAdditivesByCategory(additives);
 * console.log(byCategory['Antioxidant']); // Array of antioxidants
 */
export function groupAdditivesByCategory(
  additives: FoodAdditive[]
): Record<string, FoodAdditive[]> {
  logger.debug('Grouping additives by category', {
    totalCount: additives.length,
  });

  const grouped = additives.reduce((acc, additive) => {
    const category = additive.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(additive);
    return acc;
  }, {} as Record<string, FoodAdditive[]>);

  const categoryCount = Object.keys(grouped).length;
  const breakdown = Object.entries(grouped).map(([category, items]) => ({
    category,
    count: items.length,
  }));

  logger.debug('Additives grouped by category', {
    totalCount: additives.length,
    categoryCount,
    breakdown,
  });

  return grouped;
}

/**
 * Extracts unique categories from additives
 * 
 * @function getUniqueCategories
 * @param {FoodAdditive[]} additives - Additives to extract from
 * @returns {string[]} Sorted array of unique categories
 * 
 * @example
 * const categories = getUniqueCategories(additives);
 */
export function getUniqueCategories(additives: FoodAdditive[]): string[] {
  logger.debug('Extracting unique categories', {
    totalCount: additives.length,
  });

  const categories = new Set(additives.map((a) => a.category));
  const uniqueCategories = Array.from(categories).sort();

  logger.debug('Unique categories extracted', {
    totalAdditives: additives.length,
    uniqueCount: uniqueCategories.length,
    categories: uniqueCategories.join(', '),
  });

  return uniqueCategories;
}

/**
 * Sorts food additives by E-code (numerical order)
 * 
 * @function sortByECode
 * @param {FoodAdditive[]} additives - Additives to sort
 * @returns {FoodAdditive[]} Sorted array
 * 
 * @example
 * const sorted = sortByECode(additives);
 * // E100, E101, E102, E110, E120...
 */
export function sortByECode(additives: FoodAdditive[]): FoodAdditive[] {
  logger.debug('Sorting additives by E-code', {
    count: additives.length,
  });

  const sorted = [...additives].sort((a, b) => {
    const numA = parseInt(a.eCode.replace(/\D/g, ''), 10);
    const numB = parseInt(b.eCode.replace(/\D/g, ''), 10);
    return numA - numB;
  });

  logger.debug('Additives sorted by E-code', {
    count: sorted.length,
    firstCode: sorted[0]?.eCode,
    lastCode: sorted[sorted.length - 1]?.eCode,
  });

  return sorted;
}