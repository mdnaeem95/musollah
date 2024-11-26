import { ActivityIndicator, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesome6 } from '@expo/vector-icons';
import DoaItem from '../../../../components/DoaItem';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { Doa } from '../../../../utils/types';
import { ThemeContext } from '../../../../context/ThemeContext';
import { FlashList } from '@shopify/flash-list';
import { fetchDailyDoasData } from '../../../../redux/slices/doasSlice';

const Doas = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { doas, loading } = useSelector((state: RootState) => state.doas);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  const handleDoaPress = useCallback((doa: Doa) => {
    router.push(`/doas/${doa.number}`);
  }, [router]);

  const renderDoaItem = useCallback(
    ({ item }: { item: Doa }) => <DoaItem key={item.number} doa={item} onPress={handleDoaPress} />,
    [handleDoaPress]
  );

  const filteredDoas = useMemo(() => {
    return doas.filter(
      (doa) =>
        doa.title.toLowerCase().includes(debounceQuery.toLowerCase()) || (doa.number && doa.number.toString().includes(debounceQuery))
    );
  }, [doas, debounceQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchDailyDoasData()); // Fetch latest doas
    setRefreshing(false);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#2E3D3A' : '#4D6561' }]}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            {isSearchExpanded && (
              <View style={styles.searchBarContainer}>
                <TextInput
                  placeholder="Search Dua"
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

            <TouchableOpacity style={styles.bookmarkIconContainer} onPress={() => router.push('/bookmarks')}>
              <FontAwesome6 name="bookmark" size={24} solid color={isDarkMode ? '#ECDFCC' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          {/* Duas List */}
          <FlashList
            estimatedItemSize={74}
            data={filteredDoas}
            renderItem={renderDoaItem}
            keyExtractor={(item) => item.number.toString()}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />   
        </>
      )}
      {/* Header with searchbar and bookmark */}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#4D6561',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center'
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
})

export default Doas;
