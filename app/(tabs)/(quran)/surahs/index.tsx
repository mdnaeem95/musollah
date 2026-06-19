import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import SurahItem from '../../../../components/quran/SurahItem';
import { useTheme } from '../../../../context/ThemeContext';
import { FlashList } from '@shopify/flash-list';
import JuzItem from '../../../../components/quran/JuzItem';
import { juzMeta } from '../../../../data/juzMeta';
import { calculateTotalAyahs, countReadAyahsInJuz } from '../../../../utils/quran';
import { useSurahs } from '../../../../api/services/quran';
import { useQuranStore } from '../../../../stores/useQuranStore';

type SurahForItem = {
  id: string;
  number: number;
  arabicName: string;
  englishName: string;
  englishTranslation: string;
  englishNameTranslation: string;
  arabicText: string;
  audioLinks: string;
  numberOfAyahs: number;
  revelationType?: string;
};

const Surahs = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  // "Listen" entry (from the Quran home) opens surahs with autoplay; "Read" doesn't.
  const { mode: navMode } = useLocalSearchParams<{ mode?: string }>();
  const listenMode = navMode === 'listen';
  const openSurah = (surahNumber: number) =>
    router.push(listenMode ? `/surahs/${surahNumber}?autoplay=1` : `/surahs/${surahNumber}`);

  // TanStack Query for surahs
  const { data: surahs = [], isLoading } = useSurahs();

  // Zustand for reading progress
  const readAyahs = useQuranStore((state) => state.readAyahs);
  const getReadCountForSurah = useQuranStore((state) => state.getReadCountForSurah);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [mode, setMode] = useState<'surah' | 'juz'>('surah');
  const [renderMode, setRenderMode] = useState<'surah' | 'juz'>('surah');

  // Smooth mode transition
  useEffect(() => {
    const timeout = setTimeout(() => setRenderMode(mode), 100);
    return () => clearTimeout(timeout);
  }, [mode]);

  const itemSurahs: SurahForItem[] = useMemo(() => {
    return surahs.map((s: any) => ({
      id: String(s.id ?? s.number),
      number: s.number,
      arabicName: s.name ?? '',                         // fallback if missing
      englishName: s.englishName ?? '',
      englishTranslation: s.englishTranslation ?? '',
      englishNameTranslation: s.englishNameTranslation ?? '',
      arabicText: s.arabicText ?? '',                   // required by SurahItem -> default to ''
      audioLinks: Array.isArray(s.audioLinks) ? s.audioLinks : [], // required -> default []
      numberOfAyahs: s.numberOfAyahs ?? s.ayahs ?? 0,
      revelationType: s.revelationType ?? '',
    }));
  }, [surahs]);

  // Calculate progress maps from Zustand state
  const { readAyahsMap, juzProgressMap } = useMemo(() => {
    const countMap: Record<number, number> = {};
    const juzMap: Record<number, { read: number; total: number }> = {};

    // Count read ayahs per surah
    for (const key of readAyahs) {
      const [s] = key.split(':');
      const surahNum = parseInt(s, 10);
      countMap[surahNum] = (countMap[surahNum] || 0) + 1;
    }

    // Calculate juz progress
    for (const juz of juzMeta) {
      const total = calculateTotalAyahs(juz);
      const read = countReadAyahsInJuz(juz, readAyahs);
      juzMap[juz.number] = { total, read };
    }

    return { readAyahsMap: countMap, juzProgressMap: juzMap };
  }, [readAyahs]);

  const filteredSurahs = useMemo(() => {
    return itemSurahs.filter(
      (surah) =>
        (surah.englishName && surah.englishName.toLowerCase().includes(debounceQuery.toLowerCase())) ||
        (surah.arabicName && surah.arabicName.toLowerCase().includes(debounceQuery.toLowerCase())) ||
        (surah.number && surah.number.toString().includes(debounceQuery))
    );
  }, [itemSurahs, debounceQuery]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <LinearGradient
      colors={isDarkMode ? ['#060B18', '#0C1428', '#080F1E'] as const : ['#EEF2FF', '#F0F4FF', '#E8EFFF'] as const}
      style={styles.mainContainer}
    >
      {/* Glass Search Bar */}
      <View style={{ paddingHorizontal: 4, marginTop: 8, marginBottom: 4 }}>
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 10,
            overflow: 'hidden',
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.88)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          }}
        >
          <FontAwesome6 name="magnifying-glass" size={15} color={isDarkMode ? 'rgba(255,255,255,0.40)' : theme.colors.text.muted} />
          <TextInput
            placeholder={`Search ${mode === 'surah' ? 'surahs' : 'juz'}...`}
            placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.35)' : theme.colors.text.muted}
            style={{
              flex: 1,
              color: isDarkMode ? 'rgba(255,255,255,0.90)' : theme.colors.text.primary,
              fontFamily: 'Outfit_400Regular',
              fontSize: 15,
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome6 name="circle-xmark" size={16} color={isDarkMode ? 'rgba(255,255,255,0.40)' : theme.colors.text.muted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/bookmarks')} style={{ paddingLeft: 4 }}>
            <FontAwesome6 name="bookmark" size={16} color={theme.colors.accent} solid />
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Premium Segmented Mode Toggle */}
      <View style={{ paddingHorizontal: 4, marginTop: 12, marginBottom: 4 }}>
        <BlurView
          intensity={15}
          tint={isDarkMode ? 'dark' : 'light'}
          style={{
            flexDirection: 'row',
            borderRadius: 14,
            padding: 4,
            overflow: 'hidden',
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {(['surah', 'juz'] as const).map((m) => {
            const isActive = mode === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={{ flex: 1 }}
                activeOpacity={0.7}
              >
                <View style={{
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: isActive ? theme.colors.accent : 'transparent',
                }}>
                  <Text style={{
                    fontFamily: isActive ? 'Outfit_600SemiBold' : 'Outfit_500Medium',
                    fontSize: 14,
                    color: isActive ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.60)' : theme.colors.text.secondary,
                  }}>
                    {m === 'surah' ? 'Surahs' : 'Juz'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>

      {/* Listen-mode hint */}
      {listenMode && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          marginHorizontal: 4, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8,
          borderRadius: 10, backgroundColor: theme.colors.accent + '18',
        }}>
          <FontAwesome6 name="headphones" size={13} color={theme.colors.accent} />
          <Text style={{ color: theme.colors.accent, fontFamily: 'Outfit_500Medium', fontSize: 13 }}>
            Listen mode · tap a surah to play
          </Text>
        </View>
      )}

      {/* Surah List or Juz List */}
      {mode === 'surah' ? (
        <FlashList
          data={filteredSurahs}
          renderItem={({ item, index }) => (
            <SurahItem
              index={index}
              surah={item}
              onPress={(s) => openSurah(s.number)}
              readCount={readAyahsMap[item.number] || 0}
            />
          )}
          keyExtractor={(item) => `surah-${item.number}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlashList
          data={juzMeta}
          renderItem={({ item, index }) => (
            <JuzItem
              number={item.number}
              index={index}
              start={item.start}
              end={item.end}
              readCount={juzProgressMap[item.number]?.read || 0}
              totalAyahs={juzProgressMap[item.number]?.total || calculateTotalAyahs(item)}
              onPress={() => openSurah(item.start.surah)}
            />
          )}
          keyExtractor={(item) => `juz-${item.number}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </LinearGradient>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing.medium,
    },
    listContainer: {
      paddingBottom: theme.spacing.large,
    },
  });

export default Surahs;
