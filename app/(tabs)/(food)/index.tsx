import React, { useState, useEffect } from 'react';
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
import { Region } from '../../../components/Map';
import { haversineDistance } from '../../../utils/distance';
import { AirbnbRating } from 'react-native-ratings';

const { width, height } = Dimensions.get('window');

const categories = ['Halal Certified', 'Cafe', 'Family-Friendly', 'New', 'Buffet'];

const RestaurantLocator = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [userLocationCoords, setUserLocationCoords] = useState<{ latitude: number, longitude: number }>({
    latitude: 1.3521,
    longitude: 103.8198
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { userLocation } = useSelector((state: RootState) => state.location)

  useEffect(() => {
    dispatch(fetchUserLocation());
    setUserLocationCoords({
      latitude: userLocation?.coords.latitude || 1.3521,
      longitude: userLocation?.coords.longitude || 103.8198
    })
    console.log('UserLocation coords:', userLocation?.coords)
  }, [dispatch])

  useEffect(() => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      })
    }
  }, [userLocation])

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await fetchRestaurants();
        setRestaurants(data);
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
      // If no categories are selected, show all restaurants
      setFilteredRestaurants(restaurants);
    } else {
      // Filter restaurants matching any of the selected categories
      const filtered = restaurants.filter((restaurant) =>
        restaurant.categories.some((cat) => selectedCategories.includes(cat))
      );
      setFilteredRestaurants(filtered);
    }
  }, [selectedCategories, restaurants]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategories((prevCategories) => {
      if (prevCategories.includes(category)) {
        // If already selected, remove it
        return prevCategories.filter((cat) => cat !== category);
      } else {
        // Otherwise, add it to the selection
        return [...prevCategories, category];
      }
    });
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        selectedCategories.includes(item) && styles.categoryPillActive,
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategories.includes(item) && styles.categoryTextActive,
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
      style={styles.recommendationCard}
      onPress={() => router.push(`${item.id}`)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.recommendationImage}
      />
      <View style={styles.recommendationDetails}>
        <Text style={styles.recommendationTitle}>{item.name}</Text>
          {hasReviews ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'center' }}>
                <AirbnbRating 
                  isDisabled
                  showRating={false}
                  defaultRating={item.averageRating}
                  size={14}
                  />
                <Text style={styles.recommendationSubtitle}>
                  {item.averageRating ? `${item.averageRating}` : "No ratings"} {item.totalReviews ? `(${item.totalReviews})` : "0"}
                </Text>
              </View>
              <Text style={styles.recommendationSubtitle}>
              {distance} km
              </Text>
            </>
          ) : (
            <>
              <View>
                <Text style={[styles.recommendationSubtitle]}>No reviews yet.</Text>
              </View>
              <Text style={styles.recommendationSubtitle}>
              {distance} km
              </Text>
            </>
          )}
      </View>
    </TouchableOpacity>
  )};

  return (
    <ScrollView style={styles.mainContainer}>
      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push('/search')}
      >
        <Text style={styles.searchPlaceholder}>Find Halal food near you...</Text>
      </TouchableOpacity>

      {/* Map Section */}
      <View style={styles.mapContainer}>
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
                onPress={() => router.push(`${restaurant.id}`)}
              />
            ))}
        </MapView>
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          horizontal
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Recommendations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
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
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A',
  },
  searchBar: {
    height: 50,
    backgroundColor: '#3D4F4C',
    borderRadius: 25,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 16,
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  mapContainer: {
    width: width - 32,
    height: height * 0.3,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#F4E2C1',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
  },
  categoryPill: {
    backgroundColor: '#3D4F4C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: '#F4E2C1',
  },
  categoryText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#ECDFCC',
  },
  categoryTextActive: {
    color: '#2E3D3A',
  },
  recommendationCard: {
    width: 150,
    backgroundColor: '#3D4F4C',
    borderRadius: 12,
    marginRight: 16,
  },
  recommendationImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    objectFit: "cover"
  },
  recommendationDetails: {
    padding: 10,
    gap: 6
  },
  recommendationTitle: {
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
    color: '#ECDFCC',
  },
  recommendationSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#ECDFCC',
  },
});

export default RestaurantLocator;
