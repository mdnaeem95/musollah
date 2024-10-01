import { SafeAreaView, FlatList, ActivityIndicator, View, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import SurahItem from '../../../components/SurahItem';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store/store';
import { Surah } from '../../../utils/types';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';
import { darkTheme, lightTheme } from '../../../utils/theme';

const QuranTab = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkTheme: lightTheme;
  const { surahs, isLoading } = useSelector((state: RootState) => state.quran);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  }

  const handleSurahPress = useCallback((surah: Surah) => {
    router.push(`/surahs/${surah.number}`)
  }, [router]);

  const renderSurahItem = useCallback(({ item }: { item: Surah }) => (
    <SurahItem key={item.id} surah={item} onPress={handleSurahPress} />
  ), [handleSurahPress]);

  const filteredSurahs = useMemo(() => {
    return surahs.filter(surah => 
      (surah.arabicName && surah.arabicName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (surah.englishName && surah.englishName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (surah.number && surah.number.toString().includes(searchQuery))
    );
  }, [surahs, searchQuery]);

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
            color={ isDarkMode ? '#ECDFCC' : '#FFFFFF' } />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList 
          data={filteredSurahs} 
          renderItem={renderSurahItem} 
          keyExtractor={(item) => item.number.toString()} 
          showsVerticalScrollIndicator={false}
          style={{ padding: 30 }} 
        />
      )}
    </SafeAreaView>
  )
}

export default QuranTab