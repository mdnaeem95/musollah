/**
 * Qibla Utilities
 * 
 * Functions for calculating Qibla direction (bearing to Mecca) and
 * compass-related utilities.
 * 
 * @version 3.0
 * @since 2025-12-22
 */

import { Coordinates } from '../types/index';
import { QIBLA_PROXIMITY_THRESHOLD, EARTH_RADIUS_KM, logger } from '../types/constants';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Kaaba coordinates (Mecca, Saudi Arabia)
 */
export const KAABA_COORDINATES: Coordinates = {
  latitude: 21.4225,
  longitude: 39.8262,
};

// ============================================================================
// QIBLA DIRECTION CALCULATION
// ============================================================================

/**
 * Calculate Qibla direction (bearing to Mecca) from a location
 * 
 * Uses the Haversine formula to calculate the initial bearing from
 * the user's location to the Kaaba in Mecca.
 * 
 * @param userLocation - User's current coordinates
 * @returns Bearing in degrees (0-360), where 0 is North
 * 
 * @example
 * ```ts
 * const singapore = { latitude: 1.3521, longitude: 103.8198 };
 * const qibla = calculateQiblaDirection(singapore);
 * console.log(qibla); // ~292° (Northwest)
 * ```
 */
export function calculateQiblaDirection(userLocation: Coordinates): number {
  const { latitude: lat1, longitude: lon1 } = userLocation;
  const { latitude: lat2, longitude: lon2 } = KAABA_COORDINATES;

  logger.info('Calculating Qibla direction', { from: userLocation });

  // Convert degrees to radians
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  // Calculate bearing using spherical trigonometry
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  // Convert to degrees and normalize to 0-360
  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  logger.success('Qibla direction calculated', { bearing: bearing.toFixed(2) });

  return bearing;
}

/**
 * Calculate distance to Kaaba
 * 
 * Uses the Haversine formula to calculate the great-circle distance
 * between the user's location and the Kaaba.
 * 
 * @param userLocation - User's current coordinates
 * @returns Distance in kilometers
 * 
 * @example
 * ```ts
 * const singapore = { latitude: 1.3521, longitude: 103.8198 };
 * const distance = calculateDistanceToKaaba(singapore);
 * console.log(distance); // ~7,355 km
 * ```
 */
export function calculateDistanceToKaaba(userLocation: Coordinates): number {
  return calculateDistanceBetween(userLocation, KAABA_COORDINATES);
}

// ============================================================================
// DISTANCE CALCULATIONS
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * 
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in kilometers
 * 
 * @example
 * ```ts
 * const singapore = { latitude: 1.3521, longitude: 103.8198 };
 * const kualaLumpur = { latitude: 3.139, longitude: 101.6869 };
 * const distance = calculateDistanceBetween(singapore, kualaLumpur);
 * console.log(distance); // ~316 km
 * ```
 */
export function calculateDistanceBetween(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const { latitude: lat1, longitude: lon1 } = coord1;
  const { latitude: lat2, longitude: lon2 } = coord2;

  // Convert to radians
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = EARTH_RADIUS_KM * c;

  return distance;
}

/**
 * Format distance for display
 * 
 * Shows meters if < 1km, kilometers otherwise
 * 
 * @param distanceKm - Distance in kilometers
 * @returns Formatted string
 * 
 * @example
 * ```ts
 * formatDistance(0.5) // "500 m"
 * formatDistance(1.234) // "1.2 km"
 * formatDistance(1234) // "1,234 km"
 * ```
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }

  if (distanceKm < 1000) {
    return `${Math.round(distanceKm)} km`;
  }

  // Add comma for thousands
  return `${Math.round(distanceKm).toLocaleString()} km`;
}

// ============================================================================
// COMPASS UTILITIES
// ============================================================================

/**
 * Normalize compass heading to 0-360 range
 * 
 * @param heading - Raw compass heading (can be negative or > 360)
 * @returns Normalized heading (0-360)
 * 
 * @example
 * ```ts
 * normalizeHeading(-45) // 315
 * normalizeHeading(450) // 90
 * ```
 */
export function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360;
}

