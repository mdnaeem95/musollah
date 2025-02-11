import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';

const LocationInfo = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.warn('Location permission denied. Defaulting to Singapore.');
          setLocation('Singapore');
          setLoading(false);
          return;
        }

        let userLocation = await Location.getCurrentPositionAsync({});
        let reverseGeocode = await Location.reverseGeocodeAsync(userLocation.coords);
        
        if (reverseGeocode.length > 0) {
          const { city, country } = reverseGeocode[0];
          setLocation(`${city}, ${country}`);
        } else {
          setLocation('Unknown Location');
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocation('Singapore'); // Default location
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return (
    <View style={styles.locationContainer}>
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.text.secondary} />
      ) : (
        <Text style={styles.locationText}>{location}</Text>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    locationContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    locationText: {
      fontSize: 16,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.primary,
    },
  });

export default LocationInfo;
