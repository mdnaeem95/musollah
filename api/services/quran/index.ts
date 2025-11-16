/**
 * Quran Service
 * 
 * Fetch Quran surahs and verses from Alquran Cloud API.
 * Implements aggressive caching since Quran data never changes.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { quranClient, handleApiError } from '../../client/http';
import { cache, TTL } from '../../client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
  audio?: string;
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
}

export interface SurahsAPIResponse {
  code: number;
  status: string;
  data: Surah[];
}

export interface SurahDetailAPIResponse {
  code: number;
  status: string;
  data: SurahDetail;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const EDITIONS = {
  ARABIC: 'ar.alafasy',
  ENGLISH: 'en.sahih',
  TRANSLITERATION: 'en.transliteration',
} as const;

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all surahs (chapters) of the Quran
 */
export async function fetchSurahs(): Promise<Surah[]> {
  try {
    const response = await quranClient.get<SurahsAPIResponse>('/surah');
    return response.data.data;
  } catch (error) {
    handleApiError(error, 'fetchSurahs');
  }
}

/**
 * Fetch a specific surah with all its verses
 * 
 * @param surahNumber - Surah number (1-114)
 * @param edition - Language/edition identifier
 */
export async function fetchSurahDetail(
  surahNumber: number,
  edition: string = EDITIONS.ARABIC
): Promise<SurahDetail> {
  try {
    const response = await quranClient.get<SurahDetailAPIResponse>(
      `/surah/${surahNumber}/${edition}`
    );
    return response.data.data;
  } catch (error) {
    handleApiError(error, 'fetchSurahDetail');
  }
}

/**
 * Fetch multiple editions of a surah (Arabic + Translation)
 */
export async function fetchSurahWithTranslation(
  surahNumber: number
): Promise<{
  arabic: SurahDetail;
  translation: SurahDetail;
}> {
  try {
    const [arabic, translation] = await Promise.all([
      fetchSurahDetail(surahNumber, EDITIONS.ARABIC),
      fetchSurahDetail(surahNumber, EDITIONS.ENGLISH),
    ]);

    return { arabic, translation };
  } catch (error) {
    handleApiError(error, 'fetchSurahWithTranslation');
  }
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const QURAN_QUERY_KEYS = {
  all: ['quran'] as const,
  surahs: ['quran', 'surahs'] as const,
  surah: (number: number, edition: string) =>
    ['quran', 'surah', number, edition] as const,
  surahWithTranslation: (number: number) =>
    ['quran', 'surah', number, 'with-translation'] as const,
};

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Fetch all surahs (chapters)
 * 
 * Quran data never changes, so cache indefinitely
 */
export function useSurahs() {
  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surahs,
    queryFn: async () => {
      const cacheKey = 'quran-surahs';
      const cached = cache.get<Surah[]>(cacheKey);

      if (cached) {
        console.log('🎯 Using cached surahs list');
        return cached;
      }

      console.log('🌐 Fetching surahs from API');
      const surahs = await fetchSurahs();

      // Cache indefinitely - Quran never changes
      cache.set(cacheKey, surahs, TTL.ONE_MONTH * 12);

      return surahs;
    },
    staleTime: Infinity, // Never refetch automatically
    gcTime: Infinity, // Keep in memory forever
    retry: 2,
  });
}

/**
 * Fetch a specific surah with verses
 * 
 * @param surahNumber - Surah number (1-114)
 * @param edition - Language/edition identifier
 */
export function useSurah(surahNumber: number, edition: string = EDITIONS.ARABIC) {
  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surah(surahNumber, edition),
    queryFn: async () => {
      const cacheKey = `quran-surah-${surahNumber}-${edition}`;
      const cached = cache.get<SurahDetail>(cacheKey);

      if (cached) {
        console.log(`🎯 Using cached surah ${surahNumber}`);
        return cached;
      }

      console.log(`🌐 Fetching surah ${surahNumber} from API`);
      const surah = await fetchSurahDetail(surahNumber, edition);

      // Cache indefinitely
      cache.set(cacheKey, surah, TTL.ONE_MONTH * 12);

      return surah;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    enabled: surahNumber >= 1 && surahNumber <= 114,
  });
}

/**
 * Fetch a surah with both Arabic and English translation
 * 
 * @param surahNumber - Surah number (1-114)
 */
export function useSurahWithTranslation(surahNumber: number) {
  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surahWithTranslation(surahNumber),
    queryFn: async () => {
      const cacheKey = `quran-surah-${surahNumber}-with-translation`;
      const cached = cache.get<{ arabic: SurahDetail; translation: SurahDetail }>(
        cacheKey
      );

      if (cached) {
        console.log(`🎯 Using cached surah ${surahNumber} with translation`);
        return cached;
      }

      console.log(`🌐 Fetching surah ${surahNumber} with translation from API`);
      const data = await fetchSurahWithTranslation(surahNumber);

      // Cache indefinitely
      cache.set(cacheKey, data, TTL.ONE_MONTH * 12);

      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    enabled: surahNumber >= 1 && surahNumber <= 114,
  });
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

/**
 * Prefetch surahs for faster navigation
 */
export function usePrefetchQuran() {
  const queryClient = useQueryClient();

  return {
    prefetchSurahs: async () => {
      await queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surahs,
        queryFn: fetchSurahs,
        staleTime: Infinity,
      });
    },

    prefetchSurah: async (surahNumber: number, edition: string = EDITIONS.ARABIC) => {
      await queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surah(surahNumber, edition),
        queryFn: () => fetchSurahDetail(surahNumber, edition),
        staleTime: Infinity,
      });
    },

    prefetchNextSurah: async (currentSurah: number) => {
      if (currentSurah < 114) {
        await queryClient.prefetchQuery({
          queryKey: QURAN_QUERY_KEYS.surah(currentSurah + 1, EDITIONS.ARABIC),
          queryFn: () => fetchSurahDetail(currentSurah + 1, EDITIONS.ARABIC),
          staleTime: Infinity,
        });
      }
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get surah name by number
 */
export function getSurahName(surahNumber: number, surahs: Surah[]): string {
  const surah = surahs.find(s => s.number === surahNumber);
  return surah?.name || '';
}

/**
 * Search surahs by name
 */
export function searchSurahs(surahs: Surah[], query: string): Surah[] {
  const lowerQuery = query.toLowerCase();
  return surahs.filter(
    surah =>
      surah.name.toLowerCase().includes(lowerQuery) ||
      surah.englishName.toLowerCase().includes(lowerQuery) ||
      surah.englishNameTranslation.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get surah progress (ayahs read / total ayahs)
 */
export function getSurahProgress(
  surahNumber: number,
  currentAyah: number,
  surahs: Surah[]
): number {
  const surah = surahs.find(s => s.number === surahNumber);
  if (!surah) return 0;

  return Math.round((currentAyah / surah.numberOfAyahs) * 100);
}

/**
 * Get total Quran progress
 */
export function getTotalQuranProgress(completedAyahs: number): number {
  const TOTAL_AYAHS = 6236;
  return Math.round((completedAyahs / TOTAL_AYAHS) * 100);
}

/**
 * Format ayah reference (e.g., "2:255" for Surah Al-Baqarah, Ayah 255)
 */
export function formatAyahReference(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

/**
 * Parse ayah reference string
 */
export function parseAyahReference(reference: string): {
  surahNumber: number;
  ayahNumber: number;
} | null {
  const match = reference.match(/^(\d+):(\d+)$/);
  if (!match) return null;

  return {
    surahNumber: parseInt(match[1], 10),
    ayahNumber: parseInt(match[2], 10),
  };
}