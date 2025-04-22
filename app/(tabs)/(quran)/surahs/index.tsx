import { FlatList, ActivityIndicator, View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { FontAwesome6 } from '@expo/vector-icons';
import SurahItem from '../../../../components/quran/SurahItem';
import { RootState } from '../../../../redux/store/store';
import { Surah } from '../../../../utils/types';
import { useTheme } from '../../../../context/ThemeContext';
import { FlashList } from '@shopify/flash-list';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JuzItem from '../../../../components/quran/JuzItem';
import { JuzMeta, juzMeta } from '../../../../data/juzMeta';
import { calculateTotalAyahs, countReadAyahsInJuz } from '../../../../utils/quran';

const Surahs = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const { surahs, isLoading } = useSelector((state: RootState) => state.quran);
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [readAyahsMap, setReadAyahsMap] = useState<Record<number, number>>({});
  const [juzProgressMap, setJuzProgressMap] = useState<Record<number, { read: number; total: number }>>({});
  const [mode, setMode] = useState<'surah' | 'juz'>('surah');
  const [renderMode, setRenderMode] = useState<'surah' | 'juz'>('surah');

  useEffect(() => {
    const timeout = setTimeout(() => setRenderMode(mode), 100); // 100–200ms works well
    return () => clearTimeout(timeout);
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        const data = await AsyncStorage.getItem('readAyahsOverall');
        if (!data) return;
  
        const readKeys: string[] = JSON.parse(data);
        const countMap: Record<number, number> = {};
        const juzMap: Record<number, { read: number; total: number }> = {};
  
        for (const key of readKeys) {
          const [s] = key.split(':');
          const surahNum = parseInt(s, 10);
          countMap[surahNum] = (countMap[surahNum] || 0) + 1;
        }
  
        for (const juz of juzMeta) {
          const total = calculateTotalAyahs(juz);
          const read = countReadAyahsInJuz(juz, readKeys);
          juzMap[juz.number] = { total, read };
        }
  
        setReadAyahsMap(countMap);
        setJuzProgressMap(juzMap);
      };
  
      loadProgress();
    }, [])
  );  

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  const filteredSurahs = useMemo(() => {
    return surahs.filter(
      (surah: Surah) =>
        (surah.arabicName && surah.arabicName.toLowerCase().includes(debounceQuery.toLowerCase())) ||
        (surah.englishName && surah.englishName.toLowerCase().includes(debounceQuery.toLowerCase())) ||
        (surah.number && surah.number.toString().includes(debounceQuery))
    );
  }, [surahs, debounceQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <View style={styles.mainContainer}>
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
          <Text style={{ color: theme.colors.text.primary, fontFamily: 'Outfit_600SemiBold' }}>Surahs</Text>
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
          <Text style={{ color: theme.colors.text.primary, fontFamily: 'Outfit_600SemiBold' }}>Juz</Text>
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

      {/* Surah List or Loading Indicator */}
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
    loadingIndicator: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      paddingBottom: theme.spacing.large,
    },
  });

export default Surahs;
