/**
 * useQuranSearch
 *
 * Builds a full-text search index across all 6236 ayahs by loading all 114 surahs
 * in parallel via TanStack Query's useQueries. Each surah checks MMKV cache first
 * (permanent TTL), so after the first load everything is instant.
 *
 * Returns search results ranked by position in the Quran (surah → ayah order).
 */

import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  fetchSurahWithTranslation,
  QURAN_QUERY_KEYS,
  useSurahs,
  SurahWithTranslation,
  TOTAL_SURAHS,
} from '../../api/services/quran';

export interface SearchResult {
  surahNumber: number;
  surahName: string;
  surahNameTranslation: string;
  ayahNumber: number;
  arabic: string;
  translation: string;
}

const MAX_RESULTS = 50;

export function useQuranSearch() {
  const [query, setQuery] = useState('');

  const { data: surahs = [] } = useSurahs();

  // Load all 114 surahs in parallel.
  // fetchSurahWithTranslation checks MMKV cache first, then Firestore.
  // TanStack Query's gcTime: Infinity keeps them in memory for the session.
  const surahQueries = useQueries({
    queries: Array.from({ length: TOTAL_SURAHS }, (_, i) => ({
      queryKey: QURAN_QUERY_KEYS.surahWithTranslation(i + 1),
      queryFn: (): Promise<SurahWithTranslation> => fetchSurahWithTranslation(i + 1),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const loadedCount = useMemo(
    () => surahQueries.filter((q) => !!q.data).length,
    [surahQueries]
  );

  const isIndexing = loadedCount < TOTAL_SURAHS;

  // Flat search index — rebuilt only when loadedCount increases
  const searchIndex = useMemo<SearchResult[]>(() => {
    const index: SearchResult[] = [];

    surahQueries.forEach((q, i) => {
      if (!q.data) return;
      const meta = surahs.find((s) => s.number === i + 1);
      const { arabic, translation } = q.data;

      translation.ayahs.forEach((ayah, ayahIdx) => {
        index.push({
          surahNumber: i + 1,
          surahName: meta?.englishName ?? `Surah ${i + 1}`,
          surahNameTranslation: meta?.englishNameTranslation ?? '',
          ayahNumber: ayahIdx + 1,
          arabic: arabic.ayahs[ayahIdx]?.text ?? '',
          translation: ayah.text,
        });
      });
    });

    return index;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedCount, surahs]);

  // Search — keyword match on translation + surah name
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const matched: SearchResult[] = [];
    for (const item of searchIndex) {
      if (matched.length >= MAX_RESULTS) break;
      if (
        item.translation.toLowerCase().includes(q) ||
        item.surahName.toLowerCase().includes(q) ||
        item.surahNameTranslation.toLowerCase().includes(q)
      ) {
        matched.push(item);
      }
    }
    return matched;
  }, [query, searchIndex]);

  return {
    query,
    setQuery,
    results,
    isIndexing,
    indexProgress: loadedCount / TOTAL_SURAHS,
    loadedCount,
  };
}
