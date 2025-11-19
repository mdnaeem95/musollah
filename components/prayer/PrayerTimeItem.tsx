/**
 * Prayer Time Item Component
 * 
 * Displays a single prayer time with name and formatted time.
 * Adapts to user's time format preference (12-hour or 24-hour).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextStyle, Dimensions, Platform } from 'react-native';
import { format, parse } from 'date-fns';
import { usePreferencesStore } from '../../stores/userPreferencesStore';

// ============================================================================
// CONSTANTS
// ============================================================================

const screenWidth = Dimensions.get('window').width;
const containerWidth = screenWidth * 0.8; // 80% of screen width

// ============================================================================
// TYPES
// ============================================================================

interface PrayerTimeItemProps {
  name: string;
  time: string;
  style?: TextStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PrayerTimeItem: React.FC<PrayerTimeItemProps> = ({ name, time, style }) => {
  // Zustand store - optimized selector
  const timeFormat = usePreferencesStore(state => state.timeFormat);

  // ============================================================================
  // TIME FORMATTING
  // ============================================================================

  /**
   * Format time string (HH:mm) to user's preferred format
   */
  const formattedTime = useMemo(() => {
    try {
      // Parse 24-hour time string (e.g., "13:15")
      const parsedTime = parse(time, 'HH:mm', new Date());
      
      // Format according to user preference
      return timeFormat === '12-hour'
        ? format(parsedTime, 'hh:mm a')  // e.g., "01:15 PM"
        : format(parsedTime, 'HH:mm');   // e.g., "13:15"
    } catch (error) {
      console.error('Error formatting time:', error);
      return time; // Fallback to original time if parsing fails
    }
  }, [time, timeFormat]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <Text style={[styles.prayerName, style]}>{name}</Text>
      <Text style={[styles.prayerTime, style]}>{formattedTime}</Text>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    width: containerWidth,
    minHeight: Platform.OS === 'android' ? 45 : 54,
    borderRadius: 15,
    borderColor: 'rgba(255, 255, 255, 1)', 
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: Platform.OS === 'android' ? 0 : 4 
    },
    shadowOpacity: 0.2,
    shadowRadius: Platform.OS === 'android' ? 0 : 6,
    elevation: Platform.OS === 'android' ? 0 : 4,
  },
  prayerName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: '#333333',
    flex: 1,
    textAlign: 'left',
  },
  prayerTime: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: '#333333',
    flex: 1,
    textAlign: 'right',
  },
});

export default PrayerTimeItem;