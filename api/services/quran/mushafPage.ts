import { defaultStorage } from '../../client/storage';
import { createLogger } from '../../../services/logging/logger';

const logger = createLogger('MushafPage');

const BASE = 'https://api.alquran.cloud/v1';

// ============================================================================
// TYPES
// ============================================================================

export interface MushafAyah {
  surahNumber: number;
  surahName: string;           // Arabic name
  surahEnglishName: string;
  surahEnglishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
  ayahNumber: number;          // numberInSurah (1-indexed)
  globalNumber: number;
  arabic: string;
  translation: string;
  juz: number;
  isSurahStart: boolean;       // first ayah of this surah on this page
}

export interface MushafPageData {
  pageNumber: number;
  juz: number;
  ayahs: MushafAyah[];
}

// ============================================================================
// FETCH
// ============================================================================

const cacheKey = (page: number) => `mushaf-page-v1-${page}`;

export async function fetchMushafPage(pageNumber: number): Promise<MushafPageData> {
  const key = cacheKey(pageNumber);
  const cached = defaultStorage.getString(key);
  if (cached) {
    return JSON.parse(cached) as MushafPageData;
  }

  logger.info('Fetching mushaf page from API', { pageNumber, operation: 'mushaf-fetch' });

  const [arabicRes, translationRes] = await Promise.all([
    fetch(`${BASE}/page/${pageNumber}/quran-uthmani`),
    fetch(`${BASE}/page/${pageNumber}/en.sahih`),
  ]);

  if (!arabicRes.ok || !translationRes.ok) {
    throw new Error(`Failed to fetch page ${pageNumber}: ${arabicRes.status} / ${translationRes.status}`);
  }

  const [arabicJson, translationJson] = await Promise.all([
    arabicRes.json(),
    translationRes.json(),
  ]);

  const arabicAyahs: any[] = arabicJson.data.ayahs;
  const translationAyahs: any[] = translationJson.data.ayahs;

  const seenSurahs = new Set<number>();

  const ayahs: MushafAyah[] = arabicAyahs.map((a: any, i: number) => {
    const isSurahStart = !seenSurahs.has(a.surah.number);
    seenSurahs.add(a.surah.number);
    return {
      surahNumber: a.surah.number,
      surahName: a.surah.name,
      surahEnglishName: a.surah.englishName,
      surahEnglishNameTranslation: a.surah.englishNameTranslation,
      revelationType: a.surah.revelationType as 'Meccan' | 'Medinan',
      numberOfAyahs: a.surah.numberOfAyahs,
      ayahNumber: a.numberInSurah,
      globalNumber: a.number,
      arabic: a.text,
      translation: translationAyahs[i]?.text ?? '',
      juz: a.juz,
      isSurahStart,
    };
  });

  const result: MushafPageData = {
    pageNumber,
    juz: arabicAyahs[0]?.juz ?? 1,
    ayahs,
  };

  defaultStorage.setString(key, JSON.stringify(result));
  logger.info('Mushaf page cached', { pageNumber, ayahCount: ayahs.length, operation: 'mushaf-cache' });

  return result;
}
