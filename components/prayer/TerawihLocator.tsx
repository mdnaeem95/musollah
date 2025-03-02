import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import * as Location from 'expo-location';
import { getFirestore, collection, getDocs } from '@react-native-firebase/firestore';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { scaleSize } from '../../utils';
import { useRouter } from 'expo-router';

const TerawihLocator = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const firestore = getFirestore();
  const router = useRouter();
  
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearestMosque, setNearestMosque] = useState<{
    name: string;
    address: string;
    distance: number;
    rakaat: number;
    remarks: string;
    url: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNearestMosque = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }

        // Get user location
        const userLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = userLocation.coords;
        setLocation({ latitude, longitude });

        // Fetch terawih locations from Firestore
        const terawihSpacesRef = collection(firestore, 'terawihSpaces');
        const querySnapshot = await getDocs(terawihSpacesRef);

        const mosques = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                name: data.building,
                address: data.address,
                location: {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                },
                rakaat: data.rakaat,
                remarks: data.remarks || '',
            }
        });

        // Find the closest mosque
        let closest = mosques.reduce((prev, curr) => {
          const prevDist = getDistance(latitude, longitude, prev.location.latitude, prev.location.longitude);
          const currDist = getDistance(latitude, longitude, curr.location.latitude, curr.location.longitude);
          return currDist < prevDist ? curr : prev;
        });

        setNearestMosque({
          name: closest.name,
          address: closest.address,
          distance: getDistance(latitude, longitude, closest.location.latitude, closest.location.longitude),
          rakaat: closest.rakaat,
          remarks: closest.remarks,
          url: `https://www.google.com/maps/search/?api=1&query=${closest.location.latitude},${closest.location.longitude}`,
        });
      } catch (error) {
        console.error('Error fetching terawih locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNearestMosque();
  }, []);

  // Function to calculate distance between two coordinates
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Nearest Terawih Location</Text>
        <TouchableOpacity onPress={() => router.push('/terawih')}>
          <Text style={styles.seeAllText}>See All Locations</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
      ) : nearestMosque ? (
        <View style={styles.card}>
          <Text style={styles.mosqueName}>{nearestMosque.name}</Text>
          <Text style={styles.mosqueAddress}>{nearestMosque.address}</Text>
          <Text style={styles.mosqueDetails}>{nearestMosque.distance} km away</Text>
          <Text style={styles.mosqueDetails}>{nearestMosque.rakaat} rakaat</Text>
          {nearestMosque.remarks ? <Text style={styles.mosqueRemarks}>{nearestMosque.remarks}</Text> : null}

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => Linking.openURL(nearestMosque.url)}
          >
            <FontAwesome6 name="location-dot" size={20} color={theme.colors.accent} />
            <Text style={styles.buttonText}>View on Maps</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noLocationText}>Unable to find location.</Text>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginTop: theme.spacing.medium,
      marginBottom: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.medium,
    },
    seeAllText: {
        fontSize: scaleSize(12),
        fontFamily: 'Outfit_400Regular',
        color: theme.colors.accent,
    },
    header: {
        fontSize: scaleSize(18),
        fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
    },
    card: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.medium,
      alignItems: 'center',
      ...theme.shadows.default,
      gap: 10
    },
    mosqueName: {
      fontSize: scaleSize(14),
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    mosqueAddress: {
      fontSize: scaleSize(12),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: 5,
    },
    mosqueDetails: {
      fontSize: scaleSize(12),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    mosqueRemarks: {
      fontSize: scaleSize(10),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
      textAlign: 'center',
      fontStyle: 'italic',
      marginVertical: 5,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: theme.borderRadius.small,
      marginTop: 10,
      width: '100%'
    },
    buttonText: {
      fontSize: scaleSize(12),
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.accent,
      marginLeft: 5,
      textAlign: 'center'
    },
    noLocationText: {
      fontSize: scaleSize(12),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
  });

export default TerawihLocator;
