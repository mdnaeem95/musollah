import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { FoodAdditive } from '../../../../utils/types';
import { fetchFoodAdditives } from '../../../../api/firebase';
import PrayerHeader from '../../../../components/PrayerHeader';
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

  const renderFoodAdditive = ({ item }: { item: FoodAdditive }) => (
    <View style={styles.additiveContainer}>
      <Text style={styles.eCode}>{item.eCode}</Text>
      <Text style={styles.chemicalName}>{item.chemicalName}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <PrayerHeader title="Food Additives" backgroundColor='#4D6561'/>

      <View style={styles.searchContainer}>
        <FontAwesome6 name="magnifying-glass" size={20} color="#314441" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by chemical name"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#314441" />
      ) : filteredAdditives.length > 0 ? (
        <FlatList
          data={filteredAdditives}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodAdditive}
          style={styles.listContainer}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#4D6561',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
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
    color: '#314441',
  },
  listContainer: {
    flex: 1,
  },
  additiveContainer: {
    backgroundColor: '#FFF',
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
    color: '#314441',
  },
  chemicalName: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#314441',
  },
  status: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#A83A3A', // Red for status (like "Haram")
  },
  description: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#314441',
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
    color: '#314441',
  },
});

export default FoodAdditivesPage;
