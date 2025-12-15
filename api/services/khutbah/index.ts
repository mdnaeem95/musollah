import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query as fsQuery,
} from '@react-native-firebase/firestore';

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
// API FUNCTIONS (MODULAR)
// ============================================================================

async function fetchKhutbahs(): Promise<Khutbah[]> {
  try {
    const colRef = collection(db, 'khutbahs');
    const q = fsQuery(colRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    const khutbahs = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<Khutbah, 'id'>),
    })) as Khutbah[];

    console.log(`✅ Fetched ${khutbahs.length} khutbahs from Firebase`);
    return khutbahs;
  } catch (error) {
    console.error('❌ Error fetching khutbahs:', error);
    throw new Error('Failed to load khutbahs');
  }
}

async function fetchKhutbahById(id: string): Promise<Khutbah | null> {
  try {
    const ref = doc(db, 'khutbahs', id);
    const snap = await getDoc(ref);

    if (!snap.exists) {
      console.warn(`Khutbah ${id} not found`);
      return null;
    }

    return {
      id: snap.id,
      ...(snap.data() as Omit<Khutbah, 'id'>),
    } as Khutbah;
  } catch (error) {
    console.error(`❌ Error fetching khutbah ${id}:`, error);
    throw new Error('Failed to load khutbah');
  }
}

// ============================================================================
// LOCAL HELPERS
// ============================================================================

function searchKhutbahs(khutbahs: Khutbah[], query: string): Khutbah[] {
  const lowerQuery = query.toLowerCase();

  return khutbahs.filter(
    (khutbah) =>
      khutbah.title.toLowerCase().includes(lowerQuery) ||
      khutbah.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      khutbah.speaker?.toLowerCase().includes(lowerQuery)
  );
}

function filterKhutbahsByDateRange(
  khutbahs: Khutbah[],
  startDate: string,
  endDate: string
): Khutbah[] {
  return khutbahs.filter((khutbah) => {
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

export function useKhutbahs() {
  return useQuery({
    queryKey: KHUTBAH_QUERY_KEYS.lists,
    queryFn: async () => {
      const cacheKey = 'khutbahs-all';

      const cached = cache.get<Khutbah[]>(cacheKey);
      if (cached) {
        console.log('⚡ Using cached khutbahs');
        return cached;
      }

      console.log('🌐 Fetching khutbahs from Firebase');
      const khutbahs = await fetchKhutbahs();

      cache.set(cacheKey, khutbahs, TTL.ONE_HOUR);
      return khutbahs;
    },
    staleTime: TTL.ONE_HOUR,
    gcTime: TTL.ONE_DAY,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  });
}

export function useKhutbah(id: string) {
  return useQuery({
    queryKey: KHUTBAH_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const cacheKey = `khutbah-${id}`;

      const cached = cache.get<Khutbah>(cacheKey);
      if (cached) {
        console.log(`⚡ Using cached khutbah ${id}`);
        return cached;
      }

      const khutbah = await fetchKhutbahById(id);
      if (!khutbah) throw new Error(`Khutbah ${id} not found`);

      cache.set(cacheKey, khutbah, TTL.ONE_DAY);
      return khutbah;
    },
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_WEEK,
    retry: 1,
    enabled: !!id,
  });
}

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
        queryFn: async () => {
          const khutbah = await fetchKhutbahById(id);
          if (!khutbah) throw new Error(`Khutbah ${id} not found`);
          return khutbah;
        },
        staleTime: TTL.ONE_DAY,
      });
    },
  };
}

// ============================================================================
// INVALIDATION UTILITIES
// ============================================================================

export function useInvalidateKhutbahs() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      cache.clear('khutbahs-all'); // ✅ also clear MMKV
      queryClient.invalidateQueries({ queryKey: KHUTBAH_QUERY_KEYS.all });
    },

    invalidateById: (id: string) => {
      cache.clear(`khutbah-${id}`); // ✅ also clear MMKV
      queryClient.invalidateQueries({ queryKey: KHUTBAH_QUERY_KEYS.detail(id) });
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatKhutbahDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getAvailableLanguages(khutbah: Khutbah): Language[] {
  return Object.keys(khutbah.links) as Language[];
}

export function hasLanguage(khutbah: Khutbah, language: Language): boolean {
  return !!khutbah.links[language];
}

export function getMostRecentKhutbah(khutbahs: Khutbah[]): Khutbah | null {
  if (khutbahs.length === 0) return null;
  return [...khutbahs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
}
