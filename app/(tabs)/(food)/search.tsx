import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Restaurant } from '../../../utils/types';
import useAutoFocus from '../../../hooks/useAutoFocus';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchRestaurants } from '../../../api/firebase';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../../context/ThemeContext';

const SearchPage = () => {
  const { theme } = useTheme()

  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const router = useRouter();
  const inputRef = useAutoFocus();

  const RECENT_SEARCHES_KEY = 'recentSearches';

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }

        const data = await fetchRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error('Failed to load recent searches', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const saveRecentSearches = async (searches: string[]) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save recent searches', error);
    }
  };

  const handleSearch = useCallback(
    (query: string) => {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = restaurants.filter((restaurant) => {
        const name = restaurant.name?.toLowerCase() || '';
        const address = restaurant.address?.toLowerCase() || '';
        const categories = restaurant.categories || [];

        return (
          name.includes(lowerCaseQuery) ||
          address.includes(lowerCaseQuery) ||
          categories.some((cat) => cat?.toLowerCase().includes(lowerCaseQuery))
        );
      });
      setFilteredRestaurants(filtered);
    },
    [restaurants]
  );

  const handleSubmit = async () => {
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      const updatedSearches = [searchQuery, ...recentSearches].slice(0, 3);
      setRecentSearches(updatedSearches);
      await saveRecentSearches(updatedSearches);
    }

    handleSearch(debounceQuery);
  };

  const handleRecentSearchTap = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleRemoveSearch = async (searchToRemove: string) => {
    const updatedSearches = recentSearches.filter((search) => search !== searchToRemove);
    setRecentSearches(updatedSearches);
    await saveRecentSearches(updatedSearches);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TextInput
        ref={inputRef}
        style={[
          styles.searchInput,
          {
            backgroundColor: theme.colors.secondary,
            color: theme.colors.text.primary,
          },
        ]}
        placeholder="Search restaurants or categories..."
        placeholderTextColor={theme.colors.text.muted}
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          handleSearch(text);
        }}
        onSubmitEditing={handleSubmit}
      />

      {recentSearches.length > 0 && (
        <View style={styles.recencyContainer}>
          <Text style={[styles.recencyTitle, { color: theme.colors.text.primary }]}>
            Recent Searches
          </Text>
          {recentSearches.map((recentSearch, index) => (
            <View style={styles.recentSearchItem} key={index}>
              <FontAwesome6
                name="clock"
                color={theme.colors.accent}
                size={16}
                style={styles.iconLeft}
              />

              <TouchableOpacity
                style={styles.searchTextContainer}
                onPress={() => handleRecentSearchTap(recentSearch)}
              >
                <Text style={[styles.recentSearchText, { color: theme.colors.text.primary }]}>
                  {recentSearch}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleRemoveSearch(recentSearch)}>
                <FontAwesome6
                  name="circle-xmark"
                  color={theme.colors.accent}
                  size={16}
                  style={styles.iconLeft}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {recentSearches.length > 0 && filteredRestaurants.length > 0 && (
        <View style={styles.spacer} />
      )}

      <FlashList
        estimatedItemSize={174}
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.restaurantItem,
              {
                borderBottomColor: theme.colors.text.muted,
              },
            ]}
            onPress={() => router.replace(`/${item.id}`)}
          >
            <Text style={[styles.restaurantName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <Text style={[styles.restaurantAddress, { color: theme.colors.text.secondary }]}>
              {item.address}
            </Text>
          </TouchableOpacity>
        )}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, padding: 16 },
  searchInput: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  recencyContainer: { marginBottom: 20 },
  recencyTitle: { fontSize: 16, marginBottom: 8, fontFamily: 'Outfit_600SemiBold' },
  recentSearchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  recentSearchText: { fontSize: 14, flex: 1 },
  iconLeft: { marginRight: 10 },
  spacer: { height: 10 },
  searchTextContainer: { flex: 1 },
  restaurantItem: { paddingVertical: 10, borderBottomWidth: 1 },
  restaurantName: { fontSize: 16, fontFamily: 'Outfit_600SemiBold' },
  restaurantAddress: { fontSize: 14, fontFamily: 'Outfit_400Regular' },
});

export default SearchPage;
