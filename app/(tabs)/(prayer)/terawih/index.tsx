import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { getFirestore, collection, getDocs } from '@react-native-firebase/firestore';
import { useTheme } from '../../../../context/ThemeContext';
import { scaleSize } from '../../../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'terawihCache';
const CACHE_TTL = 12 * 60 * 60 * 1000; // Cache TTL set to 12 hours

const TerawihLocationsPage = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const firestore = getFirestore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [terawihLocations, setTerawihLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    fetchTerawihLocationsWithCache();
  }, []);

  useEffect(() => {
    const filtered = terawihLocations.filter((location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLocations(filtered);
  }, [searchQuery, terawihLocations]);

  const fetchTerawihLocationsWithCache = async () => {
    try {
      // Get cached data
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const { timestamp, locations } = parsedData;
        const now = new Date().getTime();
        if (now - timestamp < CACHE_TTL) {
          setTerawihLocations(locations);
          setFilteredLocations(locations);
          setIsLoading(false);
          return;
        }
      }

      // Get real-time location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      // Fetch data from Firestore
      const terawihSpacesRef = collection(firestore, 'terawihSpaces');
      const querySnapshot = await getDocs(terawihSpacesRef);

      const locations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().building,
        address: doc.data().address,
        location: {
          latitude: doc.data().location?._latitude || 0,
          longitude: doc.data().location?._longitude || 0,
        },
        rakaat: doc.data().rakaat || 20,
        remarks: doc.data().remarks || '',
        url: `https://www.google.com/maps/search/?api=1&query=${doc.data().location?._latitude},${doc.data().location?._longitude}`,
      }));

      // Sort by nearest location
      if (userLocation) {
        locations.sort((a, b) => {
          const distA = getDistance(userLocation.latitude, userLocation.longitude, a.location.latitude, a.location.longitude);
          const distB = getDistance(userLocation.latitude, userLocation.longitude, b.location.latitude, b.location.longitude);
          return distA - distB;
        });
      }

      setTerawihLocations(locations);
      setFilteredLocations(locations);

      // Cache data
      const cacheData = { timestamp: new Date().getTime(), locations };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to fetch Terawih locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const renderLocation = ({ item }: { item: any }) => (
    <View style={[styles.locationContainer, { backgroundColor: theme.colors.secondary }]}>
      <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>{item.name}</Text>
      <Text style={[styles.locationAddress, { color: theme.colors.text.secondary }]}>{item.address}</Text>
      <Text style={[styles.locationDetails, { color: theme.colors.text.secondary }]}>
        {userLocation ? `${getDistance(userLocation.latitude, userLocation.longitude, item.location.latitude, item.location.longitude)} km away` : ''}
        • {item.rakaat} rakaat
      </Text>
      {item.remarks ? <Text style={[styles.remarks, { color: theme.colors.text.muted }]}>{item.remarks}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(item.url)}>
        <FontAwesome6 name="location-dot" size={16} color={theme.colors.accent} />
        <Text style={styles.buttonText}>Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchContainer}>
        <FontAwesome6 name="magnifying-glass" size={18} color={theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or address"
          placeholderTextColor={theme.colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
      ) : (
        <FlashList
          estimatedItemSize={120}
          data={filteredLocations}
          keyExtractor={(item) => item.id}
          renderItem={renderLocation}
        />
      )}

      {/* Credit Section */}
      <View style={styles.creditContainer}>
        <Text style={styles.creditText}>Data provided by SalamSG TV</Text>
        <View style={styles.socialsContainer}>
          <TouchableOpacity onPress={() => Linking.openURL('https://salamsg.assyafaah.sg')}>
            <FontAwesome6 name="globe" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/salamsg_tv')}>
            <FontAwesome6 name="instagram" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://youtube.com/salamsgtv')}>
            <FontAwesome6 name="youtube" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.primary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.small,
      marginBottom: theme.spacing.medium,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.fontSizes.medium,
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.small,
      color: theme.colors.text.primary,
    },
    locationContainer: {
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.medium,
      gap: theme.spacing.small,
      ...theme.shadows.defaulr
    },
    locationName: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
    },
    locationAddress: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
    },
    locationDetails: {
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_400Regular',
    },
    remarks: {
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_400Regular',
      fontStyle: 'italic',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: theme.borderRadius.small,
      marginTop: 5,
    },
    buttonText: {
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.accent,
      marginLeft: 5,
    },
    creditContainer: {
      marginTop: theme.spacing.large,
      alignItems: 'center',
    },
    creditText: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    socialsContainer: {
      flexDirection: 'row',
      marginTop: theme.spacing.small,
      gap: theme.spacing.medium,
    },
  });

export default TerawihLocationsPage;
