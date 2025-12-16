/**
 * Quran Service (Firestore Edition)
 *
 * - Reads Quran + translations + audio links from Firestore
 * - Keeps TanStack Query v5 hooks API-compatible with your existing UI
 * - Uses MMKV cache via your CacheService (cache, TTL)
 * - Offline behavior: return cache if present, otherwise throw
 */

import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { UseQueryOptions, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { cache, TTL } from '../../client/storage';

// ============================================================================
// FIRESTORE CONFIG
// ============================================================================

// ✅ Change this to your actual collection name
const QURAN_COLLECTION = 'Surahs';

// ============================================================================
// TYPES (UI-facing, mostly unchanged)
// ============================================================================

export interface Surah {
  number: number;
  name: string; // we’ll map this to ArabicName by default
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan'; // if you don't store it, we'll default
}

export interface Ayah {
  number: number; // global ayah number (not available in your doc) -> we’ll approximate
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

export interface SurahWithTranslation {
  arabic: SurahDetail;
  translation: SurahDetail;
}

// This matches your Firestore doc shape (based on your example)
interface FirestoreSurahDoc {
  ArabicName: string;
  EnglishName: string;
  EnglishNameTranslation: string;
  Number: number;
  NumberOfAyahs: number;

  arabicText: string; // "ayah1 | ayah2 | ..."
  englishTranslation: string; // "ayah1 | ayah2 | ..."
  audioLinks: string; // "url1,url2,..."
  RevelationType?: 'Meccan' | 'Medinan'; // optional if you have it
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Keep for compatibility with existing callers
export const EDITIONS = {
  ARABIC: 'ar.alafasy',
  ENGLISH: 'en.sahih',
  TRANSLITERATION: 'en.transliteration', // not supported by your doc unless you add it
} as const;

export const TOTAL_SURAHS = 114;
export const TOTAL_AYAHS = 6236;

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
// HELPERS
// ============================================================================

function toError(e: unknown, fallback: string) {
  return e instanceof Error ? e : new Error(fallback);
}

export function isValidSurahNumber(num: number): boolean {
  return num >= 1 && num <= TOTAL_SURAHS;
}

function splitPipe(text: string): string[] {
  // supports: "a | b | c" or "a|b|c"
  return (text ?? '')
    .split('|')
    .map((s) => s.replace(/\uFEFF/g, '').trim()) // remove BOM + trim
    .filter(Boolean);
}

function splitComma(text: string): string[] {
  return (text ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Your Firestore doc does NOT include juz/page/etc, so we set safe defaults.
 * If you later store those, update this mapper.
 */
function buildAyahs(
  texts: string[],
  audioLinks?: string[]
): Ayah[] {
  return texts.map((t, idx) => ({
    number: idx + 1, // ✅ not global ayah number; just stable within surah
    text: t,
    numberInSurah: idx + 1,
    juz: 0,
    manzil: 0,
    page: 0,
    ruku: 0,
    hizbQuarter: 0,
    sajda: false,
    audio: audioLinks?.[idx],
  }));
}

function mapDocToSurahMeta(doc: FirestoreSurahDoc): Surah {
  return {
    number: doc.Number,
    name: doc.ArabicName, // default: Arabic name
    englishName: doc.EnglishName,
    englishNameTranslation: doc.EnglishNameTranslation,
    numberOfAyahs: doc.NumberOfAyahs,
    revelationType: doc.RevelationType ?? 'Meccan', // fallback if you don't store it
  };
}

function mapDocToSurahDetailArabic(doc: FirestoreSurahDoc): SurahDetail {
  const meta = mapDocToSurahMeta(doc);
  const arabicAyahs = splitPipe(doc.arabicText);
  const audio = splitComma(doc.audioLinks);

  // If lengths don’t match, we still return ayahs, but audio may be missing for tail
  const ayahs = buildAyahs(arabicAyahs, audio);

  return { ...meta, ayahs };
}

function mapDocToSurahDetailTranslation(doc: FirestoreSurahDoc): SurahDetail {
  const meta = mapDocToSurahMeta(doc);
  const englishAyahs = splitPipe(doc.englishTranslation);

  const ayahs = buildAyahs(englishAyahs);

  // For translation detail, use EnglishName as "name" to keep UI intuitive if it shows it
  return {
    ...meta,
    name: doc.EnglishName,
    ayahs,
  };
}

// ============================================================================
// FIRESTORE READS
// ============================================================================

async function getSurahDocByNumber(surahNumber: number) {
  // Prefer a "Number" equality query (works regardless of docId)
  const snap = await firestore()
    .collection(QURAN_COLLECTION)
    .where('Number', '==', surahNumber)
    .limit(1)
    .get();

  if (snap.empty) return null;

  return snap.docs[0].data() as FirestoreSurahDoc;
}

export async function fetchSurahs(): Promise<Surah[]> {
  try {
    const cacheKey = 'quran-surahs';
    const cached = cache.get<Surah[]>(cacheKey);
    if (cached && Array.isArray(cached)) return cached;

    const snap = await firestore()
      .collection(QURAN_COLLECTION)
      .orderBy('Number', 'asc')
      .get();

    const surahs = snap.docs
      .map((d) => d.data() as FirestoreSurahDoc)
      .filter((d) => typeof d?.Number === 'number')
      .map(mapDocToSurahMeta);

    if (!surahs.length) {
      throw new Error('No surahs found in Firestore');
    }

    cache.set(cacheKey, surahs, TTL.ONE_MONTH * 12);
    return surahs;
  } catch (error) {
    throw toError(error, 'Failed to fetch surahs from Firestore');
  }
}

export async function fetchSurahDetail(
  surahNumber: number,
  edition: string = EDITIONS.ARABIC
): Promise<SurahDetail> {
  if (!isValidSurahNumber(surahNumber)) {
    throw new Error(`Invalid surah number: ${surahNumber}`);
  }

  try {
    const cacheKey = `quran-surah-${surahNumber}-${edition}`;
    const cached = cache.get<SurahDetail>(cacheKey);
    if (cached && Array.isArray((cached as any).ayahs)) return cached;

    const doc = await getSurahDocByNumber(surahNumber);

    if (!doc) {
      throw new Error(`Surah ${surahNumber} not found in Firestore`);
    }

    let detail: SurahDetail;

    if (edition === EDITIONS.ARABIC) {
      detail = mapDocToSurahDetailArabic(doc);
    } else if (edition === EDITIONS.ENGLISH) {
      detail = mapDocToSurahDetailTranslation(doc);
    } else {
      // If you don’t store transliteration, this makes the failure explicit
      throw new Error(`Edition not supported from Firestore: ${edition}`);
    }

    if (!detail.ayahs?.length) {
      throw new Error(`Invalid surah detail (empty ayahs) for ${surahNumber}/${edition}`);
    }

    cache.set(cacheKey, detail, TTL.ONE_MONTH * 12);
    return detail;
  } catch (error) {
    throw toError(error, `Failed to fetch surah ${surahNumber} (${edition}) from Firestore`);
  }
}

export async function fetchSurahWithTranslation(
  surahNumber: number
): Promise<SurahWithTranslation> {
  if (!isValidSurahNumber(surahNumber)) {
    throw new Error(`Invalid surah number: ${surahNumber}`);
  }

  // Single Firestore read, then derive both arabic + translation
  const doc = await getSurahDocByNumber(surahNumber);
  if (!doc) throw new Error(`Surah ${surahNumber} not found in Firestore`);

  const arabic = mapDocToSurahDetailArabic(doc);
  const translation = mapDocToSurahDetailTranslation(doc);

  // Optional: ensure ayah counts align
  if (arabic.ayahs.length !== translation.ayahs.length) {
    console.warn(
      `⚠️ Ayah count mismatch for surah ${surahNumber}: arabic=${arabic.ayahs.length} translation=${translation.ayahs.length}`
    );
  }

  return { arabic, translation };
}

// ============================================================================
// HOOKS - SURAHS LIST
// ============================================================================

export function useSurahs(
  options?: Omit<UseQueryOptions<Surah[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surahs,
    queryFn: fetchSurahs,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    ...options,
  });
}

export function useSurahsSuspense() {
  return useSuspenseQuery({
    queryKey: QURAN_QUERY_KEYS.surahs,
    queryFn: fetchSurahs,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ============================================================================
// HOOKS - SINGLE SURAH
// ============================================================================

export function useSurah(
  surahNumber: number,
  edition: string = EDITIONS.ARABIC,
  options?: Omit<UseQueryOptions<SurahDetail, Error>, 'queryKey' | 'queryFn'>
) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surah(surahNumber, edition),
    queryFn: async () => {
      // cache is handled inside fetchSurahDetail, but offline needs special behavior
      const cacheKey = `quran-surah-${surahNumber}-${edition}`;
      const cached = cache.get<SurahDetail>(cacheKey);
      if (cached && Array.isArray((cached as any).ayahs)) return cached;

      if (isOffline) throw new Error('No cached data available offline');

      return fetchSurahDetail(surahNumber, edition);
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: isOffline ? 0 : 2,
    enabled: isValidSurahNumber(surahNumber),
    ...options,
  });
}

export function useSurahSuspense(
  surahNumber: number,
  edition: string = EDITIONS.ARABIC
) {
  return useSuspenseQuery({
    queryKey: QURAN_QUERY_KEYS.surah(surahNumber, edition),
    queryFn: () => fetchSurahDetail(surahNumber, edition),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ============================================================================
// HOOKS - SURAH WITH TRANSLATION
// ============================================================================

export function useSurahWithTranslation(
  surahNumber: number,
  options?: Omit<
    UseQueryOptions<SurahWithTranslation, Error>,
    'queryKey' | 'queryFn'
  >
) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surahWithTranslation(surahNumber),
    queryFn: async () => {
      const cacheKey = `quran-surah-${surahNumber}-with-translation`;
      const cached = cache.get<SurahWithTranslation>(cacheKey);
      if (cached?.arabic?.ayahs && cached?.translation?.ayahs) return cached;

      if (isOffline) throw new Error('No cached data available offline');

      const data = await fetchSurahWithTranslation(surahNumber);
      cache.set(cacheKey, data, TTL.ONE_MONTH * 12);
      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: isOffline ? 0 : 2,
    enabled: isValidSurahNumber(surahNumber),
    ...options,
  });
}

export function useSurahWithTranslationSuspense(surahNumber: number) {
  return useSuspenseQuery({
    queryKey: QURAN_QUERY_KEYS.surahWithTranslation(surahNumber),
    queryFn: async () => {
      const cacheKey = `quran-surah-${surahNumber}-with-translation`;
      const cached = cache.get<SurahWithTranslation>(cacheKey);
      if (cached?.arabic?.ayahs && cached?.translation?.ayahs) return cached;

      const data = await fetchSurahWithTranslation(surahNumber);
      cache.set(cacheKey, data, TTL.ONE_MONTH * 12);
      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

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

    prefetchSurah: async (
      surahNumber: number,
      edition: string = EDITIONS.ARABIC
    ) => {
      if (!isValidSurahNumber(surahNumber)) return;

      await queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surah(surahNumber, edition),
        queryFn: () => fetchSurahDetail(surahNumber, edition),
        staleTime: Infinity,
      });
    },

    prefetchNextSurah: async (
      currentSurah: number,
      edition: string = EDITIONS.ARABIC
    ) => {
      if (currentSurah < TOTAL_SURAHS) {
        await queryClient.prefetchQuery({
          queryKey: QURAN_QUERY_KEYS.surah(currentSurah + 1, edition),
          queryFn: () => fetchSurahDetail(currentSurah + 1, edition),
          staleTime: Infinity,
        });
      }
    },

    prefetchPreviousSurah: async (
      currentSurah: number,
      edition: string = EDITIONS.ARABIC
    ) => {
      if (currentSurah > 1) {
        await queryClient.prefetchQuery({
          queryKey: QURAN_QUERY_KEYS.surah(currentSurah - 1, edition),
          queryFn: () => fetchSurahDetail(currentSurah - 1, edition),
          staleTime: Infinity,
        });
      }
    },

    prefetchSurahWithTranslation: async (surahNumber: number) => {
      if (!isValidSurahNumber(surahNumber)) return;

      await queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surahWithTranslation(surahNumber),
        queryFn: () => fetchSurahWithTranslation(surahNumber),
        staleTime: Infinity,
      });
    },
  };
}

/**
 * Prefetch adjacent surahs for instant navigation
 */
export function usePrefetchAdjacentSurahs(currentSurah: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isValidSurahNumber(currentSurah)) return;

    if (currentSurah < TOTAL_SURAHS) {
      queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surahWithTranslation(currentSurah + 1),
        queryFn: () => fetchSurahWithTranslation(currentSurah + 1),
        staleTime: Infinity,
      });
    }

    if (currentSurah > 1) {
      queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surahWithTranslation(currentSurah - 1),
        queryFn: () => fetchSurahWithTranslation(currentSurah - 1),
        staleTime: Infinity,
      });
    }
  }, [currentSurah, queryClient]);
}