/**
 * Calculate difference between two compass headings
 * 
 * Returns the shortest angular distance between two bearings
 * 
 * @param heading1 - First heading (0-360)
 * @param heading2 - Second heading (0-360)
 * @returns Difference in degrees (-180 to 180)
 * 
 * @example
 * ```ts
 * calculateHeadingDifference(10, 350) // 20 (not -340)
 * calculateHeadingDifference(350, 10) // -20 (not 340)
 * ```
 */
export function calculateHeadingDifference(
  heading1: number,
  heading2: number
): number {
  let diff = heading2 - heading1;

  // Normalize to -180 to 180
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  return diff;
}

/**
 * Check if user is facing Qibla direction
 * 
 * Uses configurable threshold (default: ±5°)
 * 
 * @param currentHeading - Current compass heading
 * @param qiblaDirection - Calculated Qibla direction
 * @param threshold - Acceptable deviation in degrees
 * @returns True if within threshold
 * 
 * @example
 * ```ts
 * const qibla = 292;
 * isPointingToQibla(290, qibla) // true (within ±5°)
 * isPointingToQibla(280, qibla) // false (more than 5° off)
 * ```
 */
export function isPointingToQibla(
  currentHeading: number,
  qiblaDirection: number,
  threshold: number = QIBLA_PROXIMITY_THRESHOLD
): boolean {
  const diff = Math.abs(calculateHeadingDifference(currentHeading, qiblaDirection));
  return diff <= threshold;
}

/**
 * Get cardinal direction from bearing
 * 
 * @param bearing - Compass bearing (0-360)
 * @returns Cardinal direction (N, NE, E, SE, S, SW, W, NW)
 * 
 * @example
 * ```ts
 * getCardinalDirection(0) // 'N'
 * getCardinalDirection(45) // 'NE'
 * getCardinalDirection(90) // 'E'
 * getCardinalDirection(292) // 'NW'
 * ```
 */
export function getCardinalDirection(bearing: number): string {
  const normalized = normalizeHeading(bearing);

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;

  return directions[index];
}

/**
 * Get full cardinal direction name
 * 
 * @param bearing - Compass bearing (0-360)
 * @returns Full direction name
 * 
 * @example
 * ```ts
 * getCardinalDirectionName(0) // 'North'
 * getCardinalDirectionName(292) // 'Northwest'
 * ```
 */
export function getCardinalDirectionName(bearing: number): string {
  const normalized = normalizeHeading(bearing);

  const directions = [
    'North',
    'Northeast',
    'East',
    'Southeast',
    'South',
    'Southwest',
    'West',
    'Northwest',
  ];
  const index = Math.round(normalized / 45) % 8;

  return directions[index];
}

// ============================================================================
// COORDINATE UTILITIES
// ============================================================================

/**
 * Validate coordinates
 * 
 * Checks if latitude and longitude are within valid ranges
 * 
 * @param coords - Coordinates to validate
 * @returns True if valid
 * 
 * @example
 * ```ts
 * validateCoordinates({ latitude: 1.3521, longitude: 103.8198 }) // true
 * validateCoordinates({ latitude: 91, longitude: 0 }) // false (lat > 90)
 * ```
 */
export function validateCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Format coordinates for display
 * 
 * @param coords - Coordinates to format
 * @returns Formatted string (e.g., "1.35° N, 103.82° E")
 * 
 * @example
 * ```ts
 * formatCoordinates({ latitude: 1.3521, longitude: 103.8198 })
 * // "1.35° N, 103.82° E"
 * ```
 */
export function formatCoordinates(coords: Coordinates): string {
  const latDir = coords.latitude >= 0 ? 'N' : 'S';
  const lonDir = coords.longitude >= 0 ? 'E' : 'W';

  const lat = Math.abs(coords.latitude).toFixed(2);
  const lon = Math.abs(coords.longitude).toFixed(2);

  return `${lat}° ${latDir}, ${lon}° ${lonDir}`;
}

// ============================================================================
// ANGLE UTILITIES
// ============================================================================

