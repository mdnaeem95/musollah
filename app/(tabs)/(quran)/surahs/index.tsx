import { FlatList, ActivityIndicator, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { FontAwesome6 } from '@expo/vector-icons';
import SurahItem from '../../../../components/SurahItem';
import { RootState } from '../../../../redux/store/store';
import { Surah } from '../../../../utils/types';
import { ThemeContext } from '../../../../context/ThemeContext';
import { FlashList } from '@shopify/flash-list';

const Surahs = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

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

  const styles = createStyles(activeTheme);

  return (
    <View style={styles.mainContainer}>
      {/* Header with Search Bar */}
      <View style={styles.headerContainer}>
        {isSearchExpanded && (
          <View style={styles.searchBarContainer}>
            <TextInput
              placeholder="Search Surah"
              placeholderTextColor={activeTheme.colors.text.muted}
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
            color={activeTheme.colors.text.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bookmarkIconContainer} onPress={() => router.push('/bookmarks')}>
          <FontAwesome6 
            name="bookmark" 
            size={24} 
            solid 
            color={activeTheme.colors.text.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Surah List or Loading Indicator */}
      {isLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} color={activeTheme.colors.text.primary} size="large" />
      ) : (
        <FlashList
          estimatedItemSize={75}
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={(item) => item.number.toString()}
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
