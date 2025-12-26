/**
 * Hero Content Hook
 *
 * ✅ REFACTORED: Using new prayer API architecture
 * ✅ UPDATED: Works with normalized prayer times (subuh, zohor, etc.)
 * ✅ IMPROVED: Better error handling, prayer time validation
 *
 * Generates dynamic hero content based on:
 * - Time of day (greeting + gradient)
 * - Prayer times (next prayer countdown)
 * - Restaurant statistics
 *
 * @version 4.0
 * @since 2025-12-24
 */

import { useMemo } from 'react';
import { useRestaurants } from '../../api/services/food';
import { useLocationStore } from '../../stores/useLocationStore';

// ✅ NEW: Import from updated prayer service
import { useTodayPrayerTimes } from '../../api/services/prayer';
import type { NormalizedPrayerTimes } from '../../api/services/prayer/types';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Hero Content');

// ============================================================================
// TYPES
// ============================================================================

type GradientColors = [string, string, ...string[]];

interface HeroContent {
  greeting: string;
  nextPrayer: string | null;
  timeUntil: string | null;
  backgroundGradient: GradientColors;
  restaurantCount: number;
  verifiedCount: number;
  reviewCount: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SINGAPORE_DEFAULT_COORDS = {
  latitude: 1.3521,
  longitude: 103.8198,
} as const;

// ✅ UPDATED: Prayer mappings for new normalized format (lowercase keys)
const PRAYER_MAPPINGS = [
  { label: 'Subuh', key: 'subuh' as keyof NormalizedPrayerTimes },
  { label: 'Zohor', key: 'zohor' as keyof NormalizedPrayerTimes },
  { label: 'Asar', key: 'asar' as keyof NormalizedPrayerTimes },
  { label: 'Maghrib', key: 'maghrib' as keyof NormalizedPrayerTimes },
  { label: 'Isyak', key: 'isyak' as keyof NormalizedPrayerTimes },
] as const;

// Time-based gradients
const GRADIENTS = {
  MORNING: ['#FF9A56', '#FF6B35'] as GradientColors,     // Golden
  AFTERNOON: ['#87CEEB', '#4682B4'] as GradientColors,   // Sky blue
  EVENING: ['#FF6B6B', '#C44569'] as GradientColors,     // Sunset
  NIGHT: ['#2C3E50', '#34495E'] as GradientColors,       // Deep blue
} as const;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Parse time string (handles "05:43" or "13:15" format)
 * 
 * ✅ SIMPLIFIED: New API returns clean "HH:MM" format (no SGT suffix)
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  try {
    const [hoursStr, minutesStr] = timeStr.trim().split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      logger.warn('Invalid time values', { timeStr, hours, minutes });
      return null;
    }
    
    return { hours, minutes };
  } catch (error) {
    logger.error('Failed to parse time string', error as Error, { timeStr });
    return null;
  }
}

/**
 * Format time difference into human-readable string
 */
