/**
 * Khutbah (Friday Sermon) API Service - Structured Logging Version
 * 
 * Manages Friday sermon content from Singapore mosques with multi-language
 * support (English, Malay, Tamil, Mandarin). Includes PDF links, AI summaries,
 * and search functionality.
 * 
 * @version 2.0 - Structured logging migration
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';
import { logger } from '../../../services/logging/logger';
import { collection, doc, getDoc, getDocs, orderBy, query as fsQuery,} from '@react-native-firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export type Language = 'English' | 'Malay' | 'Tamil' | 'Mandarin';

export interface Khutbah {
  id: string;
  title: string;
  date: string; // ISO format (e.g. 2025-04-01)
  links: {
    [lang in Language]?: string; // language-specific PDF links
  };
  tags?: string[];
  speaker?: string;
  summary?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLLECTION = 'khutbahs';
const CACHE_KEY_ALL = 'khutbahs-all';

// ============================================================================
// API FUNCTIONS (MODULAR)
// ============================================================================

/**
 * Fetches all khutbahs from Firestore ordered by date (newest first)
 * 
 * @async
 * @function fetchKhutbahs
 * @returns {Promise<Khutbah[]>} Array of khutbahs sorted by date descending
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const khutbahs = await fetchKhutbahs();
 * console.log(`Loaded ${khutbahs.length} sermons`);
 */
async function fetchKhutbahs(): Promise<Khutbah[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching khutbahs from Firestore', {
      collection: COLLECTION,
      orderBy: 'date desc',
    });

    const colRef = collection(db, COLLECTION);
    const q = fsQuery(colRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    const khutbahs = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<Khutbah, 'id'>),
    })) as Khutbah[];

    const duration = Math.round(performance.now() - startTime);

    // Count available languages
    const languageCounts = khutbahs.reduce((acc, k) => {
      Object.keys(k.links).forEach(lang => {
        acc[lang] = (acc[lang] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    logger.success('Khutbahs fetched successfully', {
      count: khutbahs.length,
      duration: `${duration}ms`,
      source: 'Firestore',
      collection: COLLECTION,
      languageCounts,
      dateRange: khutbahs.length > 0 ? {
        latest: khutbahs[0].date,
        oldest: khutbahs[khutbahs.length - 1].date,
      } : null,
    });

    return khutbahs;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch khutbahs', {
      error: error.message,
      duration: `${duration}ms`,
      collection: COLLECTION,
    });
    
    throw new Error('Failed to load khutbahs');
  }
}

/**
 * Fetches a single khutbah by ID
 * 
 * @async
 * @function fetchKhutbahById
 * @param {string} id - Khutbah document ID
 * @returns {Promise<Khutbah | null>} Khutbah or null if not found
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const khutbah = await fetchKhutbahById('2025-12-20');
 * if (khutbah) {
 *   console.log(`Title: ${khutbah.title}`);
 * }
 */
async function fetchKhutbahById(id: string): Promise<Khutbah | null> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching khutbah by ID', {
      id,
      collection: COLLECTION,
    });

    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);

    if (!snap.exists) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('Khutbah not found', {
        id,
        duration: `${duration}ms`,
      });
      return null;
    }

    const khutbah = {
      id: snap.id,
      ...(snap.data() as Omit<Khutbah, 'id'>),
    } as Khutbah;

    const duration = Math.round(performance.now() - startTime);

    logger.success('Khutbah fetched successfully', {
      id,
      title: khutbah.title,
      date: khutbah.date,
      languages: Object.keys(khutbah.links),
      hasSummary: !!khutbah.summary,
      speaker: khutbah.speaker || 'N/A',
      duration: `${duration}ms`,
      source: 'Firestore',
    });

    return khutbah;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch khutbah by ID', {
      error: error.message,
      id,
      duration: `${duration}ms`,
      collection: COLLECTION,
    });
    
    throw new Error('Failed to load khutbah');
  }
}

