/**
 * Surah Detail Page Hook
 * 
 * Business logic for the Surah text screen.
 * Handles data fetching, bookmarks, read tracking, and navigation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Toast from 'react-native-toast-message';
import { useSurahWithTranslation } from '../../api/services/quran';
import { useQuranStore } from '../../stores/useQuranStore';
import { useQuranAudioPlayer } from './useQuranAudioPlayer';
import { useTrackPlayerSetup } from './useTrackPlayerSetup';

// ============================================================================
// TYPES
// ============================================================================

interface UseSurahDetailPageParams {
  surahNumber: number;
  initialAyahIndex?: number;
  reciter: string;
}

interface UseSurahDetailPageReturn {
  // Data
  surah: {
    number: number;
    name: string;
    englishName: string;
    arabicAyahs: string[];
    englishTranslations: string[];
    audioLinks: string[];
    numberOfAyahs: number;
  } | null;
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
  listRef: React.RefObject<FlashList<string>>;
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
  const listRef = useRef<FlashList<string>>(null);

  // State
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(surahNumber);

  // Fetch surah data
  const { data, isLoading, error } = useSurahWithTranslation(surahNumber);

  // Zustand store
  const {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked: checkIsBookmarked,
    markAyahAsRead,
    unmarkAyahAsRead,
    isAyahRead,
    getReadCountForSurah,
  } = useQuranStore();

  // Parse surah data
  const surah = useMemo(() => {
    if (!data) return null;

    const { arabic, translation } = data;

    return {
      number: arabic.number,
      name: arabic.name,
      englishName: arabic.englishName,
      arabicAyahs: arabic.ayahs.map((ayah) => ayah.text),
      englishTranslations: translation.ayahs.map((ayah) => ayah.text),
      audioLinks: arabic.ayahs.map((ayah) => ayah.audio || ''),
      numberOfAyahs: arabic.numberOfAyahs,
    };
  }, [data]);

  // Audio player
  const { currentAyahIndex } = useQuranAudioPlayer({
    surahNumber,
    surahName: surah?.englishName || '',
    audioLinks: surah?.audioLinks || [],
    reciter,
    enabled: !!surah,
    isPlayerSetup
  });

  // Read ayahs count for this surah
  const readAyahsCount = getReadCountForSurah(surahNumber);

  /**
   * Toggle bookmark for an ayah
   */
  const toggleBookmark = useCallback(
    (ayahNumber: number) => {
      const isCurrentlyBookmarked = checkIsBookmarked(surahNumber, ayahNumber);

      if (isCurrentlyBookmarked) {
        removeBookmark(surahNumber, ayahNumber);
        Toast.show({
          type: 'removed',
          text1: 'Ayah removed from bookmarks',
          visibilityTime: 2000,
        });
      } else {
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
      }
    },
    [surahNumber, surah, checkIsBookmarked, addBookmark, removeBookmark]
  );

  /**
   * Toggle read status for an ayah
   */
  const toggleReadAyah = useCallback(
    (ayahNumber: number) => {
      const isCurrentlyRead = isAyahRead(surahNumber, ayahNumber);

      if (isCurrentlyRead) {
        unmarkAyahAsRead(surahNumber, ayahNumber);
      } else {
        markAyahAsRead(surahNumber, ayahNumber);
      }
    },
    [surahNumber, isAyahRead, markAyahAsRead, unmarkAyahAsRead]
  );

  /**
   * Check if ayah is bookmarked
   */
  const isBookmarked = useCallback(
    (ayahNumber: number) => checkIsBookmarked(surahNumber, ayahNumber),
    [surahNumber, checkIsBookmarked]
  );

  /**
   * Check if ayah is read
   */
  const isRead = useCallback(
    (ayahNumber: number) => isAyahRead(surahNumber, ayahNumber),
    [surahNumber, isAyahRead]
  );

  /**
   * Navigate to different surah
   */
  const handleSurahChange = useCallback(
    (newSurahNumber: number) => {
      if (newSurahNumber !== surahNumber) {
        setSelectedSurah(newSurahNumber);
        setPickerVisible(false);
        router.replace(`/surahs/${newSurahNumber}`);
      }
    },
    [surahNumber, router]
  );

  /**
   * Toggle surah picker visibility
   */
  const togglePickerVisibility = useCallback(() => {
    setPickerVisible((prev) => !prev);
  }, []);

  /**
   * Auto-scroll to ayah when audio changes
   */
  useEffect(() => {
    if (currentAyahIndex !== null && listRef.current) {
      listRef.current.scrollToIndex({
        index: currentAyahIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [currentAyahIndex]);

  /**
   * Auto-scroll to initial ayah (from bookmark/deep link)
   */
  useEffect(() => {
    if (initialAyahIndex && surah && listRef.current) {
      const timeoutId = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: initialAyahIndex - 1, // 0-based index
          animated: true,
          viewPosition: 0.5,
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [initialAyahIndex, surah]);

  return {
    // Data
    surah,
    isLoading,
    error,

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