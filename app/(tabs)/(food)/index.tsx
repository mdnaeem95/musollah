// RestaurantLocator.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { fetchRestaurants } from '../../../api/firebase';
import { Restaurant } from '../../../utils/types';
import { FlashList } from '@shopify/flash-list';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../redux/store/store';
import * as Location from 'expo-location';
import { Region } from '../../../components/Map';

const { width, height } = Dimensions.get('window');

const RestaurantLocator = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const loadRestaurants = async () => {
      const data = await fetchRestaurants();
      setRestaurants(data);
      setLoading(false);
    };
    loadRestaurants();

    // Fetch user location and update map region
    const loadUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              const errorMsg = 'Permission to access location was denied';
              console.warn(errorMsg);
              return;
            }
      
            const userLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
      
            if (!userLocation) {
              const errorMsg = 'Failed to get user location';
              console.error(errorMsg);
              return;
            }
            
            if (userLocation) {
                setUserLocation({
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                })
            }
          } catch (error) {
            const errorMsg = 'Failed to fetch user location';
            console.error(errorMsg, error);
          } 
    };
    loadUserLocation();
  }, []);

  const renderCategorySection = () => (
    <View style={styles.categorySection}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.categoryContainer}>
        <Text style={styles.category}>Cafe</Text>
        <Text style={styles.category}>Halal</Text>
        <Text style={styles.category}>Family-friendly</Text>
      </View>
    </View>
  );

  const renderNewSection = () => (
    <View style={styles.newSection}>
      <Text style={styles.sectionTitle}>New Restaurants</Text>
      <FlashList
        estimatedItemSize={74}
        data={restaurants.slice(0, 5)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.restaurantItem}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.restaurantAddress}>{item.address}</Text>
          </View>
        )}
      />
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <MapView
        style={styles.map}
        region={userLocation || undefined} // Center the map on the user's location
        scrollEnabled={false} // Disable scrolling
        showsUserLocation={true} // Show user's location on the map
        initialRegion={{
          latitude: userLocation ? userLocation.latitude : 1.3521, // Default location
          longitude: userLocation ? userLocation.longitude : 103.8198,
          latitudeDelta: 0.01, // Closer zoom
          longitudeDelta: 0.01,
        }}
      >
        {!loading &&
          restaurants.map((restaurant) => (
            <Marker
              key={restaurant.id}
              coordinate={{
                latitude: restaurant.coordinates.latitude,
                longitude: restaurant.coordinates.longitude,
              }}
              title={restaurant.name}
              description={restaurant.address}
              image={require('../../../assets/restaurant.png')}
            />
          ))}
      </MapView>

      {renderCategorySection()}
      {renderNewSection()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A', // Main background color
  },
  map: {
    width: width - 32,
    height: height * 0.3, // Map takes half of the screen height
  },
  categorySection: {
    padding: 16,
    backgroundColor: '#3D4F4C', // Slightly darker shade for section background
    borderRadius: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  category: {
    backgroundColor: '#2E3D3A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
    borderRadius: 10,
    color: '#F4E2C1',
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  newSection: {
    flex: 1,
    padding: 16,
    backgroundColor: '#3D4F4C',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  restaurantItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4E2C1',
  },
  restaurantName: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#F4E2C1',
  },
  restaurantAddress: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#FFFFFF',
  },
});

export default RestaurantLocator;