function formatTimeDifference(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ============================================================================
// HOOK
// ============================================================================

export const useHeroContent = (): HeroContent => {
  logger.time('hero-content-calculation');
  
  // Fetch restaurant data
  const { data: restaurants } = useRestaurants();
  
  // Get user location (with fallback)
  const userLocation = useLocationStore((state) => state.userLocation);

  const locationCoords = useMemo(() => {
    if (!userLocation?.coords) {
      logger.debug('No user location, using Singapore default', SINGAPORE_DEFAULT_COORDS);
      return SINGAPORE_DEFAULT_COORDS;
    }
    
    const coords = {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
    
    logger.debug('Using user location', coords);
    return coords;
  }, [userLocation]);

  // ✅ UPDATED: Fetch prayer times using new API
  const { data: prayerTimes } = useTodayPrayerTimes(locationCoords);
  
  // Generate time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    
    let greetingText: string;
    if (hour >= 5 && hour < 12) {
      greetingText = 'Good morning! Finding breakfast?';
    } else if (hour >= 12 && hour < 17) {
      greetingText = 'Good afternoon, looking for lunch?';
    } else if (hour >= 17 && hour < 20) {
      greetingText = 'Good evening! Dinner time?';
    } else {
      greetingText = 'Late night cravings?';
    }
    
    logger.debug('Greeting generated', { hour, greeting: greetingText });
    return greetingText;
  }, []);
  
  // ✅ UPDATED: Calculate next prayer with new data structure
  const { nextPrayer, timeUntil } = useMemo(() => {
    logger.time('calculate-next-prayer');
    
    // ✅ NEW: Validate normalized prayer times
    if (!prayerTimes) {
      logger.warn('Prayer times not available', {
        hasPrayerTimes: !!prayerTimes,
      });
      logger.timeEnd('calculate-next-prayer');
      return { nextPrayer: null, timeUntil: null };
    }

    const now = new Date();

    logger.debug('Calculating next prayer', {
      currentTime: now.toTimeString(),
      availablePrayers: Object.keys(prayerTimes),
      prayerTimesData: prayerTimes,
    });

    // ✅ UPDATED: Check each prayer using new lowercase keys
    for (const { label, key } of PRAYER_MAPPINGS) {
      const rawTime = prayerTimes[key];
      if (!rawTime) {
        logger.debug('Prayer time missing', { prayer: label, key });
        continue;
      }

      // Parse time string (now simpler format)
      const parsedTime = parseTimeString(rawTime);
      if (!parsedTime) {
        logger.warn('Failed to parse prayer time', { prayer: label, rawTime });
        continue;
      }

      // Create prayer date
      const prayerDate = new Date();
      prayerDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

      // Check if prayer is upcoming
      if (prayerDate > now) {
        const diff = prayerDate.getTime() - now.getTime();
        const formattedTime = formatTimeDifference(diff);
        
        logger.success('Next prayer found', {
          prayer: label,
          prayerTime: rawTime,
          timeUntil: formattedTime,
          minutesUntil: Math.floor(diff / (1000 * 60)),
        });
        
        logger.timeEnd('calculate-next-prayer');
        return {
          nextPrayer: label,
          timeUntil: formattedTime,
        };
      } else {
        logger.debug('Prayer time has passed', {
          prayer: label,
          prayerTime: rawTime,
          minutesAgo: Math.floor((now.getTime() - prayerDate.getTime()) / (1000 * 60)),
        });
      }
    }

    logger.info('No upcoming prayers today');
    logger.timeEnd('calculate-next-prayer');
    return { nextPrayer: null, timeUntil: null };
  }, [prayerTimes]);
  
  // Time-based background gradient
  const backgroundGradient = useMemo<GradientColors>(() => {
    const hour = new Date().getHours();
    
    let gradient: GradientColors;
    let period: string;
    
    if (hour >= 5 && hour < 12) {
      gradient = GRADIENTS.MORNING;
      period = 'morning';
    } else if (hour >= 12 && hour < 17) {
      gradient = GRADIENTS.AFTERNOON;
      period = 'afternoon';
    } else if (hour >= 17 && hour < 20) {
      gradient = GRADIENTS.EVENING;
      period = 'evening';
    } else {
      gradient = GRADIENTS.NIGHT;
      period = 'night';
    }
    
    logger.debug('Gradient selected', {
      hour,
      period,
      colors: gradient,
    });
    
    return gradient;
  }, []);
  
  // Calculate restaurant statistics
  const restaurantCount = useMemo(() => {
    const count = restaurants?.length || 250;
    logger.debug('Restaurant count', { count, hasData: !!restaurants });
    return count;
  }, [restaurants]);
  
  const verifiedCount = useMemo(() => {
    if (!restaurants) {
      logger.debug('No restaurants data for verified count, using default');
      return 180;
    }
    
    const count = restaurants.filter((r) => r.halal).length;
    const percentage = restaurants.length > 0 
      ? ((count / restaurants.length) * 100).toFixed(1) 
      : '0';
    
    logger.debug('Verified restaurants calculated', {
      verifiedCount: count,
      totalCount: restaurants.length,
      percentage: percentage + '%',
    });
    
    return count;
  }, [restaurants]);
  
  const reviewCount = useMemo(() => {
    // TODO: Calculate from actual reviews when available
    const count = '10k';
    logger.debug('Review count', { count, note: 'hardcoded - needs implementation' });
    return count;
  }, []);
  
  logger.timeEnd('hero-content-calculation');
  
  return {
    greeting,
    nextPrayer,
    timeUntil,
    backgroundGradient,
    restaurantCount,
    verifiedCount,
    reviewCount,
  };
};