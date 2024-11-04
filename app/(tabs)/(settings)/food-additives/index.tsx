import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { FoodAdditive } from '../../../../utils/types';
import { fetchFoodAdditives } from '../../../../api/firebase';
import { FlashList } from '@shopify/flash-list';
import AsyncStorage from '@react-native-async-storage/async-storage';
const CACHE_KEY = 'foodAdditivesCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // Cache TTL set to 24 hours (in milliseconds)

const FoodAdditivesPage = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [foodAdditives, setFoodAdditives] = useState<FoodAdditive[]>([]);
  const [filteredAdditives, setFilteredAdditives] = useState<FoodAdditive[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

 // Function to fetch food additives with caching
 const fetchFoodAdditivesWithCache = async () => {
    try {
      // Get cached data
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const { timestamp, additives } = parsedData;

        // Check if cache is still valid (within TTL)
        const now = new Date().getTime();
        if (now - timestamp < CACHE_TTL) {
          setFoodAdditives(additives);
          setFilteredAdditives(additives);
          setIsLoading(false);
          return;
        }
      }

      // If no cache or cache expired, fetch from Firestore
      const additives = await fetchFoodAdditives();
      setFoodAdditives(additives);
      setFilteredAdditives(additives);

      // Cache the fetched data with a timestamp
      const cacheData = {
        timestamp: new Date().getTime(),
        additives,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    } catch (error) {
      console.error('Failed to fetch food additives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the food additives when the component mounts with cache logic
    fetchFoodAdditivesWithCache();
  }, []);

  // Filter food additives by search query (either eCode or chemicalName)
  useEffect(() => {
    const filtered = foodAdditives.filter((additive) =>
      additive.chemicalName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAdditives(filtered);
  }, [searchQuery, foodAdditives]);

  const getStatusColor = (status: string) => {
    return status.toLowerCase() === 'ok' ? '#78A678' : '#A83A3A'; // Green for 'Ok', red for others
  };

  const renderFoodAdditive = ({ item }: { item: FoodAdditive }) => (
    <View style={styles.additiveContainer}>
      <Text style={styles.eCode}>{item.eCode}</Text>
      <Text style={styles.chemicalName}>{item.chemicalName}</Text>
      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>Status: {item.status}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchContainer}>
        <FontAwesome6 name="magnifying-glass" size={20} color="#ECDFCC" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by chemical name"
          placeholderTextColor="#ECDFCC"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#314441" />
      ) : filteredAdditives.length > 0 ? (
        <FlashList
          estimatedItemSize={150}
          data={filteredAdditives}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodAdditive}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A504C',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: '#ECDFCC',
  },
  listContainer: {
    flex: 1,
  },
  additiveContainer: {
    backgroundColor: '#3A504C',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eCode: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#A3C0BB',
  },
  chemicalName: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
  },
  status: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#A83A3A', // Red for status (like "Haram")
  },
  description: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
    marginTop: 4,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: '#ECDFCC',
  },
});

export default FoodAdditivesPage;
