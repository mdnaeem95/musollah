import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  
  // TanStack Query for surahs
  const { data: surahs = [], isLoading } = useSurahs();
  
  // Zustand for reading progress
  const readAyahs = useQuranStore((state) => state.readAyahs);
  const getReadCountForSurah = useQuranStore((state) => state.getReadCountForSurah);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
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

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

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
    <View style={styles.mainContainer}>
      {/* Mode Toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => setMode('surah')}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 20,
            backgroundColor: mode === 'surah' ? theme.colors.muted : theme.colors.secondary,
            borderRadius: 10,
            marginRight: 8,
          }}
        >
          <Text style={{ color: theme.colors.text.primary, fontFamily: 'Outfit_600SemiBold' }}>
            Surahs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode('juz')}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 20,
            backgroundColor: mode === 'juz' ? theme.colors.muted : theme.colors.secondary,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: theme.colors.text.primary, fontFamily: 'Outfit_600SemiBold' }}>
            Juz
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header with Search Bar */}
      <View style={styles.headerContainer}>
        {isSearchExpanded && (
          <View style={styles.searchBarContainer}>
            <TextInput
              placeholder="Search Surah"
              placeholderTextColor={theme.colors.text.muted}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        <TouchableOpacity onPress={toggleSearch} style={styles.searchIconContainer}>
          <FontAwesome6 
            name={isSearchExpanded ? 'xmark' : 'magnifying-glass'} 
            size={24} 
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bookmarkIconContainer} onPress={() => router.push('/bookmarks')}>
          <FontAwesome6 
            name="bookmark" 
            size={24} 
            solid 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Surah List or Juz List */}
      {mode === 'surah' ? (
        <FlashList
          data={filteredSurahs}
          estimatedItemSize={75}
          renderItem={({ item, index }) => (
            <SurahItem
              index={index}
              surah={item}
              onPress={(s) => router.push(`/surahs/${s.number}`)}
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
          estimatedItemSize={75}
          renderItem={({ item, index }) => (
            <JuzItem
              number={item.number}
              index={index}
              start={item.start}
              end={item.end}
              readCount={juzProgressMap[item.number]?.read || 0}
              totalAyahs={juzProgressMap[item.number]?.total || calculateTotalAyahs(item)}
              onPress={() => console.log('Tapped Juz', item.number)}
            />
          )}          
          keyExtractor={(item) => `juz-${item.number}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.medium,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.small,
    },
    searchBarContainer: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: theme.spacing.small / 2,
      ...theme.shadows.default,
      marginRight: theme.spacing.small,
    },
    searchInput: {
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
    },
    searchIconContainer: {
      padding: theme.spacing.small / 2,
    },
    bookmarkIconContainer: {
      padding: theme.spacing.small / 2,
    },
    listContainer: {
      paddingBottom: theme.spacing.large,
    },
  });

export default Surahs;