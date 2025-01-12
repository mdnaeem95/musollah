import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Restaurant } from '../../../utils/types';
import { fetchRestaurants } from '../../../api/firebase';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store/store';
import { fetchUserLocation } from '../../../redux/slices/userLocationSlice';
import { Region } from '../../../components/musollah/Map';
import { haversineDistance } from '../../../utils/distance';
import { AirbnbRating } from 'react-native-ratings';
import { useTheme } from '../../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const RestaurantLocator = () => {
  const { theme } = useTheme()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [userLocationCoords, setUserLocationCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 1.3521,
    longitude: 103.8198,
  });
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { userLocation } = useSelector((state: RootState) => state.location);

  useEffect(() => {
    dispatch(fetchUserLocation());
    setUserLocationCoords({
      latitude: userLocation?.coords.latitude || 1.3521,
      longitude: userLocation?.coords.longitude || 103.8198,
    });
  }, [dispatch]);

  useEffect(() => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, [userLocation]);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await fetchRestaurants();
        setRestaurants(data);

        const allCategories = new Set<string>();
        data.forEach((restaurant) => {
          restaurant.categories.forEach((category) => allCategories.add(category));
        });
        setCategories(Array.from(allCategories));

        setFilteredRestaurants(data); // Default to all restaurants
      } catch (error) {
        console.error('Error loading restaurants:', error);
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
      const filtered = restaurants.filter((restaurant) =>
        restaurant.categories.some((cat) => selectedCategories.includes(cat))
      );
      setFilteredRestaurants(filtered);
    }
  }, [selectedCategories, restaurants]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategories((prevCategories) =>
      prevCategories.includes(category)
        ? prevCategories.filter((cat) => cat !== category)
        : [...prevCategories, category]
    );
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        { backgroundColor: theme.colors.secondary },
        selectedCategories.includes(item) && { backgroundColor: theme.colors.accent },
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <Text
        style={[
          styles.categoryText,
          { color: theme.colors.text.primary },
          selectedCategories.includes(item) && { color: theme.colors.primary },
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderRecommendation = ({ item }: { item: Restaurant }) => {
    const distance = haversineDistance(userLocationCoords, item.coordinates).toFixed(1);
    const hasReviews = item.averageRating !== 0 && item.totalReviews !== 0;

    return (
      <TouchableOpacity
        style={[styles.recommendationCard, { backgroundColor: theme.colors.secondary }]}
        onPress={() => router.push(`${item.id}`)}
      >
        <Image source={{ uri: item.image }} style={styles.recommendationImage} />
        <View style={styles.recommendationDetails}>
          <Text style={[styles.recommendationTitle, { color: theme.colors.text.primary }]}>
            {item.name}
          </Text>
          {hasReviews ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <AirbnbRating
                  isDisabled
                  showRating={false}
                  defaultRating={item.averageRating}
                  size={14}
                />
                <Text style={[styles.recommendationSubtitle, { color: theme.colors.text.secondary }]}>
                  {`${item.averageRating} (${item.totalReviews})`}
                </Text>
              </View>
              <Text style={[styles.recommendationSubtitle, { color: theme.colors.text.secondary }]}>
                {distance} km
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.recommendationSubtitle, { color: theme.colors.text.muted }]}>
                No reviews yet.
              </Text>
              <Text style={[styles.recommendationSubtitle, { color: theme.colors.text.secondary }]}>
                {distance} km
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: theme.colors.secondary }]}
        onPress={() => router.push('/search')}
      >
        <Text style={[styles.searchPlaceholder, { color: theme.colors.text.muted }]}>
          Find Halal food near you...
        </Text>
      </TouchableOpacity>

      <View style={[styles.mapContainer, { backgroundColor: theme.colors.secondary }]}>
        <MapView
          style={styles.map}
          region={region}
          initialRegion={{
            latitude: 1.3521,
            longitude: 103.8198,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          zoomEnabled
          showsUserLocation
        >
          {!loading &&
            filteredRestaurants.map((restaurant) => (
              <Marker
                key={restaurant.id}
                coordinate={{
                  latitude: restaurant.coordinates.latitude,
                  longitude: restaurant.coordinates.longitude,
                }}
                title={restaurant.name}
                description={restaurant.address}
                onCalloutPress={() => router.push(`${restaurant.id}`)}
              />
            ))}
        </MapView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          horizontal
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Recommended for You
        </Text>
        <FlatList
          data={filteredRestaurants.slice(0, 5)}
          renderItem={renderRecommendation}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, padding: 16 },
  searchBar: { height: 50, borderRadius: 25, paddingHorizontal: 16, justifyContent: 'center', marginBottom: 16 },
  searchPlaceholder: { fontSize: 16 },
  mapContainer: { width: width - 32, height: height * 0.3, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', marginBottom: 10 },
  categoryPill: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, marginRight: 10 },
  categoryText: { fontFamily: 'Outfit_400Regular', fontSize: 14 },
  recommendationCard: { width: 150, borderRadius: 12, marginRight: 16 },
  recommendationImage: { width: '100%', height: 100, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  recommendationDetails: { padding: 10, gap: 6 },
  recommendationTitle: { fontSize: 14, fontFamily: 'Outfit_500Medium' },
  recommendationSubtitle: { fontSize: 12, fontFamily: 'Outfit_400Regular' },
});

export default RestaurantLocator;
