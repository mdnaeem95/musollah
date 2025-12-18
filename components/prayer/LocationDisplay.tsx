/**
 * LocationDisplay Component
 * 
 * Shows current location (city, country) for prayer times
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface LocationDisplayProps {
  city?: string;
  country?: string;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({ 
  city = 'Singapore',
  country = 'Singapore',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.locationBadge, { backgroundColor: theme.colors.accent + '15' }]}>
        <FontAwesome6 
          name="location-dot" 
          size={12} 
          color={theme.colors.accent} 
        />
        <Text style={[styles.locationText, { color: theme.colors.accent }]}>
          {city === country ? city : `${city}, ${country}`}
        </Text>
      </View>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
});