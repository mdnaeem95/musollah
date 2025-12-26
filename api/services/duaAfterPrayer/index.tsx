import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';
import { logger } from '../../../services/logging/logger';
import { collection, getDocs, limit, orderBy, query, where } from '@react-native-firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a single dua (supplication) to recite after prayer.
 * 
 * @interface DoaAfterPrayer
 * @property {string} id - Unique identifier from Firestore
 * @property {string} arabicText - Original Arabic text of the dua
 * @property {string} englishTranslation - English meaning
 * @property {string} romanized - Phonetic transliteration for pronunciation
 * @property {number} step - Sequence number (1-8)
 * @property {string} title - Brief title/name of the dua
 * 
 * @example
 * {
 *   id: 'doa1',
 *   arabicText: 'أستغفر الله',
 *   englishTranslation: 'I seek forgiveness from Allah',
 *   romanized: 'Astaghfirullah',
 *   step: 1,
 *   title: 'Seeking Forgiveness'
 * }
 */
export interface DoaAfterPrayer {
  id: string;
  arabicText: string;
  englishTranslation: string;
  romanized: string;
  step: number;
  title: string;
}

/**
 * Cache statistics for dua data.
 * Useful for debugging and monitoring cache health.
 * 
 * @interface DoaCacheStats
 * @property {boolean} mainCacheExists - Whether main cache entry exists
 * @property {number} stepCachesExist - Number of individual step caches (0-8)
 * @property {number} totalCached - Total cached items
 */
export interface DoaCacheStats {
  mainCacheExists: boolean;
  stepCachesExist: number;
  totalCached: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * TanStack Query key structure for dua queries.
 * Organized hierarchically for efficient cache invalidation.
 */
const DOA_QUERY_KEYS = {
  /** Root key for all dua queries */
  all: ['doa'] as const,
  /** Key for after-prayer dua collection */
  afterPrayer: ['doa', 'after-prayer'] as const,
} as const;

// ============================================================================
// API FUNCTIONS (MODULAR FIRESTORE)
// ============================================================================

/**
 * Fetches all 8 dua steps from Firestore, ordered by step number.
 * 
 * **Performance**: ~200-500ms on first fetch, <10ms on cache hit
 * **Caching**: Cached indefinitely (dua content never changes)
 * **Collection**: `DoaAfterPrayer`
 * **Order**: By `step` field ascending (1, 2, 3, ..., 8)
 * 
 * @returns {Promise<DoaAfterPrayer[]>} Array of 8 dua steps
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const doas = await fetchDoaAfterPrayer();
 * console.log(`Fetched ${doas.length} dua steps`);
 * // Expected: 8 steps
 */
async function fetchDoaAfterPrayer(): Promise<DoaAfterPrayer[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching dua after prayer from Firestore', {
      category: 'Dua API',
    });

    const colRef = collection(db, 'DoaAfterPrayer');
    const q = query(colRef, orderBy('step', 'asc'));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const duration = Math.round(performance.now() - startTime);
      logger.warn('No dua found in Firestore', {
        category: 'Dua API',
        duration: `${duration}ms`,
        collection: 'DoaAfterPrayer',
      });
      return [];
    }

    const doas = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<DoaAfterPrayer, 'id'>),
    }));

    const duration = Math.round(performance.now() - startTime);
    const steps = doas.map((d: any) => d.step).join(', ');
    
    logger.success('Dua after prayer fetched', {
      category: 'Dua API',
      count: doas.length,
      steps,
      duration: `${duration}ms`,
      source: 'Firestore',
    });

    return doas;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch dua after prayer', {
      category: 'Dua API',
      error: error.message,
      duration: `${duration}ms`,
      collection: 'DoaAfterPrayer',
      query: 'orderBy(step, asc)',
    });
    
    throw error;
  }
}

/**
 * Fetches a single dua by its step number.
 * 
 * **Performance**: ~100-300ms on first fetch, <5ms on cache hit
 * **Caching**: Cached indefinitely per step
 * **Use Case**: Detail views or sequential navigation
 * 
 * @param {number} step - Step number (1-8)
 * @returns {Promise<DoaAfterPrayer | null>} Dua for that step, or null if not found
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const doa = await fetchDoaByStep(3);
 * if (doa) {
 *   console.log(`Step 3: ${doa.title}`);
 * }
 */
