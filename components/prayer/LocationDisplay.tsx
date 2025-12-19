/**
 * LocationDisplay Component (ENHANCED v2.0)
 * 
 * Shows current location (city, country) for prayer times
 * 
 * ✨ IMPROVEMENTS:
 * - Better dark mode visibility with 30% opacity background
 * - Added border for definition
 * - Improved contrast and readability
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
      <View 
        style={[
          styles.locationBadge, 
          { 
            backgroundColor: theme.colors.accent + '30',  // ✅ Increased from 15% to 30%
            borderColor: theme.colors.accent + '40',      // ✅ Added border for definition
          }
        ]}
      >
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
    paddingHorizontal: 14,      // ✅ Slightly increased for better presence
    paddingVertical: 7,         // ✅ Slightly increased for better presence
    borderRadius: 999,
    borderWidth: 1.5,           // ✅ Added border
    shadowColor: '#000',        // ✅ Added subtle shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',  // ✅ Increased weight for better visibility
  },
});