/**
 * Listen — dedicated audio-first Quran player.
 *
 * Distinct from the Read (Mushaf) reader: a "now playing" experience built
 * around the recitation. Big surah/reciter header, the current ayah following
 * along (Arabic + translation), a seek bar, prominent transport + hifz controls
 * (speed, repeat-each-ayah), and an "Up next" queue that plays surah-after-surah
 * continuously.
 *
 * @version 1.0
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import TrackPlayer, { useProgress, useIsPlaying } from 'react-native-track-player';

import { useTheme } from '../../../../context/ThemeContext';
import { useAccent } from '../../../../hooks/useAccent';
import { useSurahWithTranslation, useSurahs, TOTAL_SURAHS } from '../../../../api/services/quran';
import { useQuranAudioPlayer } from '../../../../hooks/quran/useQuranAudioPlayer';
import { useTrackPlayerSetup } from '../../../../hooks/quran/useTrackPlayerSetup';
import { useHifzStore, REPEAT_OFF, REPEAT_INFINITE } from '../../../../stores/useHifzStore';
import SettingsModal from '../../../../components/quran/SettingsModal';
import { reciterOptions } from '../../../../utils/constants';
import { enter } from '../../../../utils';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
const REPEATS = [REPEAT_OFF, 3, 5, REPEAT_INFINITE] as const;

const fmt = (secs: number) => {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const ListenScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { theme, isDarkMode, reciter, setReciter, textSize, setTextSize, toggleDarkMode } = useTheme();
  const { accent } = useAccent();

  const { id } = useLocalSearchParams<{ id: string }>();
  const routeSurah = id ? parseInt(id, 10) : 1;

  // The surah currently playing. Seeded from the route, then advanced
  // automatically as each surah finishes (continuous listening).
  const [activeSurah, setActiveSurah] = useState(routeSurah);

  // Follow a new route param if the user re-enters with a different surah.
  const prevRouteRef = useRef(routeSurah);
  useEffect(() => {
    if (prevRouteRef.current !== routeSurah) {
      prevRouteRef.current = routeSurah;
      setActiveSurah(routeSurah);
    }
  }, [routeSurah]);

  const { isSetup } = useTrackPlayerSetup();
  const { data, isLoading } = useSurahWithTranslation(activeSurah);
  const { data: surahs = [] } = useSurahs();

  const arabicAyahs = useMemo(() => data?.arabic.ayahs.map((a) => a.text) ?? [], [data]);
  const translations = useMemo(() => data?.translation?.ayahs?.map((a) => a.text) ?? [], [data]);
  const audioLinks = useMemo(() => data?.arabic.ayahs.map((a) => a.audio || '') ?? [], [data]);
  const englishName = data?.arabic.englishName ?? '';
  const arabicName = data?.arabic.name ?? '';
  const numberOfAyahs = data?.arabic.numberOfAyahs ?? arabicAyahs.length;

  // Advance to the next surah when this one finishes (continuous play).
  const handleQueueEnd = useCallback(() => {
    setActiveSurah((s) => (s < TOTAL_SURAHS ? s + 1 : s));
  }, []);

  const { currentAyahIndex, isReady } = useQuranAudioPlayer({
    surahNumber: activeSurah,
    surahName: englishName,
    audioLinks,
    reciter,
    enabled: !!data,
    isPlayerSetup: isSetup,
    onQueueEnd: handleQueueEnd,
  });

  // Auto-play whenever a new surah's tracks become ready (initial + continuous).
  const autoPlayedForRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isReady) return;
    if (autoPlayedForRef.current === activeSurah) return;
    autoPlayedForRef.current = activeSurah;
    TrackPlayer.play().catch(() => {});
  }, [isReady, activeSurah]);

  const progress = useProgress(300);
  const { playing } = useIsPlaying();

  // Hifz controls
  const playbackRate = useHifzStore((s) => s.playbackRate);
  const repeatEachAyah = useHifzStore((s) => s.repeatEachAyah);
  const setPlaybackRate = useHifzStore((s) => s.setPlaybackRate);
  const setRepeatEachAyah = useHifzStore((s) => s.setRepeatEachAyah);

  const reciterLabel = reciterOptions.find((r) => r.value === reciter)?.label ?? 'Unknown Reciter';

  // --- header: title + settings (reciter)
  const [settingsVisible, setSettingsVisible] = useState(false);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Now Playing',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={12}
          style={styles.headerBtn}
        >
          <FontAwesome6 name="arrow-left" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSettingsVisible(true);
          }}
          hitSlop={12}
          style={styles.headerBtn}
        >
          <FontAwesome6 name="sliders" size={18} color={theme.colors.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, theme.colors.text.primary]);

  // --- transport
  const togglePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (playing) TrackPlayer.pause();
    else TrackPlayer.play();
  }, [playing]);

  const nextAyah = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    TrackPlayer.skipToNext().catch(() => {});
  }, []);

  const prevAyah = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    TrackPlayer.skipToPrevious().catch(() => {});
  }, []);

  const cycleSpeed = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const i = SPEEDS.indexOf(playbackRate as (typeof SPEEDS)[number]);
    setPlaybackRate(SPEEDS[(i + 1) % SPEEDS.length]);
  }, [playbackRate, setPlaybackRate]);

  const cycleRepeat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const i = REPEATS.indexOf(repeatEachAyah as (typeof REPEATS)[number]);
    setRepeatEachAyah(REPEATS[(i + 1) % REPEATS.length]);
  }, [repeatEachAyah, setRepeatEachAyah]);

  const repeatLabel =
    repeatEachAyah === REPEAT_OFF ? null : repeatEachAyah === REPEAT_INFINITE ? '∞' : `${repeatEachAyah}×`;
  const repeatActive = repeatEachAyah !== REPEAT_OFF;

  // Up-next: the following few surahs.
  const upNext = useMemo(
    () => surahs.filter((s: any) => s.number > activeSurah).slice(0, 3),
    [surahs, activeSurah]
  );

  const ayahNumber = currentAyahIndex >= 0 ? currentAyahIndex + 1 : 1;
  const currentArabic = arabicAyahs[currentAyahIndex] ?? '';
  const currentTranslation = translations[currentAyahIndex] ?? '';

  const pct = progress.duration > 0 ? Math.min(1, progress.position / progress.duration) : 0;

  if (isLoading && !data) {
    return (
      <LinearGradient
        colors={isDarkMode ? ['#060B18', '#0C1428', '#080F1E'] : ['#EEF2FF', '#F0F4FF', '#E8EFFF']}
        style={[styles.container, styles.center]}
      >
        <ActivityIndicator size="large" color={accent} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDarkMode ? ['#060B18', '#0C1428', '#080F1E'] : ['#EEF2FF', '#F0F4FF', '#E8EFFF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Now-playing hero */}
        <MotiView from={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={enter(0)} style={styles.hero}>
          <LinearGradient
            colors={[accent, accent + 'AA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.art}
          >
            <Text style={styles.artArabic} numberOfLines={1} adjustsFontSizeToFit>
              {arabicName}
            </Text>
          </LinearGradient>
          <Text style={[styles.surahName, { color: theme.colors.text.primary }]}>
            {activeSurah}. {englishName}
          </Text>
          <View style={styles.reciterRow}>
            <FontAwesome6 name="microphone-lines" size={12} color={theme.colors.text.secondary} />
            <Text style={[styles.reciterName, { color: theme.colors.text.secondary }]}>{reciterLabel}</Text>
          </View>
        </MotiView>

        {/* Current ayah (follow-along) */}
        <View
          style={[styles.ayahCard, {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          }]}
        >
          <View style={[styles.ayahBadge, { backgroundColor: accent + '1A' }]}>
            <Text style={[styles.ayahBadgeText, { color: accent }]}>
              Ayah {ayahNumber} of {numberOfAyahs}
            </Text>
          </View>
          <Text style={[styles.arabic, { color: theme.colors.text.primary }]}>{currentArabic}</Text>
          {!!currentTranslation && (
            <Text style={[styles.translation, { color: theme.colors.text.secondary }]}>{currentTranslation}</Text>
          )}
        </View>

        {/* Seek bar */}
        <View style={styles.seekRow}>
          <View style={[styles.track, { backgroundColor: theme.colors.muted }]}>
            <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: accent }]} />
          </View>
          <View style={styles.times}>
            <Text style={[styles.time, { color: theme.colors.text.muted }]}>{fmt(progress.position)}</Text>
            <Text style={[styles.time, { color: theme.colors.text.muted }]}>{fmt(progress.duration)}</Text>
          </View>
        </View>

        {/* Transport */}
        <View style={styles.transport}>
          <TouchableOpacity onPress={cycleRepeat} style={styles.sideBtn} hitSlop={8}>
            <FontAwesome6 name="repeat" size={18} color={repeatActive ? accent : theme.colors.text.secondary} />
            {repeatLabel && (
              <Text style={[styles.sideBtnBadge, { color: accent }]}>{repeatLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={prevAyah} hitSlop={8}>
            <FontAwesome6 name="backward-step" size={26} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlay} activeOpacity={0.85}>
            <LinearGradient colors={[accent, accent + 'CC']} style={styles.playBtn}>
              {isReady ? (
                <FontAwesome6 name={playing ? 'pause' : 'play'} size={24} color="#fff" solid />
              ) : (
                <ActivityIndicator color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={nextAyah} hitSlop={8}>
            <FontAwesome6 name="forward-step" size={26} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={cycleSpeed} style={styles.sideBtn} hitSlop={8}>
            <Text style={[styles.speedText, { color: playbackRate !== 1 ? accent : theme.colors.text.secondary }]}>
              {playbackRate}×
            </Text>
          </TouchableOpacity>
        </View>

        {/* Read-along entry */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/surahs/${activeSurah}`);
          }}
          style={[styles.readAlong, { borderColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}
        >
          <FontAwesome6 name="book-open" size={13} color={theme.colors.text.secondary} />
          <Text style={[styles.readAlongText, { color: theme.colors.text.secondary }]}>Open in Mushaf (Read)</Text>
        </TouchableOpacity>

        {/* Up next */}
        {upNext.length > 0 && (
          <View style={styles.upNext}>
            <Text style={[styles.upNextLabel, { color: theme.colors.text.muted }]}>UP NEXT</Text>
            {upNext.map((s: any) => (
              <Pressable
                key={s.number}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  autoPlayedForRef.current = null;
                  setActiveSurah(s.number);
                }}
                style={({ pressed }) => [styles.upNextRow, pressed && { opacity: 0.6 }]}
              >
                <View style={[styles.upNextNum, { backgroundColor: accent + '14' }]}>
                  <Text style={[styles.upNextNumText, { color: accent }]}>{s.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.upNextName, { color: theme.colors.text.primary }]}>{s.englishName}</Text>
                  <Text style={[styles.upNextSub, { color: theme.colors.text.muted }]}>
                    {s.numberOfAyahs} ayahs
                  </Text>
                </View>
                <FontAwesome6 name="play" size={11} color={theme.colors.text.muted} solid />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <SettingsModal
        isVisible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        textSize={textSize}
        onTextSizeChange={setTextSize}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        reciter={reciter}
        onReciterChange={setReciter}
        activeTheme={theme}
        showReciter={true}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },

  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  art: {
    width: 150,
    height: 150,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  artArabic: { fontFamily: 'Amiri_400Regular', fontSize: 34, color: '#fff' },
  surahName: { fontFamily: 'Outfit_700Bold', fontSize: 22 },
  reciterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  reciterName: { fontFamily: 'Outfit_400Regular', fontSize: 14 },

  // Ayah card
  ayahCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    minHeight: 150,
    justifyContent: 'center',
  },
  ayahBadge: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
  ayahBadgeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  arabic: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 28,
    lineHeight: 52,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  translation: { fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 14 },

  // Seek
  seekRow: { marginBottom: 16 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { fontFamily: 'Outfit_500Medium', fontSize: 11 },

  // Transport
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 20 },
  sideBtn: { width: 48, alignItems: 'center', justifyContent: 'center' },
  sideBtnBadge: { fontFamily: 'Outfit_700Bold', fontSize: 10, marginTop: 2 },
  speedText: { fontFamily: 'Outfit_700Bold', fontSize: 15 },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  // Read-along
  readAlong: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  readAlongText: { fontFamily: 'Outfit_500Medium', fontSize: 13 },

  // Up next
  upNext: { gap: 4 },
  upNextLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  upNextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  upNextNum: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  upNextNumText: { fontFamily: 'Outfit_700Bold', fontSize: 13 },
  upNextName: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  upNextSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 1 },
});

export default ListenScreen;
