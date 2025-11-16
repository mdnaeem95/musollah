import { Dimensions } from 'react-native';

// Kaaba coordinates
export const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
} as const;

// Earth radius in kilometers
export const EARTH_RADIUS_KM = 6371;

// Screen dimensions
export const SCREEN_WIDTH = Dimensions.get('window').width;

// Compass sizing
export const COMPASS_SIZE_RATIO = 0.75;
export const COMPASS_SIZE = SCREEN_WIDTH * COMPASS_SIZE_RATIO;

// Thresholds
export const QIBLA_PROXIMITY_THRESHOLD = 5; // degrees
export const VIBRATION_COOLDOWN = 2000; // milliseconds

// Animation durations
export const ANIMATION_DURATION = 300;
export const KAABAH_PULSE_ITERATIONS = 2;

// Haptic patterns
export const HAPTIC_PATTERN = {
  SUCCESS: 'notificationSuccess' as const,
  WARNING: 'notificationWarning' as const,
  IMPACT_MEDIUM: 'impactMedium' as const,
};

// Update throttles
export const HEADING_UPDATE_THROTTLE = 100; // milliseconds
export const LOCATION_UPDATE_THROTTLE = 5000; // 5 seconds

// Conversion factors
export const KM_TO_MILES = 0.621371;