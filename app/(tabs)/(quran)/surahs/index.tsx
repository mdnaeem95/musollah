import { FlatList, ActivityIndicator, View, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { FontAwesome6 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import SurahItem from '../../../../components/SurahItem';
import { RootState } from '../../../../redux/store/store';
import { Surah } from '../../../../utils/types';
import { ThemeContext } from '../../../../context/ThemeContext';
import { darkTheme, lightTheme } from '../../../../utils/theme';

const Surahs = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { surahs, isLoading } = useSelector((state: RootState) => state.quran);
  const router = useRouter();
  const styles = isDarkMode ? darkTheme : lightTheme;

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
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#1E1E1E' : '#4D6561'} />
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
          <FontAwesome6 name={isSearchExpanded ? 'xmark' : 'magnifying-glass'} size={24} color={isDarkMode ? '#ECDFCC' : '#FFFFFF'} />
        </TouchableOpacity>

        <TouchableOpacity style={{ paddingHorizontal: 10 }} onPress={() => router.push('/bookmarks')}>
          <FontAwesome6 name="bookmark" size={24} solid color={isDarkMode ? '#ECDFCC' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          keyExtractor={(item) => item.number.toString()}
          showsVerticalScrollIndicator={false}
          style={{ paddingHorizontal: 30 }}
        />
      )}
    </SafeAreaView>
  );
};

export default Surahs;
