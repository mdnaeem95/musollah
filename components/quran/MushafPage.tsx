/**
 * MushafPage
 *
 * Renders a single Quran page as flowing Arabic text, matching the standard
 * Uthmani Mushaf page layout. Ayahs from multiple surahs on one page are
 * handled naturally — a surah header is shown whenever a new surah begins.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useMushafPage } from '../../hooks/quran/useMushafPage';
import { useMushafPlaying } from '../../context/MushafPlayingContext';
import { useHifzStore } from '../../stores/useHifzStore';
import type { MushafAyah } from '../../api/services/quran/mushafPage';

// ============================================================================
// HELPERS
// ============================================================================

function toArabicNumerals(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

function groupBySurah(ayahs: MushafAyah[]) {
  const groups: { surahNumber: number; ayahs: MushafAyah[] }[] = [];
  for (const ayah of ayahs) {
    const last = groups[groups.length - 1];
    if (last && last.surahNumber === ayah.surahNumber) {
      last.ayahs.push(ayah);
    } else {
      groups.push({ surahNumber: ayah.surahNumber, ayahs: [ayah] });
    }
  }
  return groups;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface Theme {
  accent: string;
  textPrimary: string;
  textSecondary: string;
  isDarkMode: boolean;
}

const SurahHeader = React.memo(({ ayah, theme }: { ayah: MushafAyah; theme: Theme }) => (
  <View style={[surahHeaderStyles.container, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '0C' }]}>
    <Text style={[surahHeaderStyles.arabicName, { color: theme.textPrimary }]}>
      {ayah.surahName}
    </Text>
    <Text style={[surahHeaderStyles.englishName, { color: theme.textSecondary }]}>
      {ayah.surahEnglishName} — {ayah.surahEnglishNameTranslation}
    </Text>
    <View style={surahHeaderStyles.badges}>
      <View style={[surahHeaderStyles.badge, { backgroundColor: theme.accent + '18' }]}>
        <FontAwesome6
          name={ayah.revelationType === 'Meccan' ? 'kaaba' : 'city'}
          size={10}
          color={theme.accent}
        />
        <Text style={[surahHeaderStyles.badgeText, { color: theme.accent }]}>
          {ayah.revelationType}
        </Text>
      </View>
      <View style={[surahHeaderStyles.badge, { backgroundColor: theme.accent + '18' }]}>
        <Text style={[surahHeaderStyles.badgeText, { color: theme.accent }]}>
          {ayah.numberOfAyahs} ayahs
        </Text>
      </View>
    </View>
  </View>
));

const Bismillah = React.memo(({ theme }: { theme: Theme }) => (
  <View style={bismillahStyles.container}>
    <Text style={[bismillahStyles.text, { color: theme.textPrimary }]}>
      بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
    </Text>
    <View style={[bismillahStyles.line, { backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)' }]} />
  </View>
));

// Arabic text block — all ayahs for one surah group rendered as flowing inline text
const ArabicBlock = React.memo(({
  ayahs,
  theme,
  textSize,
}: {
  ayahs: MushafAyah[];
  theme: Theme;
  textSize: number;
}) => {
  const lineHeight = Math.round(textSize * 2.4);
  const { surahNum: playingSurah, ayahNum: playingAyah } = useMushafPlaying();

  return (
    <Text
      style={[
        arabicStyles.block,
        {
          fontSize: textSize,
          lineHeight,
          color: theme.textPrimary,
          ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
        },
      ]}
    >
      {ayahs.map((ayah, i) => {
        const isActive = playingAyah > 0
          && ayah.surahNumber === playingSurah
          && ayah.ayahNumber === playingAyah;
        return (
          <React.Fragment key={ayah.globalNumber}>
            {i > 0 ? <Text> </Text> : null}
            <Text style={{ color: isActive ? theme.accent : theme.textPrimary }}>
              {ayah.arabic}
            </Text>
            <Text style={{ color: theme.accent }}>
              {'\u06DD' + toArabicNumerals(ayah.ayahNumber)}
            </Text>
          </React.Fragment>
        );
      })}
    </Text>
  );
});

// Translation block — numbered list below each surah's arabic block
const TranslationBlock = React.memo(({
  ayahs,
  theme,
}: {
  ayahs: MushafAyah[];
  theme: Theme;
}) => {
  const { surahNum: playingSurah, ayahNum: playingAyah } = useMushafPlaying();
  return (
    <View style={[translationStyles.container, { borderTopColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
      {ayahs.map((ayah) => {
        const isActive = playingAyah > 0
          && ayah.surahNumber === playingSurah
          && ayah.ayahNumber === playingAyah;
        return (
          <View key={ayah.globalNumber} style={translationStyles.row}>
            <Text style={[translationStyles.number, { color: theme.accent }]}>
              {ayah.ayahNumber}
            </Text>
            <Text style={[translationStyles.text, { color: isActive ? theme.accent : theme.textSecondary }]}>
              {ayah.translation}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface MushafPageProps {
  pageNumber: number;
  showTranslation: boolean;
  accentColor: string;
  textPrimary: string;
  textSecondary: string;
  isDarkMode: boolean;
  textSize: number;
}

const MushafPage = ({
  pageNumber,
  showTranslation,
  accentColor,
  textPrimary,
  textSecondary,
  isDarkMode,
  textSize,
}: MushafPageProps) => {
  const { data, isLoading, error } = useMushafPage(pageNumber);

  // Hifz test mode — hide the page until tapped, to practise recall.
  const testMode = useHifzStore((s) => s.testMode);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setRevealed(false); }, [testMode]);
  const hidden = testMode && !revealed;

  const theme: Theme = useMemo(() => ({
    accent: accentColor,
    textPrimary,
    textSecondary,
    isDarkMode,
  }), [accentColor, textPrimary, textSecondary, isDarkMode]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={accentColor} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <FontAwesome6 name="wifi" size={24} color={textSecondary} />
        <Text style={[styles.errorText, { color: textSecondary }]}>
          {error ? 'Network error — check your connection' : 'Page unavailable'}
        </Text>
      </View>
    );
  }

  const surahGroups = groupBySurah(data.ayahs);

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Juz badge */}
      <View style={styles.juzRow}>
        <View style={[styles.juzBadge, { backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.juzText, { color: accentColor }]}>
            Juz {data.juz}
          </Text>
        </View>
        <View style={[styles.pageBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <Text style={[styles.pageText, { color: textSecondary }]}>
            Page {pageNumber}
          </Text>
        </View>
      </View>

      {surahGroups.map((group) => {
        const firstAyah = group.ayahs[0];
        return (
          <View key={group.surahNumber} style={styles.surahGroup}>
            {/* Surah header — shown when this surah starts on this page */}
            {firstAyah.isSurahStart && (
              <SurahHeader ayah={firstAyah} theme={theme} />
            )}

            {/* Bismillah — at surah starts, not for At-Tawbah (9) */}
            {firstAyah.isSurahStart && group.surahNumber !== 9 && (
              <Bismillah theme={theme} />
            )}

            {/* Flowing Arabic text */}
            <ArabicBlock ayahs={group.ayahs} theme={theme} textSize={textSize} />

            {/* Translation (optional) */}
            {showTranslation && (
              <TranslationBlock ayahs={group.ayahs} theme={theme} />
            )}
          </View>
        );
      })}
    </ScrollView>

      {/* Test mode: cover the page until tapped */}
      {hidden && (
        <Pressable
          onPress={() => setRevealed(true)}
          style={[StyleSheet.absoluteFill, styles.testOverlay, { backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF' }]}
        >
          <View style={[styles.testCard, { backgroundColor: accentColor + '14', borderColor: accentColor + '40' }]}>
            <FontAwesome6 name="eye-slash" size={30} color={accentColor} />
            <Text style={[styles.testTitle, { color: textPrimary }]}>Recite from memory</Text>
            <Text style={[styles.testHint, { color: textSecondary }]}>Tap anywhere to reveal & check</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 130,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  juzRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  juzBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  juzText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  pageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pageText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
  },
  surahGroup: {
    marginBottom: 12,
  },
  testOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  testCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  testTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    marginTop: 4,
  },
  testHint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
});

const surahHeaderStyles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    marginTop: 8,
  },
  arabicName: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'center',
  },
  englishName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
  },
});

const bismillahStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },
  text: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 44,
  },
  line: {
    width: 50,
    height: 1,
    marginTop: 6,
  },
});

const arabicStyles = StyleSheet.create({
  block: {
    fontFamily: 'Amiri_400Regular',
    textAlign: 'justify',
    writingDirection: 'rtl',
    marginVertical: 8,
  },
});

const translationStyles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 10,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  number: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    minWidth: 24,
    textAlign: 'center',
    marginTop: 3,
  },
  text: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
});

export default React.memo(MushafPage);
