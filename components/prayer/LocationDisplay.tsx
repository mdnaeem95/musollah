/**
 * LocationDisplay Component (GLASSMORPHISM v3.1)
 * 
 * Shows current location with live updates
 * - Listens to location store changes
 * - Shows loading state during fetch
 * - Updates city/country dynamically
 * 
 * @version 3.1
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { createLogger } from '../../services/logging/logger';
import { useLocationStore } from '../../stores/useLocationStore';

const logger = createLogger('Location');

export const LocationDisplay: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { userLocation, useCustomLocation } = useLocationStore();
  const [locationText, setLocationText] = useState<string>('Singapore');
  const [isLoading, setIsLoading] = useState(false);

  // Update location text when userLocation changes
  useEffect(() => {
    const updateLocationText = async () => {
      if (!userLocation) {
        setLocationText('Singapore');
        return;
      }

      try {
        setIsLoading(true);
        const { latitude, longitude } = userLocation.coords;
        
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        
        if (reverseGeocode.length > 0) {
          const { city, country } = reverseGeocode[0];
          const displayCity = city || 'Unknown';
          const displayCountry = country || 'Unknown';
          
          // Show only city if city === country (like Singapore)
          setLocationText(
            displayCity === displayCountry 
              ? displayCity 
              : `${displayCity}, ${displayCountry}`
          );
        } else {
          setLocationText('Unknown Location');
        }
      } catch (error) {
        logger.error('Error reverse geocoding:', error as Error);
        setLocationText('Location Detected');
      } finally {
        setIsLoading(false);
      }
    };

    updateLocationText();
  }, [userLocation]);
  
  const textColor = isDarkMode ? '#ffffff' : '#1a1a1a';
  const iconColor = isDarkMode ? '#ffffff' : theme.colors.accent;

  return (
    <View style={styles.container}>
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[
          styles.locationBadge,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.75)',
          }
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <FontAwesome6 
            name={useCustomLocation ? "location-crosshairs" : "location-dot"} 
            size={12} 
            color={iconColor}
          />
        )}
        <Text style={[styles.locationText, { color: textColor }]}>
          {locationText}
        </Text>
        {useCustomLocation && (
          <View style={[styles.customIndicator, { backgroundColor: theme.colors.accent }]} />
        )}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.2,
  },
  customIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});