/**
 * Prayer Logging Utilities
 *
 * Utility functions for prayer logging, availability checking, and validation.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PrayerAvailability {
  prayer: string;
  time: string;
  isAvailable: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Map of prayer names in different formats
 * Handles both Aladhan API format and local Malay format
 */
const PRAYER_NAME_MAP: Record<string, string> = {
  // Aladhan API format
  Fajr: 'Subuh',
  Sunrise: 'Syuruk',
  Dhuhr: 'Zohor',
  Asr: 'Asar',
  Maghrib: 'Maghrib',
  Isha: 'Isyak',
  // Local format (already normalized)
  Subuh: 'Subuh',
  Syuruk: 'Syuruk',
  Zohor: 'Zohor',
  Asar: 'Asar',
  Isyak: 'Isyak',
  // Lowercase variants
  subuh: 'Subuh',
  syuruk: 'Syuruk',
  zohor: 'Zohor',
  asar: 'Asar',
  maghrib: 'Maghrib',
  isyak: 'Isyak',
  fajr: 'Subuh',
  sunrise: 'Syuruk',
  dhuhr: 'Zohor',
  isha: 'Isyak',
};

/**
 * Valid prayer keys to filter from API response
 * Excludes metadata fields like Imsak, Midnight, etc.
 */
const VALID_PRAYER_KEYS = new Set([
  // Aladhan format
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
  // Local format
  'Subuh',
  'Syuruk',
  'Zohor',
  'Asar',
  'Isyak',
  // Lowercase
  'subuh',
  'syuruk',
  'zohor',
  'asar',
  'maghrib',
  'isyak',
  'fajr',
  'sunrise',
  'dhuhr',
  'isha',
]);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a value is a valid time string (HH:MM or HH:MM:SS format)
 */
const isValidTimeString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  // Match HH:MM or HH:MM:SS, optionally with timezone info like "(SGT)"
  return /^\d{1,2}:\d{2}(:\d{2})?(\s*\([A-Z]+\))?$/.test(value.trim());
};

/**
 * Parse time string to hours and minutes
 * Handles formats like "05:30", "5:30", "05:30:00", "05:30 (SGT)"
 */
const parseTimeString = (time: string): { hours: number; minutes: number } | null => {
  if (!time || typeof time !== 'string') return null;

  // Remove timezone info if present (e.g., "(SGT)")
  const cleanTime = time.replace(/\s*\([A-Z]+\)\s*$/, '').trim();

  const parts = cleanTime.split(':');
  if (parts.length < 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
};

/**
 * Normalize prayer name to standard format
 */
const normalizePrayerName = (name: string): string => {
  return PRAYER_NAME_MAP[name] ?? name;
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Get prayer availability based on current time
 *
 * Improvements:
 * - Defensive null/undefined checks
 * - Filters out non-prayer keys (metadata)
 * - Validates time string format
 * - Normalizes prayer names
 * - Handles multiple API response formats
 *
 * @param prayerTimes - Object containing prayer times (various formats supported)
 * @returns Array of prayer availability objects
 */
export const getPrayerAvailability = (
  prayerTimes: Record<string, unknown> | null | undefined
): PrayerAvailability[] => {
  // Early return for invalid input
  if (!prayerTimes || typeof prayerTimes !== 'object') {
    return [];
  }

  const now = new Date();
  const results: PrayerAvailability[] = [];

  for (const [key, value] of Object.entries(prayerTimes)) {
    // Skip non-prayer keys
    if (!VALID_PRAYER_KEYS.has(key)) continue;

    // Skip invalid time values
    if (!isValidTimeString(value)) continue;

    // Parse time
    const parsed = parseTimeString(value);
    if (!parsed) continue;

    // Create prayer time Date object
    const prayerTime = new Date();
    prayerTime.setHours(parsed.hours, parsed.minutes, 0, 0);

    // Normalize prayer name
    const normalizedName = normalizePrayerName(key);

    results.push({
      prayer: normalizedName,
      time: value,
      isAvailable: now >= prayerTime,
    });
  }

  // Sort by time (earliest first)
  return results.sort((a, b) => {
    const timeA = parseTimeString(a.time);
    const timeB = parseTimeString(b.time);
    if (!timeA || !timeB) return 0;
    return timeA.hours * 60 + timeA.minutes - (timeB.hours * 60 + timeB.minutes);
  });
};

/**
 * Check if a specific prayer is available (time has passed)
 *
 * @param prayerTimes - Object containing prayer times
 * @param prayerName - Name of the prayer to check
 * @returns boolean indicating if the prayer time has passed
 */
export const isPrayerAvailable = (
  prayerTimes: Record<string, unknown> | null | undefined,
  prayerName: string
): boolean => {
  const availability = getPrayerAvailability(prayerTimes);
  const prayer = availability.find(
    (p) => p.prayer.toLowerCase() === prayerName.toLowerCase()
  );
  return prayer?.isAvailable ?? false;
};

/**
 * Get the next upcoming prayer
 *
 * @param prayerTimes - Object containing prayer times
 * @returns The next prayer that hasn't occurred yet, or null if all passed
 */
export const getNextPrayer = (
  prayerTimes: Record<string, unknown> | null | undefined
): PrayerAvailability | null => {
  const availability = getPrayerAvailability(prayerTimes);
  return availability.find((p) => !p.isAvailable) ?? null;
};

/**
 * Get the current prayer (most recent that has passed)
 *
 * @param prayerTimes - Object containing prayer times
 * @returns The current prayer period, or null if before first prayer
 */
export const getCurrentPrayer = (
  prayerTimes: Record<string, unknown> | null | undefined
): PrayerAvailability | null => {
  const availability = getPrayerAvailability(prayerTimes);
  const available = availability.filter((p) => p.isAvailable);
  return available.length > 0 ? available[available.length - 1] : null;
};

/**
 * Get time until next prayer in milliseconds
 *
 * @param prayerTimes - Object containing prayer times
 * @returns Milliseconds until next prayer, or null if all prayers passed
 */
export const getTimeUntilNextPrayer = (
  prayerTimes: Record<string, unknown> | null | undefined
): number | null => {
  const nextPrayer = getNextPrayer(prayerTimes);
  if (!nextPrayer) return null;

  const parsed = parseTimeString(nextPrayer.time);
  if (!parsed) return null;

  const now = new Date();
  const prayerTime = new Date();
  prayerTime.setHours(parsed.hours, parsed.minutes, 0, 0);

  return prayerTime.getTime() - now.getTime();
};

/**
 * Format time until prayer as human-readable string
 *
 * @param milliseconds - Time in milliseconds
 * @returns Formatted string like "2h 30m" or "45m"
 */
export const formatTimeUntilPrayer = (milliseconds: number | null): string => {
  if (milliseconds === null || milliseconds < 0) return '--';

  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};