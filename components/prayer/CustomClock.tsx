/**
 * Custom Clock Component
 * 
 * Displays current time formatted according to user preferences.
 * Updates every minute with automatic cleanup.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePreferencesStore } from '../../stores/userPreferencesStore';

// ============================================================================
// TYPES
// ============================================================================

interface CustomClockProps {
  isRamadanMode?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CustomClock: React.FC<CustomClockProps> = ({ isRamadanMode = false }) => {
  const [currentTime, setCurrentTime] = useState('');
  
  // Zustand store - optimized selector
  const timeFormat = usePreferencesStore(state => state.timeFormat);

  // ============================================================================
  // TIME FORMATTING
  // ============================================================================

  /**
   * Format time based on user preference (12-hour or 24-hour)
   */
  const formatTime = useMemo(() => {
    return (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      if (timeFormat === '12-hour') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
      }
      
      // 24-hour format
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes}`;
    };
  }, [timeFormat]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(formatTime(now));
    };

    // Initialize time immediately
    updateTime();
    
    // Update every minute
    const interval = setInterval(updateTime, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [formatTime]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <Text style={[styles.clockText, isRamadanMode && styles.clockTextRamadan]}>
        {currentTime}
      </Text>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 60,
    color: '#000000',
    textAlign: 'center',
  },
  clockTextRamadan: {
    fontSize: 24,
  },
});

export default CustomClock;