async function fetchDoaByStep(step: number): Promise<DoaAfterPrayer | null> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching dua by step', {
      category: 'Dua API',
      step,
    });

    const colRef = collection(db, 'DoaAfterPrayer');
    const q = query(colRef, where('step', '==', step), limit(1));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('Dua step not found', {
        category: 'Dua API',
        step,
        duration: `${duration}ms`,
      });
      return null;
    }

    const d = snapshot.docs[0];
    const doa = {
      id: d.id,
      ...(d.data() as Omit<DoaAfterPrayer, 'id'>),
    };

    const duration = Math.round(performance.now() - startTime);
    
    logger.success('Dua step fetched', {
      category: 'Dua API',
      step,
      title: doa.title,
      duration: `${duration}ms`,
      source: 'Firestore',
    });

    return doa;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch dua by step', {
      category: 'Dua API',
      error: error.message,
      step,
      duration: `${duration}ms`,
    });
    
    throw error;
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * React Query hook for fetching all after-prayer dua.
 * 
 * **Features**:
 * - Automatic MMKV caching (indefinite)
 * - Cache-first strategy (instant subsequent loads)
 * - Never refetches (dua content is static)
 * - 2 retry attempts on failure
 * 
 * **Performance**:
 * - First load: ~200-500ms
 * - Cached load: <10ms
 * - Target cache hit rate: >95%
 * 
 * @returns {UseQueryResult<DoaAfterPrayer[]>} Query result with dua array
 * 
 * @example
 * function DoaList() {
 *   const { data: doas, isLoading, error } = useDoa();
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return doas.map(doa => <DoaCard key={doa.id} doa={doa} />);
 * }
 */
