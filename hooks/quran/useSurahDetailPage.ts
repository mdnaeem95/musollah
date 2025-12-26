/**
 * Surah Detail Page Hook
 *
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Action tracking and navigation monitoring
 *
 * Business logic for the Surah text screen.
 * Handles data fetching, bookmarks, read tracking, and navigation.
 *
 * @version 2.0
 * @since 2025-12-24
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef, RefObject } from 'react';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Toast from 'react-native-toast-message';

import { useSurahWithTranslation } from '../../api/services/quran';
import { useQuranStore } from '../../stores/useQuranStore';
import { useQuranAudioPlayer } from './useQuranAudioPlayer';
import { useTrackPlayerSetup } from './useTrackPlayerSetup';

import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Surah Detail');

// ============================================================================
// TYPES
// ============================================================================

type FlashListRefType = ComponentRef<typeof FlashList>;

interface UseSurahDetailPageParams {
  surahNumber: number;
  initialAyahIndex?: number; // 1-based (e.g. 1 means first ayah)
  reciter: string;
}

type SurahParsed = {
  number: number;
  name: string;
  englishName: string;
  arabicAyahs: string[];
  englishTranslations: string[];
  audioLinks: string[];
  numberOfAyahs: number;
};

interface UseSurahDetailPageReturn {
  // Data
  surah: SurahParsed | null;
  isLoading: boolean;
  error: Error | null;

  // State
  currentAyahIndex: number;
  isPickerVisible: boolean;
  selectedSurah: number;
  readAyahsCount: number;

  // Actions
  toggleBookmark: (ayahNumber: number) => void;
  toggleReadAyah: (ayahNumber: number) => void;
  isBookmarked: (ayahNumber: number) => boolean;
  isRead: (ayahNumber: number) => boolean;
  handleSurahChange: (surahNumber: number) => void;
  togglePickerVisibility: () => void;

  // Refs
  listRef: RefObject<FlashListRefType | null>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSurahDetailPage({
  surahNumber,
  initialAyahIndex,
  reciter,
}: UseSurahDetailPageParams): UseSurahDetailPageReturn {
  const { isSetup: isPlayerSetup } = useTrackPlayerSetup();
  const router = useRouter();

  // ✅ FlashList ref typing (fixes TS2749)
  const listRef = useRef<ComponentRef<typeof FlashList>>(null);

  // Track whether we've already performed the initial scroll
  const didInitialScrollRef = useRef(false);

  // State
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(surahNumber);

  // Fetch surah data
  const { data, isLoading, error } = useSurahWithTranslation(surahNumber);

  // Zustand store
  const {
    addBookmark,
    removeBookmark,
    isBookmarked: checkIsBookmarked,
    markAyahAsRead,
    unmarkAyahAsRead,
    isAyahRead,
    getReadCountForSurah,
  } = useQuranStore();

  // ✅ Log hook mount/unmount
  useEffect(() => {
    logger.info('Surah detail page mounted', {
      surahNumber,
      initialAyahIndex,
      reciter,
      hasPlayerSetup: isPlayerSetup,
    });

    return () => {
      logger.debug('Surah detail page unmounted', { surahNumber });
    };
    // Intentionally mount-only: we want a single mount/unmount log
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Log data fetch lifecycle
  useEffect(() => {
    if (isLoading) {
      logger.debug('Loading surah data...', { surahNumber });
      return;
    }

    if (error) {
      logger.error('Failed to load surah data', error as Error, { surahNumber });
      return;
    }

    if (data) {
      logger.success('Surah data loaded', {
        surahNumber,
        arabicName: data.arabic.name,
        englishName: data.arabic.englishName,
        ayahCount: data.arabic.numberOfAyahs,
        hasTranslation: !!data.translation,
      });
    }
  }, [data, isLoading, error, surahNumber]);

  // Parse surah data
  const surah: SurahParsed | null = useMemo(() => {
    if (!data) return null;

    const { arabic, translation } = data;

    const parsed: SurahParsed = {
      number: arabic.number,
      name: arabic.name,
      englishName: arabic.englishName,
      arabicAyahs: arabic.ayahs.map((ayah) => ayah.text),
      englishTranslations: translation?.ayahs?.map((ayah) => ayah.text) ?? [],
      audioLinks: arabic.ayahs.map((ayah) => ayah.audio || ''),
      numberOfAyahs: arabic.numberOfAyahs,
    };

    logger.debug('Surah data parsed', {
      surahNumber: parsed.number,
      ayahCount: parsed.numberOfAyahs,
      audioLinksPresent: parsed.audioLinks.filter((link) => !!link).length,
    });

    return parsed;
  }, [data]);

  // Audio player
  const { currentAyahIndex } = useQuranAudioPlayer({
    surahNumber,
    surahName: surah?.englishName || '',
    audioLinks: surah?.audioLinks || [],
    reciter,
    enabled: !!surah,
    isPlayerSetup,
  });

  // Read ayahs count for this surah
  const readAyahsCount = getReadCountForSurah(surahNumber);

  // ✅ Log read progress
  useEffect(() => {
    if (!surah) return;

    const total = surah.numberOfAyahs || 0;
    const pct =
      total > 0 ? `${((readAyahsCount / total) * 100).toFixed(1)}%` : '0%';

    logger.debug('Read progress', {
      surahNumber,
      readCount: readAyahsCount,
      totalCount: total,
      percentComplete: pct,
    });
  }, [readAyahsCount, surah, surahNumber]);

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const toggleBookmark = useCallback(
    (ayahNumber: number) => {
      const currentlyBookmarked = checkIsBookmarked(surahNumber, ayahNumber);

      if (currentlyBookmarked) {
        logger.info('Removing bookmark', { surahNumber, ayahNumber });
        removeBookmark(surahNumber, ayahNumber);

        Toast.show({
          type: 'removed',
          text1: 'Ayah removed from bookmarks',
          visibilityTime: 2000,
        });
        return;
      }

      logger.info('Adding bookmark', {
        surahNumber,
        ayahNumber,
        surahName: surah?.englishName,
      });

      addBookmark({
        surahNumber,
        ayahNumber,
        surahName: surah?.englishName || 'Unknown',
      });

      Toast.show({
        type: 'success',
        text1: 'Ayah added to bookmarks',
        visibilityTime: 2000,
      });
    },
    [surahNumber, surah?.englishName, checkIsBookmarked, addBookmark, removeBookmark]
  );

  const toggleReadAyah = useCallback(
    (ayahNumber: number) => {
      const currentlyRead = isAyahRead(surahNumber, ayahNumber);

      if (currentlyRead) {
        logger.debug('Marking ayah as unread', { surahNumber, ayahNumber });
        unmarkAyahAsRead(surahNumber, ayahNumber);
      } else {
        logger.debug('Marking ayah as read', { surahNumber, ayahNumber });
        markAyahAsRead(surahNumber, ayahNumber);
      }
    },
    [surahNumber, isAyahRead, markAyahAsRead, unmarkAyahAsRead]
  );

  const isBookmarked = useCallback(
    (ayahNumber: number) => checkIsBookmarked(surahNumber, ayahNumber),
    [surahNumber, checkIsBookmarked]
  );

  const isRead = useCallback(
    (ayahNumber: number) => isAyahRead(surahNumber, ayahNumber),
    [surahNumber, isAyahRead]
  );

  const handleSurahChange = useCallback(
    (newSurahNumber: number) => {
      if (newSurahNumber === surahNumber) {
        logger.debug('Attempted to change to same surah', { surahNumber });
        return;
      }

      logger.info('Changing surah', { from: surahNumber, to: newSurahNumber });

      // Reset local UI states
      setSelectedSurah(newSurahNumber);
      setPickerVisible(false);
      didInitialScrollRef.current = false;

      router.replace(`/surahs/${newSurahNumber}`);

      logger.debug('Surah change navigation triggered');
    },
    [surahNumber, router]
  );

  const togglePickerVisibility = useCallback(() => {
    setPickerVisible((prev) => {
      const next = !prev;
      logger.debug('Surah picker visibility toggled', {
        visible: next,
        currentSurah: surahNumber,
      });
      return next;
    });
  }, [surahNumber]);

  // --------------------------------------------------------------------------
  // Auto-scroll behaviors
  // --------------------------------------------------------------------------

  // Auto-scroll to ayah when audio changes
  useEffect(() => {
    if (!listRef.current) return;
    if (currentAyahIndex == null) return;
    if (currentAyahIndex < 0) return;

    logger.debug('Auto-scrolling to current ayah', {
      ayahIndex: currentAyahIndex,
      ayahNumber: currentAyahIndex + 1,
      surahNumber,
    });

    try {
      listRef.current.scrollToIndex({
        index: currentAyahIndex,
        animated: true,
        viewPosition: 0.5,
      });
    } catch (e) {
      logger.warn('Auto-scroll failed (likely index not rendered yet)', {
        ayahIndex: currentAyahIndex,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [currentAyahIndex, surahNumber]);

  // Auto-scroll to initial ayah (from bookmark/deep link) - run once per surah load
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (!surah) return;
    if (!listRef.current) return;
    if (initialAyahIndex == null) return;

    // initialAyahIndex is 1-based; FlashList uses 0-based
    const targetIndex = Math.max(0, initialAyahIndex - 1);

    logger.info('Scrolling to initial ayah', {
      ayahIndex: targetIndex,
      ayahNumber: initialAyahIndex,
      surahNumber,
      fromBookmark: true,
    });

    didInitialScrollRef.current = true;

    const timeoutId = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.5,
        });
        logger.debug('Initial scroll completed');
      } catch (e) {
        logger.warn('Initial scroll failed (likely index not rendered yet)', {
          targetIndex,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [initialAyahIndex, surah, surahNumber]);

  return {
    // Data
    surah,
    isLoading,
    error: (error as Error) ?? null,

    // State
    currentAyahIndex,
    isPickerVisible,
    selectedSurah,
    readAyahsCount,

    // Actions
    toggleBookmark,
    toggleReadAyah,
    isBookmarked,
    isRead,
    handleSurahChange,
    togglePickerVisibility,

    // Refs
    listRef,
  };
}
