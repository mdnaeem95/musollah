import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';
import { logger } from '../../../services/logging/logger';

import { collection, getDocs, orderBy, query } from '@react-native-firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a single dua (supplication) entry
 * 
 * @interface Doa
 * @property {string} number - Unique identifier/sequence number
 * @property {string} title - Title/name of the dua
 * @property {string} arabicText - Original Arabic text
 * @property {string} romanizedText - Romanized/transliterated version
 * @property {string} englishTranslation - English translation
 * @property {string} source - Source reference (Quran/Hadith)
 */
export interface Doa {
  number: string;
  title: string;
  arabicText: string;
  romanizedText: string;
  englishTranslation: string;
  source: string;
}

/**
 * Cache statistics for duas
 * 
 * @interface DoaCacheStats
 * @property {boolean} cacheExists - Whether main cache exists
 * @property {number} totalDuas - Total number of cached duas
 */
export interface DoaCacheStats {
  cacheExists: boolean;
  totalDuas: number;
}

// ============================================================================
// API FUNCTIONS (MODULAR FIRESTORE)
// ============================================================================

/**
 * Fetches all duas from Firestore, ordered by number
 * 
 * @async
 * @function fetchDoas
 * @returns {Promise<Doa[]>} Array of dua objects
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const duas = await fetchDoas();
 * console.log(`Fetched ${duas.length} duas`);
 */
async function fetchDoas(): Promise<Doa[]> {
  const startTime = performance.now();
  
  logger.debug('Fetching duas from Firestore', {
    collection: 'doas',
    query: 'orderBy(number, asc)',
  });

  try {
    const colRef = collection(db, 'doas');
    const q = query(colRef, orderBy('number', 'asc'));
    const snapshot = await getDocs(q);

    const duas = snapshot.docs.map((d: any) => d.data() as Doa);
    const duration = Math.round(performance.now() - startTime);

    logger.success('Duas fetched successfully', {
      count: duas.length,
      duration: `${duration}ms`,
      source: 'Firestore',
      numbers: duas.map((d: any) => d.number).join(', '),
    });

    return duas;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch duas', {
      error: error.message,
      duration: `${duration}ms`,
      collection: 'doas',
      query: 'orderBy(number, asc)',
    });

    throw error;
  }
}

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * TanStack Query keys for duas
 * Organized hierarchically for efficient cache invalidation
 */