export function useDoa() {
  return useQuery({
    queryKey: DOA_QUERY_KEYS.afterPrayer,
    queryFn: async () => {
      const cacheKey = 'doa-after-prayer';
      const cached = cache.get<DoaAfterPrayer[]>(cacheKey);

      if (cached) {
        logger.debug('Using cached dua', {
          category: 'Dua API',
          count: cached.length,
          cacheKey,
          source: 'MMKV',
        });
        return cached;
      }

      logger.debug('Cache miss - fetching from Firestore', {
        category: 'Dua API',
        cacheKey,
      });

      const doas = await fetchDoaAfterPrayer();

      // Cache indefinitely - Dua never changes
      cache.set(cacheKey, doas, TTL.ONE_MONTH * 12);
      
      logger.debug('Dua cached', {
        category: 'Dua API',
        count: doas.length,
        cacheKey,
        ttl: '12 months',
      });

      return doas;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });
}

/**
 * React Query hook for fetching a single dua by step number.
 * 
 * **Features**:
 * - Individual step caching
 * - Automatic query disabling for invalid steps
 * - Cache-first strategy
 * - Never refetches (static content)
 * 
 * **Performance**: ~100-300ms first load, <5ms cached
 * 
 * @param {number} step - Step number (1-8)
 * @returns {UseQueryResult<DoaAfterPrayer | null>} Query result with single dua
 * 
 * @example
 * function DoaDetailScreen({ step }: { step: number }) {
 *   const { data: doa, isLoading } = useDoaByStep(step);
 *   
 *   if (isLoading) return <Spinner />;
 *   if (!doa) return <NotFound />;
 *   
 *   return <DoaDetail doa={doa} />;
 * }
 */
export function useDoaByStep(step: number) {
  const isValidStep = step >= 1 && step <= 8;
  
  return useQuery({
    queryKey: [...DOA_QUERY_KEYS.afterPrayer, 'step', step] as const,
    queryFn: async () => {
      const cacheKey = `doa-step-${step}`;
      const cached = cache.get<DoaAfterPrayer>(cacheKey);

      if (cached) {
        logger.debug('Using cached dua step', {
          category: 'Dua API',
          step,
          title: cached.title,
          cacheKey,
          source: 'MMKV',
        });
        return cached;
      }

      logger.debug('Cache miss - fetching step from Firestore', {
        category: 'Dua API',
        step,
        cacheKey,
      });

      const doa = await fetchDoaByStep(step);

      // Only cache if it exists (avoid caching null)
      if (doa) {
        cache.set(cacheKey, doa, TTL.ONE_MONTH * 12);
        
        logger.debug('Dua step cached', {
          category: 'Dua API',
          step,
          title: doa.title,
          cacheKey,
          ttl: '12 months',
        });
      }

      return doa;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    enabled: isValidStep,
  });
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

/**
 * Hook providing prefetch functions for dua data.
 * Useful for preloading data before navigation or on app startup.
 * 
 * **Use Cases**:
 * - Prefetch all dua on app launch (background task)
 * - Prefetch next step during navigation
 * - Warm cache for offline usage
 * 
 * @returns {Object} Prefetch utilities
 * @returns {Function} prefetchAll - Prefetch all 8 dua steps
 * @returns {Function} prefetchStep - Prefetch a specific step
 * 
 * @example
 * function useDoaNavigation(currentStep: number) {
 *   const { prefetchStep } = usePrefetchDoa();
 *   
 *   useEffect(() => {
 *     // Prefetch next step for smooth navigation
 *     prefetchStep(currentStep + 1);
 *   }, [currentStep]);
 * }
 * 
 * @example
 * // Prefetch on app startup
 * function useLazyInit() {
 *   const { prefetchAll } = usePrefetchDoa();
 *   
 *   useEffect(() => {
 *     prefetchAll(); // Background task
 *   }, []);
 * }
 */
export function usePrefetchDoa() {
  const queryClient = useQueryClient();

  return {
    /**
     * Prefetches all dua steps in one query.
     * More efficient than prefetching individually.
     * 
     * @returns {Promise<void>}
     */
    prefetchAll: async () => {
      const startTime = performance.now();
      
      logger.debug('Prefetching all dua', {
        category: 'Dua API',
      });

      await queryClient.prefetchQuery({
        queryKey: DOA_QUERY_KEYS.afterPrayer,
        queryFn: fetchDoaAfterPrayer,
        staleTime: Infinity,
      });

      const duration = Math.round(performance.now() - startTime);
      
      logger.success('All dua prefetched', {
        category: 'Dua API',
        duration: `${duration}ms`,
      });
    },

    /**
     * Prefetches a specific dua step.
     * Useful for sequential navigation.
     * 
     * @param {number} step - Step number to prefetch (1-8)
     * @returns {Promise<void>}
     */
    prefetchStep: async (step: number) => {
      const startTime = performance.now();
      
      logger.debug('Prefetching dua step', {
        category: 'Dua API',
        step,
      });

      await queryClient.prefetchQuery({
        queryKey: [...DOA_QUERY_KEYS.afterPrayer, 'step', step] as const,
        queryFn: () => fetchDoaByStep(step),
        staleTime: Infinity,
      });

      const duration = Math.round(performance.now() - startTime);
      
      logger.success('Dua step prefetched', {
        category: 'Dua API',
        step,
        duration: `${duration}ms`,
      });
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Searches dua by title, translation, or romanization.
 * Case-insensitive, matches partial strings.
 * 
 * **Performance**: ~5-20ms for 8 items
 * 
 * @param {DoaAfterPrayer[]} doas - Array of dua to search
 * @param {string} queryText - Search query
 * @returns {DoaAfterPrayer[]} Filtered dua matching query
 * 
 * @example
 * const results = searchDoa(allDoas, 'forgiveness');
 * // Returns dua with "forgiveness" in title or translation
 * 
 * @example
 * const results = searchDoa(allDoas, 'astaghfir');
 * // Returns dua with "astaghfir" in romanization
 */
export function searchDoa(doas: DoaAfterPrayer[], queryText: string): DoaAfterPrayer[] {
  const startTime = performance.now();
  const lowerQuery = queryText.toLowerCase().trim();
  
  logger.debug('Searching dua', {
    category: 'Dua API',
    query: queryText,
    totalCount: doas.length,
  });

  if (!lowerQuery) {
    logger.debug('Empty search query - returning all dua', {
      category: 'Dua API',
      count: doas.length,
    });
    return doas;
  }

  const results = doas.filter(
    (doa) =>
      doa.title.toLowerCase().includes(lowerQuery) ||
      doa.englishTranslation.toLowerCase().includes(lowerQuery) ||
      doa.romanized.toLowerCase().includes(lowerQuery)
  );

  const duration = Math.round(performance.now() - startTime);
  const matchedSteps = results.map(d => d.step).join(', ');
  
  logger.debug('Dua search results', {
    category: 'Dua API',
    query: queryText,
    resultCount: results.length,
    matchedSteps: matchedSteps || 'none',
    duration: `${duration}ms`,
  });

  return results;
}

/**
 * Gets the next dua in sequence.
 * Returns null if current step is the last (step 8).
 * 
 * @param {number} currentStep - Current step number
 * @param {DoaAfterPrayer[]} doas - Array of all dua
 * @returns {DoaAfterPrayer | null} Next dua or null
 * 
 * @example
 * const nextDoa = getNextDoa(3, allDoas);
 * // Returns step 4 dua
 * 
 * @example
 * const nextDoa = getNextDoa(8, allDoas);
 * // Returns null (end of sequence)
 */
export function getNextDoa(currentStep: number, doas: DoaAfterPrayer[]): DoaAfterPrayer | null {
  const nextStep = currentStep + 1;
  const nextDoa = doas.find((doa) => doa.step === nextStep) || null;
  
  logger.debug('Getting next dua', {
    category: 'Dua API',
    currentStep,
    nextStep,
    found: !!nextDoa,
    nextTitle: nextDoa?.title || 'end of sequence',
  });

  return nextDoa;
}

/**
 * Gets the previous dua in sequence.
 * Returns null if current step is the first (step 1).
 * 
 * @param {number} currentStep - Current step number
 * @param {DoaAfterPrayer[]} doas - Array of all dua
 * @returns {DoaAfterPrayer | null} Previous dua or null
 * 
 * @example
 * const prevDoa = getPreviousDoa(3, allDoas);
 * // Returns step 2 dua
 * 
 * @example
 * const prevDoa = getPreviousDoa(1, allDoas);
 * // Returns null (start of sequence)
 */
export function getPreviousDoa(currentStep: number, doas: DoaAfterPrayer[]): DoaAfterPrayer | null {
  const prevStep = currentStep - 1;
  const prevDoa = doas.find((doa) => doa.step === prevStep) || null;
  
  logger.debug('Getting previous dua', {
    category: 'Dua API',
    currentStep,
    prevStep,
    found: !!prevDoa,
    prevTitle: prevDoa?.title || 'start of sequence',
  });

  return prevDoa;
}

/**
 * Formats a dua for sharing (e.g., via WhatsApp, clipboard).
 * Includes all text components in a readable format.
 * 
 * @param {DoaAfterPrayer} doa - Dua to format
 * @returns {string} Formatted text with title, Arabic, romanization, and translation
 * 
 * @example
 * const shareText = formatDoaForSharing(doa);
 * await Share.share({ message: shareText });
 * 
 * // Output format:
 * // Seeking Forgiveness
 * //
 * // أستغفر الله
 * //
 * // Astaghfirullah
 * //
 * // I seek forgiveness from Allah
 */
export function formatDoaForSharing(doa: DoaAfterPrayer): string {
  logger.debug('Formatting dua for sharing', {
    category: 'Dua API',
    step: doa.step,
    title: doa.title,
  });

  return `
${doa.title}

${doa.arabicText}

${doa.romanized}

${doa.englishTranslation}
  `.trim();
}

// ============================================================================
// CACHE MANAGEMENT (2026 IMPROVEMENTS)
// ============================================================================

/**
 * Clears all dua cache entries (main list + 8 individual steps).
 * Use when implementing cache refresh or settings reset.
 * 
 * **Impact**: Next dua fetch will hit Firestore (~200-500ms)
 * 
 * @example
 * function SettingsScreen() {
 *   const handleClearCache = () => {
 *     clearDoaCache();
 *     Toast.show('Dua cache cleared');
 *   };
 * }
 */
export function clearDoaCache(): void {
  logger.info('Clearing dua cache', {
    category: 'Dua API',
  });

  // Clear main cache
  cache.clear('doa-after-prayer');

  // Clear individual step caches
  for (let step = 1; step <= 8; step++) {
    cache.clear(`doa-step-${step}`);
  }

  logger.success('Dua cache cleared', {
    category: 'Dua API',
    itemsCleared: 9, // 1 main + 8 steps
  });
}

/**
 * Gets cache statistics for debugging and monitoring.
 * 
 * @returns {DoaCacheStats} Cache statistics object
 * 
 * @example
 * const stats = getDoaCacheStats();
 * console.log(`Cached: ${stats.totalCached} items`);
 * // Expected after full load: 9 items (1 main + 8 steps)
 */
export function getDoaCacheStats(): DoaCacheStats {
  const mainCacheExists = cache.get<DoaAfterPrayer[]>('doa-after-prayer') !== undefined;
  
  let stepCachesExist = 0;
  for (let step = 1; step <= 8; step++) {
    if (cache.get<DoaAfterPrayer>(`doa-step-${step}`) !== undefined) {
      stepCachesExist++;
    }
  }

  const stats: DoaCacheStats = {
    mainCacheExists,
    stepCachesExist,
    totalCached: (mainCacheExists ? 1 : 0) + stepCachesExist,
  };

  logger.debug('Dua cache statistics', {
    category: 'Dua API',
    ...stats,
  });

  return stats;
}