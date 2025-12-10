import { useMemo } from 'react';
import { useRestaurants } from '../../api/services/food';
import { PrayerTimings, useTodayPrayerTimes } from '../../api/services/prayer';
import { useLocationStore } from '../../stores/useLocationStore';

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

export const useHeroContent = (): HeroContent => {
  const { data: restaurants } = useRestaurants();
  const userLocation = useLocationStore((state) => state.userLocation);

  const locationCoords = useMemo(() => {
    if (!userLocation?.coords) {
      // Default to Singapore if no location
      return { latitude: 1.3521, longitude: 103.8198 };
    }
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
  }, [userLocation]);

  const { data: prayerTimes } = useTodayPrayerTimes(locationCoords);
  
  // Generate greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good morning! Finding breakfast?';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon, looking for lunch?';
    } else if (hour >= 17 && hour < 20) {
      return 'Good evening! Dinner time?';
    } else {
      return 'Late night cravings?';
    }
  }, []);
  
  // Get next prayer info
    const { nextPrayer, timeUntil } = useMemo(() => {
    // Handle missing data safely
    if (!prayerTimes?.data?.timings) {
        return { nextPrayer: null, timeUntil: null };
    }

    const timings: PrayerTimings = prayerTimes.data.timings;
    const now = new Date();

    // Display label vs actual key in PrayerTimings
    const PRAYERS: { label: string; key: keyof PrayerTimings }[] = [
        { label: 'Subuh',   key: 'Fajr'    },
        { label: 'Zohor',   key: 'Dhuhr'   },
        { label: 'Asar',    key: 'Asr'     },
        { label: 'Maghrib', key: 'Maghrib' },
        { label: 'Isyak',   key: 'Isha'    },
    ];

    for (const { label, key } of PRAYERS) {
        const rawTime = timings[key];
        if (!rawTime) continue;

        // Some APIs return "05:43 (SGT)" etc – strip to just HH:mm
        const [timePart] = rawTime.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);

        const prayerDate = new Date();
        prayerDate.setHours(hours, minutes, 0, 0);

        if (prayerDate > now) {
        const diff = prayerDate.getTime() - now.getTime();
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return {
            nextPrayer: label, // Malay label for UI
            timeUntil:
            hoursLeft > 0
                ? `${hoursLeft}h ${minutesLeft}m`
                : `${minutesLeft}m`,
        };
        }
    }

    return { nextPrayer: null, timeUntil: null };
    }, [prayerTimes]);
  
  // Dynamic gradient based on time
  const backgroundGradient = useMemo<GradientColors>(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return ['#FFE5B4', '#FFD700'] as GradientColors;      // Morning (golden)
    } else if (hour >= 12 && hour < 17) {
      return ['#87CEEB', '#4682B4'] as GradientColors;      // Afternoon (sky blue)
    } else if (hour >= 17 && hour < 20) {
      return ['#FF6B6B', '#C44569'] as GradientColors;      // Evening (sunset)
    } else {
      return ['#2C3E50', '#34495E'] as GradientColors;      // Night (deep blue)
    }
  }, []);
  
  // Calculate stats
  const restaurantCount = restaurants?.length || 250;
  const verifiedCount = restaurants?.filter((r) => r.halal).length || 180;
  const reviewCount = '10k'; // Could calculate from actual reviews
  
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
