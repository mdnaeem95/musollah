import { FlatList, ActivityIndicator, View, TextInput, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { FontAwesome6 } from '@expo/vector-icons';
import SurahItem from '../../../../components/SurahItem';
import { RootState } from '../../../../redux/store/store';
import { Surah } from '../../../../utils/types';
import { ThemeContext } from '../../../../context/ThemeContext';

const Surahs = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { surahs, isLoading } = useSelector((state: RootState) => state.quran);
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  const handleSurahPress = useCallback((surah: Surah) => {
    router.push(`/surahs/${surah.number}`);
  }, [router]);

  const renderSurahItem = useCallback(
    ({ item }: { item: Surah }) => <SurahItem key={item.id} surah={item} onPress={handleSurahPress} />,
    [handleSurahPress]
  );

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
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#4D6561' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#4D6561" />
      
      {/* Header with Search Bar */}
      <View style={styles.headerContainer}>
        {isSearchExpanded && (
          <View style={styles.searchBarContainer}>
            <TextInput
              placeholder="Search Surah"
              placeholderTextColor="#B0B0B0"
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
            color={isDarkMode ? '#ECDFCC' : '#FFFFFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bookmarkIconContainer} onPress={() => router.push('/bookmarks')}>
          <FontAwesome6 
            name="bookmark" 
            size={24} 
            solid 
            color={isDarkMode ? '#ECDFCC' : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </View>

      {/* Surah List or Loading Indicator */}
      {isLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} color="#FFFFFF" size="large" />
      ) : (
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          keyExtractor={(item) => item.number.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#4D6561',
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: '#3A504C',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginRight: 10,
  },
  searchInput: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
  searchIconContainer: {
    padding: 8,
  },
  bookmarkIconContainer: {
    padding: 8,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default Surahs;