/**
 * Convert degrees to radians
 * 
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 * 
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Interpolate between two angles
 * 
 * Smoothly transitions between two compass bearings,
 * taking the shortest path.
 * 
 * @param from - Starting angle (0-360)
 * @param to - Ending angle (0-360)
 * @param progress - Progress (0-1)
 * @returns Interpolated angle
 * 
 * @example
 * ```ts
 * interpolateAngle(350, 10, 0.5) // 0 (halfway between)
 * interpolateAngle(10, 350, 0.5) // 0 (shortest path)
 * ```
 */
export function interpolateAngle(from: number, to: number, progress: number): number {
  const diff = calculateHeadingDifference(from, to);
  return normalizeHeading(from + diff * progress);
}

// ============================================================================
// MAGNETOMETER UTILITIES
// ============================================================================

/**
 * Apply magnetic declination correction
 * 
 * Magnetic north differs from true north by the magnetic declination.
 * This function corrects the compass reading to get true north.
 * 
 * @param magneticHeading - Heading from magnetometer
 * @param declination - Magnetic declination at location (degrees)
 * @returns Corrected true heading
 * 
 * @example
 * ```ts
 * // Singapore's declination is approximately 0.5° East
 * correctMagneticDeclination(292, 0.5) // 292.5
 * ```
 */
export function correctMagneticDeclination(
  magneticHeading: number,
  declination: number
): number {
  return normalizeHeading(magneticHeading + declination);
}

/**
 * Get magnetic declination for Singapore
 * 
 * Note: This is a simplified approximation.
 * For precise applications, use a geomagnetic model like WMM.
 * 
 * @returns Magnetic declination in degrees (positive = East)
 */
export function getSingaporeMagneticDeclination(): number {
  // Singapore's declination is approximately 0.5° East as of 2025
  // This changes very slowly over time
  return 0.5;
}

/**
 * Smooth compass readings using exponential moving average
 * 
 * Reduces jitter in compass readings
 * 
 * @param currentValue - Current smoothed value
 * @param newValue - New raw reading
 * @param smoothingFactor - Smoothing factor (0-1, higher = more smoothing)
 * @returns Smoothed value
 * 
 * @example
 * ```ts
 * let smoothed = 0;
 * smoothed = smoothCompassReading(smoothed, 292, 0.8); // 233.6
 * smoothed = smoothCompassReading(smoothed, 293, 0.8); // 245.5
 * ```
 */
export function smoothCompassReading(
  currentValue: number,
  newValue: number,
  smoothingFactor: number = 0.8
): number {
  if (currentValue === 0) return newValue;

  // Handle wrap-around at 0/360
  const diff = calculateHeadingDifference(currentValue, newValue);
  const smoothedDiff = diff * (1 - smoothingFactor);

  return normalizeHeading(currentValue + smoothedDiff);
}

// ============================================================================
// DEBUGGING
// ============================================================================

/**
 * Log Qibla calculation details for debugging
 * 
 * @param userLocation - User's location
 */
export function debugLogQiblaCalculation(userLocation: Coordinates): void {
  const qiblaDirection = calculateQiblaDirection(userLocation);
  const distance = calculateDistanceToKaaba(userLocation);
  const cardinal = getCardinalDirectionName(qiblaDirection);

  logger.info('Qibla Calculation Debug', {
    userLocation: formatCoordinates(userLocation),
    qiblaDirection: `${qiblaDirection.toFixed(2)}°`,
    cardinalDirection: cardinal,
    distanceToKaaba: formatDistance(distance),
  });
}

/**
 * Log compass status for debugging
 * 
 * @param currentHeading - Current compass heading
 * @param qiblaDirection - Calculated Qibla direction
 */
export function debugLogCompassStatus(
  currentHeading: number,
  qiblaDirection: number
): void {
  const difference = calculateHeadingDifference(currentHeading, qiblaDirection);
  const isPointing = isPointingToQibla(currentHeading, qiblaDirection);

  logger.info('Compass Status Debug', {
    currentHeading: `${currentHeading.toFixed(1)}°`,
    qiblaDirection: `${qiblaDirection.toFixed(1)}°`,
    difference: `${difference.toFixed(1)}°`,
    isPointingToQibla: isPointing,
  });
}