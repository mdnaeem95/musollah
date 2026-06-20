/**
 * Surah Detail — Mushaf Page View
 *
 * Opens at the standard Mushaf page for the selected surah.
 * Swipe left/right to navigate pages exactly as they appear in
 * the physical Uthmani Quran (604 pages).
 *
 * @version 3.0
 */

import React, {
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { FontAwesome6 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { useSurahDetailPage } from '../../../../hooks/quran/useSurahDetailPage';
import { useSurahs } from '../../../../api/services/quran';
import TrackPlayer from 'react-native-track-player';
import { MushafPlayingProvider } from '../../../../context/MushafPlayingContext';
import { FloatingPlayer } from '../../../../components/quran/FloatingPlayer';
import MushafPage from '../../../../components/quran/MushafPage';
import SettingsModal from '../../../../components/quran/SettingsModal';
import HifzSheet from '../../../../components/quran/HifzSheet';
import { useMushafPage } from '../../../../hooks/quran/useMushafPage';
import { enter } from '../../../../utils';
import { defaultStorage } from '../../../../api/client/storage';
import { SURAH_START_PAGES, TOTAL_MUSHAF_PAGES } from '../../../../constants/quranPages';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SurahDetailScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();

  const { id, ayahIndex, autoplay } = useLocalSearchParams<{
    id: string;
    ayahIndex?: string;
    autoplay?: string;
  }>();

  // surahNumber from route = where we entered; used only for the initial page
  const routeSurahNumber = id ? parseInt(id, 10) : 1;
  const initialAyahIndex = ayahIndex ? parseInt(ayahIndex, 10) : undefined;

  const { theme, isDarkMode, toggleDarkMode, textSize, setTextSize, reciter, setReciter } = useTheme();
  const { data: surahs = [] } = useSurahs();

  // --- pager state (must be declared before useSurahDetailPage so activeSurahNum is available)
  const pagerRef = useRef<PagerView>(null);
  const startPage = SURAH_START_PAGES[routeSurahNumber - 1] ?? 1;
  const [currentPage, setCurrentPage] = useState(startPage);

  // Page -> surah: the LAST surah that has started on/before `page`. A single
  // Mushaf page can hold several short surahs, so this resolves to the
  // bottom-most surah on the page — only correct once the user is actually
  // swiping pages, NOT for the initially-opened surah.
  const surahForPage = useCallback((page: number) => {
    let result = 1;
    for (let i = 0; i < SURAH_START_PAGES.length; i++) {
      if (SURAH_START_PAGES[i] <= page) result = i + 1;
      else break;
    }
    return result;
  }, []);

  // The surah header/progress/audio should reflect. Seeded with the surah the
  // user actually opened (routeSurahNumber) so audio plays THAT surah — not the
  // bottom-most one sharing its start page. It then follows the page on swipe.
  const [activeSurahNum, setActiveSurahNum] = useState(routeSurahNumber);

  // useSurahDetailPage uses activeSurahNum so header, progress, and audio all
  // update as the user swipes between pages
  const {
    surah,
    isLoading,
    error,
    currentAyahIndex,
    audioReady,
    isPickerVisible,
    selectedSurah,
    readAyahsCount,
    toggleReadAyah,
    isRead,
    handleSurahChange,
    togglePickerVisibility,
  } = useSurahDetailPage({ surahNumber: activeSurahNum, initialAyahIndex, reciter });

  // When surah changes via picker / new route entry (same component instance),
  // jump to its page and make it the active surah (so audio targets it).
  const prevRouteRef = useRef(routeSurahNumber);
  useEffect(() => {
    if (prevRouteRef.current !== routeSurahNumber) {
      prevRouteRef.current = routeSurahNumber;
      setActiveSurahNum(routeSurahNumber);
      const page = SURAH_START_PAGES[routeSurahNumber - 1];
      if (page && pagerRef.current) {
        pagerRef.current.setPage(page - 1);
        setCurrentPage(page);
      }
    }
  }, [routeSurahNumber]);

  // --- "Listen" entry: auto-start playback once the audio is ready
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoplay === '1' && audioReady && !autoStartedRef.current) {
      autoStartedRef.current = true;
      TrackPlayer.play().catch(() => {});
    }
  }, [autoplay, audioReady]);

  // --- fetch current page data to know which ayah starts this page
  const { data: currentPageData } = useMushafPage(currentPage);

  // Seek audio to the first ayah of the current page's surah.
  // Only triggered by an explicit swipe (seekRequestRef), never by data reloads.
  // This prevents the stuck-on-one-ayah bug where surah reloads re-triggered seeks.
  const seekRequestRef = useRef<{ page: number; done: boolean }>({ page: -1, done: true });

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    const newPage = e.nativeEvent.position + 1;
    setCurrentPage(newPage);
    // A real swipe re-derives the active surah from the page the user landed on.
    setActiveSurahNum(surahForPage(newPage));
    seekRequestRef.current = { page: newPage, done: false };
  }, [surahForPage]);

  useEffect(() => {
    if (seekRequestRef.current.done) return;
    if (!surah || !currentPageData) return;
    if (currentPageData.pageNumber !== seekRequestRef.current.page) return;

    seekRequestRef.current = { page: seekRequestRef.current.page, done: true };

    const firstAyah = currentPageData.ayahs.find(a => a.surahNumber === activeSurahNum);
    // ayah 1 = track 0, already the default start — no seek needed
    if (!firstAyah || firstAyah.ayahNumber === 1) return;

    TrackPlayer.skip(firstAyah.ayahNumber - 1).catch(() => {});
  }, [currentPage, currentPageData, surah, activeSurahNum]);

  // Prefetch adjacent pages so auto-flip and manual swipes are instant
  useMushafPage(currentPage - 1);
  useMushafPage(currentPage + 1);

  // Last ayah of the current surah shown on the current page
  const lastAyahOnPage = useMemo(() => {
    if (!currentPageData || currentPageData.pageNumber !== currentPage) return Infinity;
    const surahAyahs = currentPageData.ayahs.filter(a => a.surahNumber === activeSurahNum);
    if (surahAyahs.length === 0) return Infinity;
    return Math.max(...surahAyahs.map(a => a.ayahNumber));
  }, [currentPageData, currentPage, activeSurahNum]);

  // Auto-flip page when audio advances past the last ayah visible on the current page
  useEffect(() => {
    if (currentAyahIndex < 0 || lastAyahOnPage === Infinity) return;
    const playingAyahNum = currentAyahIndex + 1; // 1-based
    if (playingAyahNum > lastAyahOnPage) {
      const nextPage = currentPage + 1;
      if (nextPage <= TOTAL_MUSHAF_PAGES && pagerRef.current) {
        pagerRef.current.setPage(nextPage - 1);
        setCurrentPage(nextPage);
        // Audio is already at the right position — no seek needed
        seekRequestRef.current = { page: nextPage, done: true };
      }
    }
  }, [currentAyahIndex, lastAyahOnPage, currentPage]);

  // --- translation toggle (persisted to MMKV)
  const [showTranslation, setShowTranslation] = useState<boolean>(
    () => defaultStorage.getBoolean('quran-show-translation') ?? true
  );

  const toggleTranslation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTranslation((prev) => {
      const next = !prev;
      defaultStorage.setBoolean('quran-show-translation', next);
      return next;
    });
  }, []);

  // --- settings modal
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const toggleSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettingsVisible((v) => !v);
  }, []);

  // --- hifz (memorization) sheet
  const [isHifzVisible, setHifzVisible] = useState(false);
  const toggleHifz = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHifzVisible((v) => !v);
  }, []);

  // --- mark all ayahs in the current surah as read
  const handleMarkAllRead = useCallback(() => {
    if (!surah) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    for (let i = 1; i <= surah.numberOfAyahs; i++) {
      if (!isRead(i)) toggleReadAyah(i);
    }
  }, [surah, isRead, toggleReadAyah]);

  // --- header: surah title (tappable) + eye + gear
  useLayoutEffect(() => {
    if (!surah) return;

    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            togglePickerVisibility();
          }}
          style={styles.headerContainer}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerText, { color: theme.colors.text.primary }]}>
            {surah.englishName}
          </Text>
          <FontAwesome6
            name={isPickerVisible ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 4 }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/listen/${activeSurahNum}`);
            }}
            style={[styles.headerButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' }]}
          >
            <FontAwesome6 name="headphones" size={16} color={theme.colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleTranslation}
            style={[styles.headerButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' }]}
          >
            <FontAwesome6
              name={showTranslation ? 'eye' : 'eye-slash'}
              size={16}
              color={showTranslation ? theme.colors.accent : theme.colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleHifz}
            style={[styles.headerButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' }]}
          >
            <FontAwesome6 name="brain" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleSettings}
            style={[styles.headerButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' }]}
          >
            <FontAwesome6 name="gear" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [
    navigation, surah, isPickerVisible, showTranslation, isDarkMode, router, activeSurahNum,
    theme.colors.text.primary, theme.colors.text.secondary, theme.colors.accent,
    togglePickerVisibility, toggleTranslation, toggleSettings, toggleHifz,
  ]);

  // --- progress card
  const renderProgressCard = useCallback(() => {
    if (!surah) return null;
    const pct = Math.round((readAyahsCount / surah.numberOfAyahs) * 100);
    const isComplete = pct === 100;

    return (
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.progressCard, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
      >
        <View style={styles.progressHeader}>
          <View style={styles.progressTitleRow}>
            <FontAwesome6 name="book-quran" size={14} color={theme.colors.accent} />
            <Text style={[styles.progressTitle, { color: theme.colors.text.primary }]}>
              {surah.number}. {surah.englishName}
            </Text>
          </View>
          <View style={styles.progressActions}>
            <Text style={[styles.progressCount, { color: theme.colors.accent }]}>
              {readAyahsCount}/{surah.numberOfAyahs}
            </Text>
            {!isComplete && (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={[styles.markAllBtn, { backgroundColor: theme.colors.accent + '18' }]}
              >
                <FontAwesome6 name="check-double" size={12} color={theme.colors.accent} />
                <Text style={[styles.markAllText, { color: theme.colors.accent }]}>
                  Mark all
                </Text>
              </TouchableOpacity>
            )}
            {isComplete && (
              <View style={[styles.completeBadge, { backgroundColor: theme.colors.text.success + '20' }]}>
                <FontAwesome6 name="check" size={11} color={theme.colors.text.success} />
                <Text style={[styles.completeText, { color: theme.colors.text.success }]}>
                  Complete
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.progressBarRow}>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.muted }]}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: theme.colors.accent }]} />
          </View>
          <Text style={[styles.progressPct, { color: theme.colors.text.secondary }]}>
            {pct}%
          </Text>
        </View>
      </BlurView>
    );
  }, [surah, readAyahsCount, theme, isDarkMode, handleMarkAllRead]);

  // --- playing state for context (updates on every ayah advance — cheap, only 1-3 pages rendered)
  const playingState = useMemo(() => ({
    surahNum: activeSurahNum,
    ayahNum: currentAyahIndex >= 0 ? currentAyahIndex + 1 : 0,
  }), [activeSurahNum, currentAyahIndex]);

  // --- 604 page children (memoized so they only re-create when settings change)
  const pageViews = useMemo(() =>
    Array.from({ length: TOTAL_MUSHAF_PAGES }, (_, i) => {
      const pageNum = i + 1;
      return (
        <View key={pageNum} style={{ flex: 1 }}>
          <MushafPage
            pageNumber={pageNum}
            showTranslation={showTranslation}
            accentColor={theme.colors.accent}
            textPrimary={theme.colors.text.primary}
            textSecondary={theme.colors.text.secondary}
            isDarkMode={isDarkMode}
            textSize={textSize}
          />
        </View>
      );
    }),
    [showTranslation, theme.colors.accent, theme.colors.text.primary, theme.colors.text.secondary, isDarkMode, textSize]
  );

  // ---- LOADING
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF' }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading Surah...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---- ERROR
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF' }}>
        <View style={styles.center}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={enter(0)}
            style={styles.errorContainer}
          >
            <View style={[styles.errorIcon, { backgroundColor: theme.colors.text.error + '15' }]}>
              <FontAwesome6 name="triangle-exclamation" size={48} color={theme.colors.text.error} />
            </View>
            <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
              Something went wrong
            </Text>
            <Text style={[styles.errorMessage, { color: theme.colors.text.secondary }]}>
              {error.message}
            </Text>
          </MotiView>
        </View>
      </SafeAreaView>
    );
  }

  if (!surah) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF' }}>
        <View style={styles.center}>
          <Text style={[styles.errorMessage, { color: theme.colors.text.primary }]}>
            Surah not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---- MAIN VIEW
  return (
    <LinearGradient
      colors={isDarkMode ? ['#060B18', '#0C1428', '#080F1E'] as const : ['#EEF2FF', '#F0F4FF', '#E8EFFF'] as const}
      style={styles.container}
    >
      {/* Surah progress card */}
      {renderProgressCard()}

      {/* Mushaf page pager — wrapped in playing context so MushafPage can highlight the active ayah */}
      <MushafPlayingProvider value={playingState}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={startPage - 1}
          onPageSelected={handlePageSelected}
          overdrag
        >
          {pageViews}
        </PagerView>
      </MushafPlayingProvider>

      {/* Floating audio player */}
      <FloatingPlayer />

      {/* Surah picker overlay */}
      {isPickerVisible && (
        <BlurView
          intensity={40}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.pickerContainer, {
            backgroundColor: isDarkMode ? 'rgba(6,11,24,0.96)' : 'rgba(238,242,255,0.96)',
          }]}
        >
          <Picker
            selectedValue={selectedSurah}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSurahChange(value);
            }}
            style={styles.picker}
          >
            {surahs.map((s) => (
              <Picker.Item
                key={s.number}
                label={`${s.number}. ${s.englishName}`}
                value={s.number}
                color={theme.colors.text.primary}
              />
            ))}
          </Picker>
        </BlurView>
      )}

      {/* Settings modal */}
      <SettingsModal
        isVisible={isSettingsVisible}
        onClose={toggleSettings}
        textSize={textSize}
        onTextSizeChange={setTextSize}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        reciter={reciter}
        onReciterChange={setReciter}
        activeTheme={theme}
        showReciter={true}
      />

      {/* Memorization (hifz) controls */}
      <HifzSheet visible={isHifzVisible} onClose={toggleHifz} />
    </LinearGradient>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Progress card
  progressCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  progressTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  progressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressCount: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  markAllText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  completeText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPct: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    minWidth: 36,
    textAlign: 'right',
  },

  // Picker
  pickerContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 8,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  picker: { width: '100%' },

  // States
  loadingText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
});

export default SurahDetailScreen;