const DOAS_QUERY_KEYS = {
  all: ['doas'] as const,
  detail: (number: string) => ['doas', 'detail', number] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all duas with caching
 * 
 * @function useDoas
 * @returns {UseQueryResult<Doa[]>} Query result with duas array
 * 
 * Cache Strategy:
 * - MMKV: 1 week (static content)
 * - Stale time: 1 day
 * - GC time: 1 week
 * 
 * @example
 * const { data: duas, isLoading } = useDoas();
 * if (isLoading) return <Spinner />;
 * return <DoaList duas={duas} />;
 */
export function useDoas() {
  return useQuery({
    queryKey: DOAS_QUERY_KEYS.all,
    queryFn: async () => {
      const startTime = performance.now();
      const cacheKey = 'doas-all';
      const cached = cache.get<Doa[]>(cacheKey);

      if (cached) {
        const duration = Math.round(performance.now() - startTime);
        logger.debug('Using cached duas', {
          count: cached.length,
          cacheKey,
          source: 'MMKV',
          duration: `${duration}ms`,
        });
        return cached;
      }

      logger.debug('Cache miss - fetching from Firestore', { cacheKey });
      const doas = await fetchDoas();

      // Cache for 1 week (static content)
      cache.set(cacheKey, doas, TTL.ONE_WEEK);
      
      logger.debug('Duas cached successfully', {
        count: doas.length,
        cacheKey,
        ttl: '1 week',
      });

      return doas;
    },
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_WEEK,
  });
}

/**
 * Hook to get a single dua by number
 * Uses the cached list from useDoas() for efficiency
 * 
 * @function useDoa
 * @param {string} number - Dua number to find
 * @returns {Doa | undefined} The dua if found
 * 
 * @example
 * const doa = useDoa('1');
 * if (doa) {
 *   return <DoaDetail doa={doa} />;
 * }
 */
export function useDoa(number: string) {
  const { data: doas } = useDoas();
  
  const doa = doas?.find((doa) => doa.number === number);
  
  if (doas && !doa) {
    logger.warn('Dua not found', { number, totalDuas: doas.length });
  } else if (doa) {
    logger.debug('Dua retrieved', { number, title: doa.title });
  }
  
  return doa;
}

/**
 * Hook to prefetch duas in the background
 * Useful for performance optimization during app initialization
 * 
 * @function usePrefetchDoas
 * @returns {Function} Async function to trigger prefetch
 * 
 * @example
 * const prefetchDoas = usePrefetchDoas();
 * 
 * useEffect(() => {
 *   prefetchDoas(); // Prefetch on mount
 * }, []);
 */
export function usePrefetchDoas() {
  const queryClient = useQueryClient();

  return async () => {
    const startTime = performance.now();
    
    logger.debug('Prefetching duas');

    try {
      await queryClient.prefetchQuery({
        queryKey: DOAS_QUERY_KEYS.all,
        queryFn: fetchDoas,
        staleTime: TTL.ONE_DAY,
      });

      const duration = Math.round(performance.now() - startTime);
      logger.success('Duas prefetched successfully', { duration: `${duration}ms` });
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      logger.error('Failed to prefetch duas', {
        error: error.message,
        duration: `${duration}ms`,
      });
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Searches duas by title or number
 * Case-insensitive search with trimming
 * 
 * @function searchDoas
 * @param {Doa[]} doas - Array of duas to search
 * @param {string} queryText - Search query
 * @returns {Doa[]} Filtered array of matching duas
 * 
 * @example
 * const results = searchDoas(allDuas, 'morning');
 * // Returns duas with "morning" in title
 */
export function searchDoas(doas: Doa[], queryText: string): Doa[] {
  const lowerQuery = queryText.toLowerCase().trim();
  
  if (!lowerQuery) {
    logger.debug('Empty search query - returning all duas', { count: doas.length });
    return doas;
  }

  logger.debug('Searching duas', {
    query: queryText,
    totalCount: doas.length,
  });

  const results = doas.filter(
    (doa) =>
      doa.title.toLowerCase().includes(lowerQuery) ||
      doa.number.includes(lowerQuery) ||
      doa.englishTranslation.toLowerCase().includes(lowerQuery) ||
      doa.source.toLowerCase().includes(lowerQuery)
  );

  logger.debug('Dua search results', {
    query: queryText,
    resultCount: results.length,
    matchedNumbers: results.map(d => d.number).join(', '),
  });

  return results;
}

/**
 * Gets navigation info for a specific dua
 * Returns next and previous dua numbers for navigation UI
 * 
 * @function getDoaNavigation
 * @param {Doa[]} doas - All duas
 * @param {string} currentNumber - Current dua number
 * @returns {Object} Navigation info with next/previous
 * 
 * @example
 * const nav = getDoaNavigation(duas, '5');
 * // { next: { number: '6', title: '...' }, previous: { number: '4', title: '...' }, hasNext: true, hasPrevious: true }
 */
export function getDoaNavigation(doas: Doa[], currentNumber: string) {
  const currentIndex = doas.findIndex(d => d.number === currentNumber);
  
  if (currentIndex === -1) {
    logger.warn('Current dua not found for navigation', { currentNumber });
    return {
      next: null,
      previous: null,
      hasNext: false,
      hasPrevious: false,
    };
  }

  const next = currentIndex < doas.length - 1 ? doas[currentIndex + 1] : null;
  const previous = currentIndex > 0 ? doas[currentIndex - 1] : null;

  logger.debug('Dua navigation calculated', {
    currentNumber,
    currentTitle: doas[currentIndex].title,
    hasNext: !!next,
    hasPrevious: !!previous,
    nextNumber: next?.number,
    previousNumber: previous?.number,
  });

  return {
    next: next ? { number: next.number, title: next.title } : null,
    previous: previous ? { number: previous.number, title: previous.title } : null,
    hasNext: !!next,
    hasPrevious: !!previous,
  };
}

/**
 * Formats a dua for sharing (text message, social media, etc.)
 * 
 * @function formatDoaForSharing
 * @param {Doa} doa - The dua to format
 * @returns {string} Formatted text suitable for sharing
 * 
 * @example
 * const shareText = formatDoaForSharing(doa);
 * Share.share({ message: shareText });
 */
export function formatDoaForSharing(doa: Doa): string {
  logger.debug('Formatting dua for sharing', {
    number: doa.number,
    title: doa.title,
  });

  return `
${doa.title}

Arabic:
${doa.arabicText}

Romanization:
${doa.romanizedText}

Translation:
${doa.englishTranslation}

Source: ${doa.source}

Shared from Musollah App
  `.trim();
}

/**
 * Clears the duas cache
 * Useful for force refresh or troubleshooting
 * 
 * @function clearDoasCache
 * 
 * @example
 * clearDoasCache();
 * queryClient.invalidateQueries({ queryKey: ['doas'] });
 */
export function clearDoasCache(): void {
  logger.info('Clearing duas cache');
  
  const cacheKey = 'doas-all';
  cache.clear(cacheKey);
  
  logger.success('Duas cache cleared', { cacheKey });
}

/**
 * Gets cache statistics for duas
 * 
 * @function getDoasCacheStats
 * @returns {DoaCacheStats} Cache statistics
 * 
 * @example
 * const stats = getDoasCacheStats();
 * console.log(`Cache exists: ${stats.cacheExists}`);
 */
export function getDoasCacheStats(): DoaCacheStats {
  const cacheKey = 'doas-all';
  const cached = cache.get<Doa[]>(cacheKey);
  
  const stats: DoaCacheStats = {
    cacheExists: !!cached,
    totalDuas: cached?.length || 0,
  };

  logger.debug('Duas cache stats', stats);
  
  return stats;
}

/**
 * Groups duas by source (Quran, Hadith, etc.)
 * Useful for categorized display
 * 
 * @function groupDoasBySource
 * @param {Doa[]} doas - Array of duas
 * @returns {Record<string, Doa[]>} Duas grouped by source
 * 
 * @example
 * const grouped = groupDoasBySource(duas);
 * // { "Quran": [...], "Hadith": [...] }
 */
export function groupDoasBySource(doas: Doa[]): Record<string, Doa[]> {
  logger.debug('Grouping duas by source', { totalCount: doas.length });

  const grouped = doas.reduce((acc, doa) => {
    const source = doa.source || 'Unknown';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(doa);
    return acc;
  }, {} as Record<string, Doa[]>);

  const sourceStats = Object.entries(grouped).map(([source, items]) => ({
    source,
    count: items.length,
  }));

  logger.debug('Duas grouped by source', {
    totalSources: Object.keys(grouped).length,
    breakdown: sourceStats,
  });

  return grouped;
}