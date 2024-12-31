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
import useAutoFocus from '../../../hooks/useAutoFocus'
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchRestaurants } from '../../../api/firebase';
import { FlashList } from '@shopify/flash-list';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]); 
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const router = useRouter();
  const inputRef = useAutoFocus();

  const RECENT_SEARCHES_KEY = 'recentSearches';

  useEffect(() => {
    // Load recent searches from AsyncStorage on component mount
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
        const name = restaurant.name?.toLowerCase() || ''; // Safely handle undefined
        const address = restaurant.address?.toLowerCase() || ''; // Safely handle undefined
        const categories = restaurant.categories || []; // Ensure categories is an array
  
        return (
          name.includes(lowerCaseQuery) ||
          address.includes(lowerCaseQuery) ||
          categories.some((cat) => cat?.toLowerCase().includes(lowerCaseQuery)) // Safely handle category case
        );
      });
      setFilteredRestaurants(filtered);
    },
    [restaurants]
  );  

  const handleSubmit = async () => {
    // Save the search query to recent searches only if it's non-empty and unique
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      const updatedSearches = [searchQuery, ...recentSearches].slice(0, 3); // Keep only the last 5 searches
      setRecentSearches(updatedSearches);
      await saveRecentSearches(updatedSearches); // Save updated list to AsyncStorage
    }

    // Trigger the search logic
    handleSearch(debounceQuery);
  };

  const handleRecentSearchTap = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleRemoveSearch = async (searchToRemove: string) => {
    const updatedSearches = recentSearches.filter((search) => search !== searchToRemove);
    setRecentSearches(updatedSearches);
    await saveRecentSearches(updatedSearches); // Save updated list to AsyncStorage
  };

  return (
    <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TextInput
        ref={inputRef}
        style={styles.searchInput}
        placeholder="Search restaurants or categories..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          handleSearch(text);
        }}
        onSubmitEditing={handleSubmit}
      />

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <View style={styles.recencyContainer}>
          <Text style={styles.recencyTitle}>Recent Searches</Text>
          {recentSearches.map((recentSearch, index) => (
            <View 
                style={styles.recentSearchItem}
                key={index}
            >
                <FontAwesome6 name="clock" color="#F4E2C1" size={16} style={styles.iconLeft} />

                <TouchableOpacity
                    style={styles.searchTextContainer}
                    onPress={() => handleRecentSearchTap(recentSearch)}
                >
                    <Text style={styles.recentSearchText}>{recentSearch}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleRemoveSearch(recentSearch)}>
                    <FontAwesome6 name="circle-xmark" color="#F4E2C1" size={16} style={styles.iconLeft} />
                </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Spacer */}
      {recentSearches.length > 0 && filteredRestaurants.length > 0 &&(
        <View style={styles.spacer} />
      )}

      <FlashList
        estimatedItemSize={174}
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.restaurantItem}
            onPress={() => router.replace(`/${item.id}`)}
          >
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.restaurantAddress}>{item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A',
  },
  searchInput: {
    height: 50,
    backgroundColor: '#3D4F4C',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    color: '#F4E2C1',
    fontSize: 16,
  },
  recencyContainer: {
    marginBottom: 20,
  },
  recencyTitle: {
    fontSize: 16,
    color: '#F4E2C1',
    marginBottom: 8,
    fontFamily: 'Outfit_600SemiBold',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  recentSearchText: {
    fontSize: 14,
    color: '#F4E2C1',
  },
  iconLeft: {
    marginRight: 10, // Space between the icon and the text
  },
  spacer: {
    height: 10,
  },
  searchTextContainer: {
    flex: 1, // Ensures the text takes up available space
  },
  restaurantItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4E2C1',
  },
  restaurantName: {
    fontSize: 16,
    color: '#F4E2C1',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default SearchPage;
