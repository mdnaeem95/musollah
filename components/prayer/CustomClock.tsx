/**
 * Custom Clock Component
 * 
 * Displays current time formatted according to user preferences.
 * Updates every minute with perfect synchronization to system time.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePreferencesStore } from '../../stores/userPreferencesStore';

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// COMPONENT
// ============================================================================

const CustomClock: React.FC = () => {
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

    // ✅ Initialize time immediately
    updateTime();
    
    // ✅ Calculate milliseconds until next minute boundary
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    const msUntilNextMinute = secondsUntilNextMinute * 1000 - now.getMilliseconds();
    
    // ✅ Wait until next minute boundary, then start synced interval
    const syncTimeout = setTimeout(() => {
      updateTime(); // Update at the minute boundary
      
      // ✅ Now start precise 60-second interval (synced to minute boundaries)
      const interval = setInterval(updateTime, 60000);
      
      // Store interval ID for cleanup
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    // ✅ Cleanup both timeout and interval
    return () => {
      clearTimeout(syncTimeout);
    };
  }, [formatTime]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <Text style={styles.clockText}>
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
    // Demoted from a 64px hero to a quiet timestamp — the NextPrayerHero is now the
    // focal point, and a smaller clock no longer collides with the sun behind it.
    fontFamily: 'Outfit_400Regular',
    fontSize: 26,
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});

export default CustomClock;