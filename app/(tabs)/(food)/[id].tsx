import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchRestaurantById } from '../../../api/firebase'; // Function to fetch restaurant details by ID
import { Restaurant } from '../../../utils/types';
import OperatingHours from '../../../components/OperatingHours';

const RestaurantDetails = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useLocalSearchParams(); // Get the restaurant ID from the URL
  const router = useRouter();

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const data = await fetchRestaurantById(id as string); // Fetch data using ID
        setRestaurant(data);
      } catch (error) {
        console.error('Failed to load restaurant details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4E2C1" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load restaurant details.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.coordinates.latitude},${restaurant.coordinates.longitude}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Restaurant Image */}
      {restaurant.image && (
        <Image source={{ uri: restaurant.image }} style={styles.image} />
      )}

      {/* Restaurant Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{restaurant.name}</Text>
        <Text style={styles.subtitle}>{restaurant.address}</Text>

        {/* Google Maps Button */}
        <TouchableOpacity style={styles.button} onPress={openGoogleMaps}>
          <Text style={styles.buttonText}>Get Directions</Text>
        </TouchableOpacity>

        {/* Operating Hours */}
        <View style={styles.section}>
            <OperatingHours hoursString={restaurant.hours} />
        </View>

        {/* Contact Details */}
        {restaurant.website && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.sectionText}>{restaurant.website}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3D3A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2B343A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2B343A',
  },
  errorText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: '#F4E2C1',
    marginBottom: 10,
  },
  goBackText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    color: '#F4E2C1',
  },
  image: {
    width: '100%',
    height: 240,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    objectFit: "contain"
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#3D4F4C',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#F4E2C1',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#F4E2C1',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3
  },
  buttonText: {
    color: '#2E3D3A',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16
  },
  section: {
    padding: 12,
    marginBottom: 24,
    backgroundColor: '#3D4F4C',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#F4E2C1',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#F4E2C1',
    fontFamily: "Outfit_400Regular",
    lineHeight: 20
  },
});

export default RestaurantDetails;
