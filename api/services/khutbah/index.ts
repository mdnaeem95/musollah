/**
 * Khutbah Service
 * 
 * Fetch Friday sermon (Khutbah) content from Firebase.
 * Implements caching and error handling.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

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
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all khutbahs from Firebase
 * Ordered by date (most recent first)
 */
async function fetchKhutbahs(): Promise<Khutbah[]> {
  try {
    const snapshot = await db
      .collection('khutbahs')
      .orderBy('date', 'desc')
      .get();

    const khutbahs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Khutbah[];

    console.log(`✅ Fetched ${khutbahs.length} khutbahs from Firebase`);
    return khutbahs;
  } catch (error) {
    console.error('❌ Error fetching khutbahs:', error);
    throw new Error('Failed to load khutbahs');
  }
}

/**
 * Fetch a single khutbah by ID
 */
async function fetchKhutbahById(id: string): Promise<Khutbah | null> {
  try {
    const doc = await db.collection('khutbahs').doc(id).get();

    if (!doc.exists) {
      console.warn(`Khutbah ${id} not found`);
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Khutbah;
  } catch (error) {
    console.error(`❌ Error fetching khutbah ${id}:`, error);
    throw new Error('Failed to load khutbah');
  }
}

/**
 * Search khutbahs by title or tags
 */
function searchKhutbahs(khutbahs: Khutbah[], query: string): Khutbah[] {
  const lowerQuery = query.toLowerCase();
  
  return khutbahs.filter(khutbah =>
    khutbah.title.toLowerCase().includes(lowerQuery) ||
    khutbah.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    khutbah.speaker?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter khutbahs by date range
 */
function filterKhutbahsByDateRange(
  khutbahs: Khutbah[],
  startDate: string,
  endDate: string
): Khutbah[] {
  return khutbahs.filter(khutbah => {
    const khutbahDate = new Date(khutbah.date);
    return khutbahDate >= new Date(startDate) && khutbahDate <= new Date(endDate);
  });
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
 * Fetch all khutbahs
 * 
 * Features:
 * - MMKV cache for instant loading
 * - Firebase as source of truth
 * - 1 hour stale time
 * - Background refetch on window focus
 */
export function useKhutbahs() {
  return useQuery({
    queryKey: KHUTBAH_QUERY_KEYS.lists,
    queryFn: async () => {
      const cacheKey = 'khutbahs-all';
      
      // Check cache first
      const cached = cache.get<Khutbah[]>(cacheKey);
      if (cached) {
        console.log('⚡ Using cached khutbahs');
        return cached;
      }

      // Fetch from Firebase
      console.log('🌐 Fetching khutbahs from Firebase');
      const khutbahs = await fetchKhutbahs();

      // Cache for 1 hour
      cache.set(cacheKey, khutbahs, TTL.ONE_HOUR);

      return khutbahs;
    },
    staleTime: TTL.ONE_HOUR, // Consider fresh for 1 hour
    gcTime: TTL.ONE_DAY, // Keep in memory for 1 day
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Use cached data on mount
  });
}

/**
 * Fetch a single khutbah by ID
 */
export function useKhutbah(id: string) {
  return useQuery({
    queryKey: KHUTBAH_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const cacheKey = `khutbah-${id}`;
      
      // Check cache first
      const cached = cache.get<Khutbah>(cacheKey);
      if (cached) {
        console.log(`⚡ Using cached khutbah ${id}`);
        return cached;
      }

      // Fetch from Firebase
      const khutbah = await fetchKhutbahById(id);
      if (!khutbah) {
        throw new Error(`Khutbah ${id} not found`);
      }

      // Cache for 1 day (khutbahs don't change often)
      cache.set(cacheKey, khutbah, TTL.ONE_DAY);

      return khutbah;
    },
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_WEEK,
    retry: 1,
    enabled: !!id,
  });
}

/**
 * Search khutbahs with client-side filtering
 * 
 * Uses the cached khutbahs list for instant search results
 */
export function useSearchKhutbahs(query: string) {
  const { data: khutbahs } = useKhutbahs();

  const results = query.trim() && khutbahs
    ? searchKhutbahs(khutbahs, query)
    : khutbahs || [];

  return {
    results,
    isSearching: !!query.trim(),
  };
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

/**
 * Prefetch khutbahs for faster navigation
 */
export function usePrefetchKhutbahs() {
  const queryClient = useQueryClient();

  return {
    prefetchAll: async () => {
      await queryClient.prefetchQuery({
        queryKey: KHUTBAH_QUERY_KEYS.lists,
        queryFn: fetchKhutbahs,
        staleTime: TTL.ONE_HOUR,
      });
    },

    prefetchById: async (id: string) => {
      await queryClient.prefetchQuery({
        queryKey: KHUTBAH_QUERY_KEYS.detail(id),
        queryFn: () => fetchKhutbahById(id),
        staleTime: TTL.ONE_DAY,
      });
    },
  };
}

// ============================================================================
// INVALIDATION UTILITIES
// ============================================================================

/**
 * Invalidate khutbah cache
 * Use after adding/updating khutbahs
 */
export function useInvalidateKhutbahs() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: KHUTBAH_QUERY_KEYS.all,
      });
    },

    invalidateById: (id: string) => {
      queryClient.invalidateQueries({
        queryKey: KHUTBAH_QUERY_KEYS.detail(id),
      });
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format khutbah date for display
 */
export function formatKhutbahDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get available languages for a khutbah
 */
export function getAvailableLanguages(khutbah: Khutbah): Language[] {
  return Object.keys(khutbah.links) as Language[];
}

/**
 * Check if khutbah has a specific language
 */
export function hasLanguage(khutbah: Khutbah, language: Language): boolean {
  return !!khutbah.links[language];
}

/**
 * Get most recent khutbah
 */
export function getMostRecentKhutbah(khutbahs: Khutbah[]): Khutbah | null {
  if (khutbahs.length === 0) return null;
  return khutbahs.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
}