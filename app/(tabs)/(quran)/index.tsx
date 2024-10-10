import { FlatList, ActivityIndicator, View, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import SurahItem from '../../../components/SurahItem';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store/store';
import { Surah, Doa } from '../../../utils/types';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';
import { darkTheme, lightTheme } from '../../../utils/theme';
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import DoaItem from '../../../components/DoaItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import DailyAyah from '../../../components/DailyAyah';

const contentTypes = ['Surahs', 'Doas']

const QuranTab = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { surahs, isLoading } = useSelector((state: RootState) => state.quran);
  const { doas } = useSelector((state: RootState) => state.doas)
  const router = useRouter();
  const styles = isDarkMode ? darkTheme: lightTheme;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery)
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  }

  const handleSurahPress = useCallback((surah: Surah) => {
    router.push(`/surahs/${surah.number}`)
  }, [router]);

  const handleDoaPress = useCallback((doa: Doa) => {
    router.push(`/doas/${doa.number}`)
  }, [router])

  const renderSurahItem = useCallback(({ item }: { item: Surah }) => (
    <SurahItem key={item.id} surah={item} onPress={handleSurahPress} />
  ), [handleSurahPress]);

  const renderDoaItem = useCallback(({ item }: { item: Doa }) => (
    <DoaItem key={item.number} doa={item} onPress={handleDoaPress} />
  ), [])

  const filteredSurahs = useMemo(() => {
    return surahs.filter(surah => 
      (surah.arabicName && surah.arabicName.toLowerCase().includes(debounceQuery.toLowerCase())) ||
      (surah.englishName && surah.englishName.toLowerCase().includes(debounceQuery.toLowerCase())) ||
      (surah.number && surah.number.toString().includes(debounceQuery))
    );
  }, [surahs, debounceQuery]);

  const filteredDoas = useMemo(() => {
    return doas.filter(
      (doa) =>
        doa.title.toLowerCase().includes(debounceQuery.toLowerCase()) ||
        (doa.number && doa.number.toString().includes(debounceQuery))
    );
  }, [doas, debounceQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery)
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery])

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Set the status bar style dynamically */}
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#1E1E1E" : "#4D6561"}
      />
      <View style={styles.headerContainer}>
        {isSearchExpanded && (
          <View style={styles.searchBarContainer}>
            <TextInput 
              placeholder='Search Surah'
              placeholderTextColor="#B0B0B0"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery} 
            />
          </View>
        )}
        <TouchableOpacity onPress={toggleSearch} style={styles.searchIconContainer} >
          <FontAwesome6 
            name={isSearchExpanded ? 'xmark' : 'magnifying-glass'} 
            size={24} 
            color={ isDarkMode ? '#ECDFCC' : '#FFFFFF' } 
          />
        </TouchableOpacity>

        <TouchableOpacity style={{ paddingHorizontal: 10 }} onPress={() => router.push('/bookmarks')}>
          <FontAwesome6
            name="bookmark"
            size={24}
            solid
            color={ isDarkMode ? '#ECDFCC' : '#FFFFFF' }
          />
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 10, paddingHorizontal: 20 }}>
        <DailyAyah />
      </View>

      <View style={{ marginVertical: 10, paddingHorizontal: 20 }}>
        <SegmentedControl 
          values={contentTypes}
          selectedIndex={activeTabIndex}
          onChange={(event) => setActiveTabIndex(event.nativeEvent.selectedSegmentIndex)}
          tintColor={isDarkMode ? '#ECDFCC' : '#405754'}
          backgroundColor={isDarkMode ? '#1E1E1E' : '#4D6561'}
          fontStyle={{ color: isDarkMode ? '#FFFFFF' : '#ECDFCC' }}
          activeFontStyle={{ fontWeight: 'bold', color: isDarkMode ? '#1E1E1E' : '#FFFFFF' }}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList 
          data={activeTabIndex === 0 ? filteredSurahs : filteredDoas}
          // @ts-ignore 
          renderItem={activeTabIndex === 0 ? renderSurahItem : renderDoaItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10} 
          keyExtractor={(item) => (item.number.toString())}
          showsVerticalScrollIndicator={false}
          style={{ paddingHorizontal: 30 }} 
        />
      )}
    </SafeAreaView>
  )
}

export default QuranTab