// ============================================================================
// LOCAL HELPERS
// ============================================================================

/**
 * Searches khutbahs by title, tags, or speaker
 * 
 * @function searchKhutbahs
 * @param {Khutbah[]} khutbahs - Khutbahs to search
 * @param {string} query - Search query
 * @returns {Khutbah[]} Filtered khutbahs
 * 
 * @example
 * const results = searchKhutbahs(allKhutbahs, 'ramadan');
 */
function searchKhutbahs(khutbahs: Khutbah[], query: string): Khutbah[] {
  logger.debug('Searching khutbahs', {
    query,
    totalCount: khutbahs.length,
  });

  const lowerQuery = query.toLowerCase();

  const results = khutbahs.filter(
    (khutbah) =>
      khutbah.title.toLowerCase().includes(lowerQuery) ||
      khutbah.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      khutbah.speaker?.toLowerCase().includes(lowerQuery)
  );

  logger.debug('Khutbah search results', {
    query,
    resultCount: results.length,
    matchRate: `${((results.length / khutbahs.length) * 100).toFixed(1)}%`,
  });

  return results;
}

/**
 * Filters khutbahs by date range
 * 
 * @function filterKhutbahsByDateRange
 * @param {Khutbah[]} khutbahs - Khutbahs to filter
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Khutbah[]} Filtered khutbahs
 * 
 * @example
 * const ramadan2025 = filterKhutbahsByDateRange(
 *   khutbahs,
 *   '2025-03-01',
 *   '2025-03-30'
 * );
 */