// ============================================================================
// UTILITY FUNCTIONS (unchanged)
// ============================================================================

export function getSurahName(surahNumber: number, surahs: Surah[]): string {
  const surah = surahs.find((s) => s.number === surahNumber);
  return surah?.name || '';
}

export function searchSurahs(surahs: Surah[], query: string): Surah[] {
  const lowerQuery = query.toLowerCase();
  return surahs.filter(
    (surah) =>
      surah.name.toLowerCase().includes(lowerQuery) ||
      surah.englishName.toLowerCase().includes(lowerQuery) ||
      surah.englishNameTranslation.toLowerCase().includes(lowerQuery)
  );
}

export function getSurahProgress(
  surahNumber: number,
  currentAyah: number,
  surahs: Surah[]
): number {
  const surah = surahs.find((s) => s.number === surahNumber);
  if (!surah) return 0;
  return Math.round((currentAyah / surah.numberOfAyahs) * 100);
}

export function getTotalQuranProgress(completedAyahs: number): number {
  return Math.round((completedAyahs / TOTAL_AYAHS) * 100);
}

export function formatAyahReference(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

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

export function isMeccanSurah(surah: Surah): boolean {
  return surah.revelationType === 'Meccan';
}

export function getSurahByNumber(surahs: Surah[], number: number): Surah | null {
  if (!isValidSurahNumber(number)) return null;
  return surahs.find((s) => s.number === number) ?? null;
}
