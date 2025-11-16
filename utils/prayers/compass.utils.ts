import type { LocationCoordinates, CompassValues, FormattedDistance } from '../../types/compass.types';
import { KAABA_COORDINATES, EARTH_RADIUS_KM, KM_TO_MILES, QIBLA_PROXIMITY_THRESHOLD } from '../../constants/compass.constants';

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Normalize angle to 0-360 degrees range
 */
export const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};

/**
 * Calculate the azimuth (bearing) from user location to Kaaba
 * Using the forward azimuth formula from spherical trigonometry
 */
export const calculateQiblaAzimuth = (userCoordinates: LocationCoordinates): number => {
  const { latitude: userLat, longitude: userLon } = userCoordinates;
  const { latitude: kaabaLat, longitude: kaabaLon } = KAABA_COORDINATES;

  // Convert degrees to radians
  const userLatRad = toRadians(userLat);
  const kaabaLatRad = toRadians(kaabaLat);
  const deltaLonRad = toRadians(kaabaLon - userLon);

  // Calculate azimuth using forward azimuth formula
  const y = Math.sin(deltaLonRad) * Math.cos(kaabaLatRad);
  const x = Math.cos(userLatRad) * Math.sin(kaabaLatRad) - 
            Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(deltaLonRad);

  const azimuth = Math.atan2(y, x) * (180 / Math.PI);
  
  return normalizeAngle(azimuth);
};

/**
 * Calculate distance to Mecca using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistanceToMecca = (userCoordinates: LocationCoordinates): number => {
  const { latitude: userLat, longitude: userLon } = userCoordinates;
  const { latitude: kaabaLat, longitude: kaabaLon } = KAABA_COORDINATES;

  const dLat = toRadians(kaabaLat - userLat);
  const dLon = toRadians(kaabaLon - userLon);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(userLat)) * Math.cos(toRadians(kaabaLat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate compass values including angle and proximity
 */
export const calculateCompassValues = (
  userHeading: number | null,
  qiblaAzimuth: number | null
): CompassValues => {
  if (userHeading === null || qiblaAzimuth === null) {
    return { angle: 0, proximityToQibla: 360, isClose: false };
  }

  const angle = qiblaAzimuth - userHeading;
  const proximityToQibla = Math.abs(normalizeAngle(angle));
  const isClose = proximityToQibla < QIBLA_PROXIMITY_THRESHOLD || 
                 proximityToQibla > (360 - QIBLA_PROXIMITY_THRESHOLD);

  return { angle, proximityToQibla, isClose };
};

/**
 * Format distance for display in both km and miles
 */
export const formatDistance = (distanceKm: number | null): FormattedDistance | null => {
  if (!distanceKm) return null;
  
  return {
    km: Math.round(distanceKm),
    miles: Math.round(distanceKm * KM_TO_MILES),
  };
};

/**
 * Calculate accuracy percentage based on proximity
 */
export const calculateAccuracyPercentage = (proximityToQibla: number): number => {
  return Math.round(((360 - proximityToQibla) / 360) * 100);
};