function filterKhutbahsByDateRange(
  khutbahs: Khutbah[],
  startDate: string,
  endDate: string
): Khutbah[] {
  logger.debug('Filtering khutbahs by date range', {
    startDate,
    endDate,
    totalCount: khutbahs.length,
  });

  const results = khutbahs.filter((khutbah) => {
    const khutbahDate = new Date(khutbah.date);
    return khutbahDate >= new Date(startDate) && khutbahDate <= new Date(endDate);
  });

  logger.debug('Date range filter results', {
    startDate,
    endDate,
    resultCount: results.length,
    filteredOut: khutbahs.length - results.length,
  });

  return results;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const KHUTBAH_QUERY_KEYS = {
  all: ['khutbah'] as const,
  lists: ['khutbah', 'list'] as const,
  list: (filters?: any) => ['khutbah', 'list', filters] as const,
  detail: (id: string) => ['khutbah', 'detail', id] as const,
};

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all khutbahs
 * 
 * @function useKhutbahs
 * @returns {UseQueryResult<Khutbah[]>} Query result with khutbahs
 * 
 * Cache:
 * - MMKV: 1 hour
 * - Stale time: 1 hour
 * - GC time: 1 day
 * 
 * @example
 * const { data: khutbahs, isLoading } = useKhutbahs();
 */
export function useKhutbahs() {
  return useQuery({
    queryKey: KHUTBAH_QUERY_KEYS.lists,
    queryFn: async () => {
      const startTime = performance.now();

      logger.debug('Hook: Getting khutbahs', { cacheKey: CACHE_KEY_ALL });

      const cached = cache.get<Khutbah[]>(CACHE_KEY_ALL);
      if (cached) {
        const duration = Math.round(performance.now() - startTime);
        logger.debug('Hook: Using cached khutbahs', {
          count: cached.length,
          cacheKey: CACHE_KEY_ALL,
          source: 'MMKV',
          duration: `${duration}ms`,
        });
        return cached;
      }

      logger.debug('Hook: Cache miss - fetching from Firestore', {
        cacheKey: CACHE_KEY_ALL,
      });

      const khutbahs = await fetchKhutbahs();
      const duration = Math.round(performance.now() - startTime);

      logger.debug('Hook: Caching khutbahs', {
        count: khutbahs.length,
        cacheKey: CACHE_KEY_ALL,
        ttl: '1 hour',
      });

      cache.set(CACHE_KEY_ALL, khutbahs, TTL.ONE_HOUR);

      logger.success('Hook: Khutbahs fetched and cached', {
        count: khutbahs.length,
        duration: `${duration}ms`,
      });

      return khutbahs;
    },
    staleTime: TTL.ONE_HOUR,
    gcTime: TTL.ONE_DAY,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch single khutbah by ID
 * 
 * @function useKhutbah
 * @param {string} id - Khutbah document ID
 * @returns {UseQueryResult<Khutbah>} Query result with khutbah
 * 
 * @example
 * const { data: khutbah } = useKhutbah('2025-12-20');
 */
export function useKhutbah(id: string) {
  return useQuery({
    queryKey: KHUTBAH_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const startTime = performance.now();
      const cacheKey = `khutbah-${id}`;

      logger.debug('Hook: Getting khutbah by ID', { id, cacheKey });

      const cached = cache.get<Khutbah>(cacheKey);
      if (cached) {
        const duration = Math.round(performance.now() - startTime);
        logger.debug('Hook: Using cached khutbah', {
          id,
          title: cached.title,
          cacheKey,
          source: 'MMKV',
          duration: `${duration}ms`,
        });
        return cached;
      }

      logger.debug('Hook: Cache miss - fetching from Firestore', { id, cacheKey });

      const khutbah = await fetchKhutbahById(id);
      if (!khutbah) {
        logger.error('Khutbah not found after fetch', { id });
        throw new Error(`Khutbah ${id} not found`);
      }

      const duration = Math.round(performance.now() - startTime);

      logger.debug('Hook: Caching khutbah', {
        id,
        cacheKey,
        ttl: '1 day',
      });

      cache.set(cacheKey, khutbah, TTL.ONE_DAY);

      logger.success('Hook: Khutbah fetched and cached', {
        id,
        title: khutbah.title,
        duration: `${duration}ms`,
      });

      return khutbah;
    },
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_WEEK,
    retry: 1,
    enabled: !!id,
  });
}

/**
 * Hook to search khutbahs (client-side)
 * 
 * @function useSearchKhutbahs
 * @param {string} queryStr - Search query
 * @returns {Object} Search results and searching state
 * 
 * @example
 * const { results, isSearching } = useSearchKhutbahs('ramadan');
 */
export function useSearchKhutbahs(queryStr: string) {
  const { data: khutbahs } = useKhutbahs();

  const results =
    queryStr.trim() && khutbahs ? searchKhutbahs(khutbahs, queryStr) : khutbahs || [];

  return {
    results,
    isSearching: !!queryStr.trim(),
  };
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

/**
 * Hook to prefetch khutbahs
 * 
 * @function usePrefetchKhutbahs
 * @returns {Object} Prefetch functions
 * 
 * @example
 * const { prefetchAll, prefetchById } = usePrefetchKhutbahs();
 * await prefetchAll();
 */
export function usePrefetchKhutbahs() {
  const queryClient = useQueryClient();

  return {
    prefetchAll: async () => {
      const startTime = performance.now();
      logger.debug('Prefetching all khutbahs');

      await queryClient.prefetchQuery({
        queryKey: KHUTBAH_QUERY_KEYS.lists,
        queryFn: fetchKhutbahs,
        staleTime: TTL.ONE_HOUR,
      });

      const duration = Math.round(performance.now() - startTime);
      logger.success('Khutbahs prefetched', {
        duration: `${duration}ms`,
      });
    },

    prefetchById: async (id: string) => {
      const startTime = performance.now();
      logger.debug('Prefetching khutbah by ID', { id });

      await queryClient.prefetchQuery({
        queryKey: KHUTBAH_QUERY_KEYS.detail(id),
        queryFn: async () => {
          const khutbah = await fetchKhutbahById(id);
          if (!khutbah) {
            logger.error('Cannot prefetch - khutbah not found', { id });
            throw new Error(`Khutbah ${id} not found`);
          }
          return khutbah;
        },
        staleTime: TTL.ONE_DAY,
      });

      const duration = Math.round(performance.now() - startTime);
      logger.success('Khutbah prefetched', {
        id,
        duration: `${duration}ms`,
      });
    },
  };
}

// ============================================================================
// INVALIDATION UTILITIES
// ============================================================================

/**
 * Hook to invalidate khutbah caches
 * 
 * @function useInvalidateKhutbahs
 * @returns {Object} Invalidate functions
 * 
 * @example
 * const { invalidateAll, invalidateById } = useInvalidateKhutbahs();
 * invalidateAll();
 */
export function useInvalidateKhutbahs() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      logger.info('Invalidating all khutbahs cache', {
        cacheKey: CACHE_KEY_ALL,
      });

      cache.clear(CACHE_KEY_ALL);
      queryClient.invalidateQueries({ queryKey: KHUTBAH_QUERY_KEYS.all });

      logger.success('Khutbahs cache invalidated');
    },

    invalidateById: (id: string) => {
      const cacheKey = `khutbah-${id}`;
      
      logger.info('Invalidating khutbah cache', {
        id,
        cacheKey,
      });

      cache.clear(cacheKey);
      queryClient.invalidateQueries({ queryKey: KHUTBAH_QUERY_KEYS.detail(id) });

      logger.success('Khutbah cache invalidated', { id });
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats khutbah date for display
 * 
 * @function formatKhutbahDate
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date (e.g., "Friday, December 20, 2025")
 * 
 * @example
 * formatKhutbahDate('2025-12-20'); // "Friday, December 20, 2025"
 */
export function formatKhutbahDate(dateStr: string): string {
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  logger.debug('Khutbah date formatted', {
    input: dateStr,
    output: formatted,
  });

  return formatted;
}

/**
 * Gets available languages for a khutbah
 * 
 * @function getAvailableLanguages
 * @param {Khutbah} khutbah - Khutbah to check
 * @returns {Language[]} Array of available languages
 * 
 * @example
 * const languages = getAvailableLanguages(khutbah);
 * // ['English', 'Malay', 'Tamil']
 */
export function getAvailableLanguages(khutbah: Khutbah): Language[] {
  const languages = Object.keys(khutbah.links) as Language[];

  logger.debug('Available languages extracted', {
    khutbahId: khutbah.id,
    languages,
    count: languages.length,
  });

  return languages;
}

/**
 * Checks if khutbah has specific language
 * 
 * @function hasLanguage
 * @param {Khutbah} khutbah - Khutbah to check
 * @param {Language} language - Language to check for
 * @returns {boolean} True if language is available
 * 
 * @example
 * if (hasLanguage(khutbah, 'Tamil')) {
 *   console.log('Tamil version available');
 * }
 */
export function hasLanguage(khutbah: Khutbah, language: Language): boolean {
  const available = !!khutbah.links[language];

  logger.debug('Language availability checked', {
    khutbahId: khutbah.id,
    language,
    available,
  });

  return available;
}

/**
 * Gets most recent khutbah from array
 * 
 * @function getMostRecentKhutbah
 * @param {Khutbah[]} khutbahs - Khutbahs to check
 * @returns {Khutbah | null} Most recent khutbah or null
 * 
 * @example
 * const latest = getMostRecentKhutbah(allKhutbahs);
 * console.log(`Latest: ${latest.title}`);
 */
export function getMostRecentKhutbah(khutbahs: Khutbah[]): Khutbah | null {
  if (khutbahs.length === 0) {
    logger.debug('No khutbahs available for most recent check', {
      count: 0,
    });
    return null;
  }

  const sorted = [...khutbahs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const mostRecent = sorted[0];

  logger.debug('Most recent khutbah determined', {
    totalCount: khutbahs.length,
    mostRecentId: mostRecent.id,
    mostRecentDate: mostRecent.date,
    mostRecentTitle: mostRecent.title,
  });

  return mostRecent;
}