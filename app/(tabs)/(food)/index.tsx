import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store/store';
import { fetchUserLocation } from '../../../redux/slices/userLocationSlice';
import { fetchRestaurants } from '../../../api/firebase';
import { Restaurant } from '../../../utils/types';
import { haversineDistance } from '../../../utils/distance';
import { Region } from '../../../components/musollah/Map';
import { useTheme } from '../../../context/ThemeContext';
import { MotiView } from 'moti';

import SearchBar from '../../../components/food/SearchBar';
import CategoryPill from '../../../components/food/CategoryPill';
import RestaurantCard from '../../../components/food/RestaurantCard';
import RestaurantMap from '../../../components/food/RestaurantMap';

import RestaurantCardSkeleton from '../../../components/food/RestaurantCardSkeleton';
import CategoryPillSkeleton from '../../../components/food/CategoryPillSkeleton';

const RestaurantLocator = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [region, setRegion] = useState<Region | undefined>();
  const [userLocationCoords, setUserLocationCoords] = useState({ latitude: 1.3521, longitude: 103.8198 });
  const [loading, setLoading] = useState(true);

  const { userLocation } = useSelector((state: RootState) => state.location);

  useEffect(() => {
    dispatch(fetchUserLocation());
  }, [dispatch]);

  useEffect(() => {
    if (userLocation) {
      const { latitude, longitude } = userLocation.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      setUserLocationCoords({ latitude, longitude });
    }
  }, [userLocation]);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await fetchRestaurants();
        setRestaurants(data);
        const allCategories = Array.from(new Set(data.flatMap(r => r.categories)));
        setCategories(allCategories);
        setFilteredRestaurants(data);
      } catch (error) {
        console.error('Failed to fetch restaurants', error);
      } finally {
        setLoading(false);
      }
    };
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(r =>
        r.categories.some(cat => selectedCategories.includes(cat))
      );
      setFilteredRestaurants(filtered);
    }
  }, [restaurants, selectedCategories]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.primary }]} contentContainerStyle={{ paddingBottom: 100 }}>

      <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500 }}>
        <SearchBar />
      </MotiView>

      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 500, delay: 100 }}>
        <RestaurantMap region={region} restaurants={loading ? [] : filteredRestaurants} />
      </MotiView>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Categories</Text>
        <FlatList
          data={loading ? Array(5).fill(null) : categories}
          horizontal
          keyExtractor={(item, index) => item || `skeleton-${index}`}
          renderItem={({ item, index }) =>
            loading ? (
              <CategoryPillSkeleton />
            ) : (
              <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 80 }}>
                <CategoryPill
                  label={item}
                  selected={selectedCategories.includes(item)}
                  onPress={() => handleCategorySelect(item)}
                />
              </MotiView>
            )
          }
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Recommended for You</Text>
        <FlatList
          data={loading ? Array(5).fill(null) : filteredRestaurants.slice(0, 5)}
          horizontal
          keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
          renderItem={({ item, index }) =>
            loading || !item ? (
              <RestaurantCardSkeleton />
            ) : (
              <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 100 }}>
                <RestaurantCard
                  restaurant={item}
                  distance={haversineDistance(userLocationCoords, item.coordinates).toFixed(1)}
                />
              </MotiView>
            )
          }
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
  },
});

export default RestaurantLocator;