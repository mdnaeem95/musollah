/**
 * Quran Service (Firestore Edition with Structured Logging)
 *
 * - Reads Quran + translations + audio links from Firestore
 * - Keeps TanStack Query v5 hooks API-compatible with your existing UI
 * - Uses MMKV cache via your CacheService (cache, TTL)
 * - Offline behavior: return cache if present, otherwise throw
 * - Comprehensive logging for cache hits, Firestore operations, offline mode
 *
 * @version 2.0 - Structured Logging Migration
 */

import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { UseQueryOptions, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { cache, TTL } from '../../client/storage';
import { logger } from '../../../services/logging/logger';

// ============================================================================
// FIRESTORE CONFIG
// ============================================================================

const QURAN_COLLECTION = 'Surahs';

// ============================================================================
// TYPES (UI-facing, mostly unchanged)
// ============================================================================

export interface Surah {
  number: number;
  name: string; // we'll map this to ArabicName by default
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan'; // if you don't store it, we'll default
}

export interface Ayah {
  number: number; // global ayah number (not available in your doc) -> we'll approximate
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

/**
 * Split pipe-delimited text (supports "a | b | c" or "a|b|c")
 * Removes BOM characters and trims whitespace
 */
function splitPipe(text: string): string[] {
  const startTime = Date.now();
  
  const parts = (text ?? '')
    .split('|')
    .map((s) => s.replace(/\uFEFF/g, '').trim()) // remove BOM + trim
    .filter(Boolean);
  
  const duration = Date.now() - startTime;
  
  logger.debug('Split pipe-delimited text', {
    inputLength: text?.length || 0,
    partsFound: parts.length,
    parseDuration: `${duration}ms`,
    operation: 'split-pipe',
  });
  
  return parts;
}

/**
 * Split comma-delimited text
 */
function splitComma(text: string): string[] {
  const startTime = Date.now();
  
  const parts = (text ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  
  const duration = Date.now() - startTime;
  
  logger.debug('Split comma-delimited text', {
    inputLength: text?.length || 0,
    partsFound: parts.length,
    parseDuration: `${duration}ms`,
    operation: 'split-comma',
  });
  
  return parts;
}

/**
 * Your Firestore doc does NOT include juz/page/etc, so we set safe defaults.
 * If you later store those, update this mapper.
 */
function buildAyahs(
  texts: string[],
  audioLinks?: string[]
): Ayah[] {
  const startTime = Date.now();
  
  const ayahs = texts.map((t, idx) => ({
    number: idx + 1, // not global ayah number; just stable within surah
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
  
  const duration = Date.now() - startTime;
  
  logger.debug('Built ayah objects', {
    totalAyahs: ayahs.length,
    withAudio: ayahs.filter(a => a.audio).length,
    buildDuration: `${duration}ms`,
    operation: 'build-ayahs',
  });
  
  return ayahs;
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
  const startTime = Date.now();
  
  const meta = mapDocToSurahMeta(doc);
  const arabicAyahs = splitPipe(doc.arabicText);
  const audio = splitComma(doc.audioLinks);

  // If lengths don't match, we still return ayahs, but audio may be missing for tail
  const ayahs = buildAyahs(arabicAyahs, audio);
  
  const duration = Date.now() - startTime;
  
  logger.debug('Mapped Firestore doc to Arabic surah detail', {
    surahNumber: doc.Number,
    surahName: doc.ArabicName,
    ayahsCount: ayahs.length,
    audioLinksCount: audio.length,
    audioMismatch: audio.length !== ayahs.length,
    mapDuration: `${duration}ms`,
    operation: 'map-arabic',
  });

  return { ...meta, ayahs };
}

function mapDocToSurahDetailTranslation(doc: FirestoreSurahDoc): SurahDetail {
  const startTime = Date.now();
  
  const meta = mapDocToSurahMeta(doc);
  const englishAyahs = splitPipe(doc.englishTranslation);

  const ayahs = buildAyahs(englishAyahs);
  
  const duration = Date.now() - startTime;
  
  logger.debug('Mapped Firestore doc to translation surah detail', {
    surahNumber: doc.Number,
    surahName: doc.EnglishName,
    ayahsCount: ayahs.length,
    mapDuration: `${duration}ms`,
    operation: 'map-translation',
  });

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

/**
 * Get a single surah document by number
 * Uses Firestore query on "Number" field for flexibility
 */
async function getSurahDocByNumber(surahNumber: number) {
  const startTime = Date.now();
  
  logger.debug('Fetching surah document from Firestore', {
    surahNumber,
    collection: QURAN_COLLECTION,
    queryField: 'Number',
    operation: 'firestore-query',
  });
  
  try {
    // Prefer a "Number" equality query (works regardless of docId)
    const snap = await firestore()
      .collection(QURAN_COLLECTION)
      .where('Number', '==', surahNumber)
      .limit(1)
      .get();
    
    const duration = Date.now() - startTime;

    if (snap.empty) {
      logger.warn('Surah document not found in Firestore', {
        surahNumber,
        collection: QURAN_COLLECTION,
        fetchDuration: `${duration}ms`,
        reason: 'No matching documents',
      });
      return null;
    }
    
    const doc = snap.docs[0].data() as FirestoreSurahDoc;

    logger.success('Surah document fetched from Firestore', {
      surahNumber,
      arabicName: doc.ArabicName,
      englishName: doc.EnglishName,
      numberOfAyahs: doc.NumberOfAyahs,
      revelationType: doc.RevelationType || 'Meccan',
      fetchDuration: `${duration}ms`,
      operation: 'firestore-query',
    });

    return doc;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to fetch surah document from Firestore', {
      surahNumber,
      error: error instanceof Error ? error.message : String(error),
      fetchDuration: `${duration}ms`,
      operation: 'firestore-query',
    });
    
    throw error;
  }
}

/**
 * Fetch all 114 surahs metadata from Firestore
 * Caches permanently (Quran doesn't change)
 */
export async function fetchSurahs(): Promise<Surah[]> {
  const startTime = Date.now();
  const cacheKey = 'quran-surahs';
  
  logger.debug('Initiating surahs list fetch', {
    cacheKey,
    expectedCount: TOTAL_SURAHS,
    operation: 'fetch-surahs',
  });

  try {
    // Check MMKV cache first
    const cacheCheckStart = Date.now();
    const cached = cache.get<Surah[]>(cacheKey);
    const cacheCheckDuration = Date.now() - cacheCheckStart;
    
    if (cached && Array.isArray(cached)) {
      logger.success('Surahs list retrieved from MMKV cache', {
        source: 'MMKV',
        surahsCount: cached.length,
        cacheCheckDuration: `${cacheCheckDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
        cacheHit: true,
      });
      return cached;
    }
    
    logger.debug('MMKV cache miss, fetching from Firestore', {
      cacheCheckDuration: `${cacheCheckDuration}ms`,
      cacheHit: false,
    });

    // Fetch from Firestore
    const firestoreStart = Date.now();
    const snap = await firestore()
      .collection(QURAN_COLLECTION)
      .orderBy('Number', 'asc')
      .get();
    const firestoreDuration = Date.now() - firestoreStart;

    logger.debug('Firestore query completed', {
      docsReturned: snap.docs.length,
      firestoreDuration: `${firestoreDuration}ms`,
    });

    // Parse and validate
    const parseStart = Date.now();
    const surahs = snap.docs
      .map((d) => d.data() as FirestoreSurahDoc)
      .filter((d) => typeof d?.Number === 'number')
      .map(mapDocToSurahMeta);
    const parseDuration = Date.now() - parseStart;

    if (!surahs.length) {
      logger.error('No surahs found in Firestore', {
        collection: QURAN_COLLECTION,
        docsReturned: snap.docs.length,
        firestoreDuration: `${firestoreDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error('No surahs found in Firestore');
    }
    
    if (surahs.length !== TOTAL_SURAHS) {
      logger.warn('Surah count mismatch', {
        expected: TOTAL_SURAHS,
        actual: surahs.length,
        missing: TOTAL_SURAHS - surahs.length,
      });
    }

    // Cache permanently (Quran doesn't change)
    const cacheSetStart = Date.now();
    cache.set(cacheKey, surahs, TTL.ONE_MONTH * 12);
    const cacheSetDuration = Date.now() - cacheSetStart;

    logger.success('Surahs list fetched from Firestore and cached', {
      source: 'Firestore',
      surahsCount: surahs.length,
      firestoreDuration: `${firestoreDuration}ms`,
      parseDuration: `${parseDuration}ms`,
      cacheSetDuration: `${cacheSetDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      cached: true,
      cacheTTL: 'PERMANENT',
    });

    return surahs;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to fetch surahs list', {
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'fetch-surahs',
    });
    
    throw toError(error, 'Failed to fetch surahs from Firestore');
  }
}

/**
 * Fetch a single surah with full ayah details
 * Supports Arabic and English editions
 */
export async function fetchSurahDetail(
  surahNumber: number,
  edition: string = EDITIONS.ARABIC
): Promise<SurahDetail> {
  const startTime = Date.now();
  
  // Validate surah number
  if (!isValidSurahNumber(surahNumber)) {
    logger.error('Invalid surah number', {
      surahNumber,
      validRange: `1-${TOTAL_SURAHS}`,
      operation: 'fetch-surah-detail',
    });
    throw new Error(`Invalid surah number: ${surahNumber}`);
  }

  const cacheKey = `quran-surah-${surahNumber}-${edition}`;
  
  logger.debug('Initiating surah detail fetch', {
    surahNumber,
    edition,
    cacheKey,
    operation: 'fetch-surah-detail',
  });

  try {
    // Check MMKV cache first
    const cacheCheckStart = Date.now();
    const cached = cache.get<SurahDetail>(cacheKey);
    const cacheCheckDuration = Date.now() - cacheCheckStart;
    
    if (cached && Array.isArray((cached as any).ayahs)) {
      logger.success('Surah detail retrieved from MMKV cache', {
        source: 'MMKV',
        surahNumber,
        edition,
        ayahsCount: cached.ayahs.length,
        cacheCheckDuration: `${cacheCheckDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
        cacheHit: true,
      });
      return cached;
    }
    
    logger.debug('MMKV cache miss, fetching from Firestore', {
      surahNumber,
      edition,
      cacheCheckDuration: `${cacheCheckDuration}ms`,
      cacheHit: false,
    });

    // Fetch from Firestore
    const doc = await getSurahDocByNumber(surahNumber);

    if (!doc) {
      logger.error('Surah not found in Firestore', {
        surahNumber,
        edition,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error(`Surah ${surahNumber} not found in Firestore`);
    }

    // Map to detail based on edition
    const mapStart = Date.now();
    let detail: SurahDetail;

    if (edition === EDITIONS.ARABIC) {
      detail = mapDocToSurahDetailArabic(doc);
    } else if (edition === EDITIONS.ENGLISH) {
      detail = mapDocToSurahDetailTranslation(doc);
    } else {
      logger.error('Unsupported edition requested', {
        surahNumber,
        edition,
        supportedEditions: [EDITIONS.ARABIC, EDITIONS.ENGLISH],
      });
      throw new Error(`Edition not supported from Firestore: ${edition}`);
    }
    const mapDuration = Date.now() - mapStart;

    // Validate result
    if (!detail.ayahs?.length) {
      logger.error('Invalid surah detail (empty ayahs)', {
        surahNumber,
        edition,
        ayahsCount: detail.ayahs?.length || 0,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error(`Invalid surah detail (empty ayahs) for ${surahNumber}/${edition}`);
    }

    // Cache permanently
    const cacheSetStart = Date.now();
    cache.set(cacheKey, detail, TTL.ONE_MONTH * 12);
    const cacheSetDuration = Date.now() - cacheSetStart;

    logger.success('Surah detail fetched from Firestore and cached', {
      source: 'Firestore',
      surahNumber,
      edition,
      surahName: detail.name,
      ayahsCount: detail.ayahs.length,
      revelationType: detail.revelationType,
      mapDuration: `${mapDuration}ms`,
      cacheSetDuration: `${cacheSetDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      cached: true,
      cacheTTL: 'PERMANENT',
    });

    return detail;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to fetch surah detail', {
      surahNumber,
      edition,
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'fetch-surah-detail',
    });
    
    throw toError(error, `Failed to fetch surah ${surahNumber} (${edition})`);
  }
}

/**
 * Fetch a surah with both Arabic and English translation
 * Optimized to fetch single doc and parse both editions
 */
export async function fetchSurahWithTranslation(
  surahNumber: number
): Promise<SurahWithTranslation> {
  const startTime = Date.now();
  
  // Validate surah number
  if (!isValidSurahNumber(surahNumber)) {
    logger.error('Invalid surah number', {
      surahNumber,
      validRange: `1-${TOTAL_SURAHS}`,
      operation: 'fetch-surah-with-translation',
    });
    throw new Error(`Invalid surah number: ${surahNumber}`);
  }

  logger.debug('Initiating surah with translation fetch', {
    surahNumber,
    editions: [EDITIONS.ARABIC, EDITIONS.ENGLISH],
    operation: 'fetch-surah-with-translation',
  });

  try {
    // Fetch single doc from Firestore
    const doc = await getSurahDocByNumber(surahNumber);

    if (!doc) {
      logger.error('Surah not found in Firestore', {
        surahNumber,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error(`Surah ${surahNumber} not found in Firestore`);
    }

    // Map both editions from single doc
    const mapStart = Date.now();
    const arabic = mapDocToSurahDetailArabic(doc);
    const translation = mapDocToSurahDetailTranslation(doc);
    const mapDuration = Date.now() - mapStart;

    // Validate both editions
    if (!arabic.ayahs?.length || !translation.ayahs?.length) {
      logger.error('Invalid surah with translation (empty ayahs)', {
        surahNumber,
        arabicAyahsCount: arabic.ayahs?.length || 0,
        translationAyahsCount: translation.ayahs?.length || 0,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error(
        `Invalid surah with translation for ${surahNumber}: arabic=${arabic.ayahs?.length}, translation=${translation.ayahs?.length}`
      );
    }

    const result = { arabic, translation };

    logger.success('Surah with translation fetched from Firestore', {
      source: 'Firestore',
      surahNumber,
      arabicName: arabic.name,
      englishName: translation.name,
      arabicAyahsCount: arabic.ayahs.length,
      translationAyahsCount: translation.ayahs.length,
      revelationType: arabic.revelationType,
      mapDuration: `${mapDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to fetch surah with translation', {
      surahNumber,
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'fetch-surah-with-translation',
    });
    
    throw toError(error, `Failed to fetch surah ${surahNumber} with translation`);
  }
}

// ============================================================================
// HOOKS - ALL SURAHS
// ============================================================================

/**
 * Fetch list of all 114 surahs
 * Permanently cached (Quran doesn't change)
 */
export function useSurahs(
  options?: Omit<UseQueryOptions<Surah[], Error>, 'queryKey' | 'queryFn'>
) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      
      if (offline) {
        logger.info('Network status changed to offline', {
          operation: 'surahs-query',
          offlineMode: true,
        });
      }
    });
    return unsubscribe;
  }, []);

  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surahs,
    queryFn: async () => {
      logger.debug('Surahs query function executing', {
        isOffline,
        queryType: 'all-surahs',
      });
      
      // Check cache first (handled inside fetchSurahs)
      const cacheKey = 'quran-surahs';
      const cached = cache.get<Surah[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        logger.debug('Returning cached surahs from query function', {
          source: 'MMKV',
          count: cached.length,
        });
        return cached;
      }

      // If offline and no cache, throw
      if (isOffline) {
        logger.warn('Offline with no cached surahs available', {
          offlineMode: true,
          cacheAvailable: false,
        });
        throw new Error('No cached data available offline');
      }

      return fetchSurahs();
    },
    staleTime: Infinity, // Quran never changes
    gcTime: Infinity,
    retry: isOffline ? 0 : 2,
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

/**
 * Fetch a single surah with full ayah details
 * Supports Arabic and English editions
 */
export function useSurah(
  surahNumber: number,
  edition: string = EDITIONS.ARABIC,
  options?: Omit<UseQueryOptions<SurahDetail, Error>, 'queryKey' | 'queryFn'>
) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      
      if (offline) {
        logger.info('Network status changed to offline', {
          surahNumber,
          edition,
          operation: 'surah-query',
          offlineMode: true,
        });
      }
    });
    return unsubscribe;
  }, [surahNumber, edition]);

  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surah(surahNumber, edition),
    queryFn: async () => {
      logger.debug('Surah query function executing', {
        surahNumber,
        edition,
        isOffline,
        queryType: 'single-surah',
      });
      
      // cache is handled inside fetchSurahDetail, but offline needs special behavior
      const cacheKey = `quran-surah-${surahNumber}-${edition}`;
      const cached = cache.get<SurahDetail>(cacheKey);
      if (cached && Array.isArray((cached as any).ayahs)) {
        logger.debug('Returning cached surah from query function', {
          source: 'MMKV',
          surahNumber,
          edition,
          ayahsCount: cached.ayahs.length,
        });
        return cached;
      }

      if (isOffline) {
        logger.warn('Offline with no cached surah available', {
          surahNumber,
          edition,
          offlineMode: true,
          cacheAvailable: false,
        });
        throw new Error('No cached data available offline');
      }

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

/**
 * Fetch a surah with both Arabic and English translation
 * More efficient than fetching separately
 */
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
      const offline = !state.isConnected;
      setIsOffline(offline);
      
      if (offline) {
        logger.info('Network status changed to offline', {
          surahNumber,
          operation: 'surah-with-translation-query',
          offlineMode: true,
        });
      }
    });
    return unsubscribe;
  }, [surahNumber]);

  return useQuery({
    queryKey: QURAN_QUERY_KEYS.surahWithTranslation(surahNumber),
    queryFn: async () => {
      logger.debug('Surah with translation query function executing', {
        surahNumber,
        isOffline,
        queryType: 'surah-with-translation',
      });
      
      const cacheKey = `quran-surah-${surahNumber}-with-translation`;
      const cached = cache.get<SurahWithTranslation>(cacheKey);
      if (cached?.arabic?.ayahs && cached?.translation?.ayahs) {
        logger.debug('Returning cached surah with translation from query function', {
          source: 'MMKV',
          surahNumber,
          arabicAyahsCount: cached.arabic.ayahs.length,
          translationAyahsCount: cached.translation.ayahs.length,
        });
        return cached;
      }

      if (isOffline) {
        logger.warn('Offline with no cached surah with translation available', {
          surahNumber,
          offlineMode: true,
          cacheAvailable: false,
        });
        throw new Error('No cached data available offline');
      }

      const data = await fetchSurahWithTranslation(surahNumber);
      
      // Cache the combined result
      const cacheSetStart = Date.now();
      cache.set(cacheKey, data, TTL.ONE_MONTH * 12);
      const cacheSetDuration = Date.now() - cacheSetStart;
      
      logger.debug('Cached surah with translation', {
        surahNumber,
        cacheKey,
        cacheSetDuration: `${cacheSetDuration}ms`,
        cacheTTL: 'PERMANENT',
      });
      
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
      if (cached?.arabic?.ayahs && cached?.translation?.ayahs) {
        return cached;
      }

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

/**
 * Prefetch utilities for preloading Quran data
 * Useful for navigation optimization and offline preparation
 */
export function usePrefetchQuran() {
  const queryClient = useQueryClient();

  return {
    /**
     * Prefetch list of all surahs
     */
    prefetchSurahs: async () => {
      const startTime = Date.now();
      
      logger.debug('Prefetching surahs list', {
        operation: 'prefetch-surahs',
      });
      
      try {
        await queryClient.prefetchQuery({
          queryKey: QURAN_QUERY_KEYS.surahs,
          queryFn: fetchSurahs,
          staleTime: Infinity,
        });
        
        const duration = Date.now() - startTime;
        
        logger.success('Surahs list prefetched successfully', {
          prefetchDuration: `${duration}ms`,
          operation: 'prefetch-surahs',
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Failed to prefetch surahs list', {
          error: error instanceof Error ? error.message : String(error),
          prefetchDuration: `${duration}ms`,
          operation: 'prefetch-surahs',
        });
      }
    },

    /**
     * Prefetch a specific surah
     */
    prefetchSurah: async (
      surahNumber: number,
      edition: string = EDITIONS.ARABIC
    ) => {
      if (!isValidSurahNumber(surahNumber)) {
        logger.warn('Skipping prefetch for invalid surah number', {
          surahNumber,
          validRange: `1-${TOTAL_SURAHS}`,
          operation: 'prefetch-surah',
        });
        return;
      }
      
      const startTime = Date.now();
      
      logger.debug('Prefetching surah', {
        surahNumber,
        edition,
        operation: 'prefetch-surah',
      });

      try {
        await queryClient.prefetchQuery({
          queryKey: QURAN_QUERY_KEYS.surah(surahNumber, edition),
          queryFn: () => fetchSurahDetail(surahNumber, edition),
          staleTime: Infinity,
        });
        
        const duration = Date.now() - startTime;
        
        logger.success('Surah prefetched successfully', {
          surahNumber,
          edition,
          prefetchDuration: `${duration}ms`,
          operation: 'prefetch-surah',
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Failed to prefetch surah', {
          surahNumber,
          edition,
          error: error instanceof Error ? error.message : String(error),
          prefetchDuration: `${duration}ms`,
          operation: 'prefetch-surah',
        });
      }
    },

    /**
     * Prefetch next surah for seamless navigation
     */
    prefetchNextSurah: async (
      currentSurah: number,
      edition: string = EDITIONS.ARABIC
    ) => {
      if (currentSurah < TOTAL_SURAHS) {
        const nextSurah = currentSurah + 1;
        const startTime = Date.now();
        
        logger.debug('Prefetching next surah', {
          currentSurah,
          nextSurah,
          edition,
          operation: 'prefetch-next-surah',
        });
        
        try {
          await queryClient.prefetchQuery({
            queryKey: QURAN_QUERY_KEYS.surah(nextSurah, edition),
            queryFn: () => fetchSurahDetail(nextSurah, edition),
            staleTime: Infinity,
          });
          
          const duration = Date.now() - startTime;
          
          logger.success('Next surah prefetched successfully', {
            currentSurah,
            nextSurah,
            edition,
            prefetchDuration: `${duration}ms`,
            operation: 'prefetch-next-surah',
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          
          logger.error('Failed to prefetch next surah', {
            currentSurah,
            nextSurah,
            edition,
            error: error instanceof Error ? error.message : String(error),
            prefetchDuration: `${duration}ms`,
            operation: 'prefetch-next-surah',
          });
        }
      } else {
        logger.debug('Already at last surah, skipping next prefetch', {
          currentSurah,
          totalSurahs: TOTAL_SURAHS,
          operation: 'prefetch-next-surah',
        });
      }
    },

    /**
     * Prefetch previous surah for seamless navigation
     */
    prefetchPreviousSurah: async (
      currentSurah: number,
      edition: string = EDITIONS.ARABIC
    ) => {
      if (currentSurah > 1) {
        const previousSurah = currentSurah - 1;
        const startTime = Date.now();
        
        logger.debug('Prefetching previous surah', {
          currentSurah,
          previousSurah,
          edition,
          operation: 'prefetch-previous-surah',
        });
        
        try {
          await queryClient.prefetchQuery({
            queryKey: QURAN_QUERY_KEYS.surah(previousSurah, edition),
            queryFn: () => fetchSurahDetail(previousSurah, edition),
            staleTime: Infinity,
          });
          
          const duration = Date.now() - startTime;
          
          logger.success('Previous surah prefetched successfully', {
            currentSurah,
            previousSurah,
            edition,
            prefetchDuration: `${duration}ms`,
            operation: 'prefetch-previous-surah',
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          
          logger.error('Failed to prefetch previous surah', {
            currentSurah,
            previousSurah,
            edition,
            error: error instanceof Error ? error.message : String(error),
            prefetchDuration: `${duration}ms`,
            operation: 'prefetch-previous-surah',
          });
        }
      } else {
        logger.debug('Already at first surah, skipping previous prefetch', {
          currentSurah,
          operation: 'prefetch-previous-surah',
        });
      }
    },

    /**
     * Prefetch surah with translation
     */
    prefetchSurahWithTranslation: async (surahNumber: number) => {
      if (!isValidSurahNumber(surahNumber)) {
        logger.warn('Skipping prefetch for invalid surah number', {
          surahNumber,
          validRange: `1-${TOTAL_SURAHS}`,
          operation: 'prefetch-surah-with-translation',
        });
        return;
      }
      
      const startTime = Date.now();
      
      logger.debug('Prefetching surah with translation', {
        surahNumber,
        operation: 'prefetch-surah-with-translation',
      });

      try {
        await queryClient.prefetchQuery({
          queryKey: QURAN_QUERY_KEYS.surahWithTranslation(surahNumber),
          queryFn: () => fetchSurahWithTranslation(surahNumber),
          staleTime: Infinity,
        });
        
        const duration = Date.now() - startTime;
        
        logger.success('Surah with translation prefetched successfully', {
          surahNumber,
          prefetchDuration: `${duration}ms`,
          operation: 'prefetch-surah-with-translation',
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Failed to prefetch surah with translation', {
          surahNumber,
          error: error instanceof Error ? error.message : String(error),
          prefetchDuration: `${duration}ms`,
          operation: 'prefetch-surah-with-translation',
        });
      }
    },
  };
}

/**
 * Prefetch adjacent surahs for instant navigation
 * Automatically prefetches next/previous when current surah changes
 */
export function usePrefetchAdjacentSurahs(currentSurah: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isValidSurahNumber(currentSurah)) {
      logger.warn('Invalid current surah for adjacent prefetch', {
        currentSurah,
        validRange: `1-${TOTAL_SURAHS}`,
        operation: 'prefetch-adjacent',
      });
      return;
    }
    
    logger.debug('Initiating adjacent surahs prefetch', {
      currentSurah,
      willPrefetchNext: currentSurah < TOTAL_SURAHS,
      willPrefetchPrevious: currentSurah > 1,
      operation: 'prefetch-adjacent',
    });

    // Prefetch next surah
    if (currentSurah < TOTAL_SURAHS) {
      const nextSurah = currentSurah + 1;
      queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surahWithTranslation(nextSurah),
        queryFn: () => fetchSurahWithTranslation(nextSurah),
        staleTime: Infinity,
      }).then(() => {
        logger.debug('Adjacent next surah prefetched in background', {
          currentSurah,
          prefetchedSurah: nextSurah,
        });
      }).catch((error) => {
        logger.warn('Failed to prefetch adjacent next surah', {
          currentSurah,
          nextSurah,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    // Prefetch previous surah
    if (currentSurah > 1) {
      const previousSurah = currentSurah - 1;
      queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surahWithTranslation(previousSurah),
        queryFn: () => fetchSurahWithTranslation(previousSurah),
        staleTime: Infinity,
      }).then(() => {
        logger.debug('Adjacent previous surah prefetched in background', {
          currentSurah,
          prefetchedSurah: previousSurah,
        });
      }).catch((error) => {
        logger.warn('Failed to prefetch adjacent previous surah', {
          currentSurah,
          previousSurah,
          error: error instanceof Error ? error.message : String(error),
        });
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