/**
 * Prayer Service Constants
 * 
 * Centralized configuration, collection names, and magic values.
 * 
 * @version 3.0
 * @since 2025-12-22
 */

// ============================================================================
// FIREBASE COLLECTIONS
// ============================================================================

/**
 * Firebase collection names
 * Update year as needed - consider using dynamic year
 */
export const FIREBASE_COLLECTIONS = {
  PRAYER_TIMES: 'prayerTimes2025', // TODO: Make dynamic based on year
  USERS: 'users',
  KHUTBAHS: 'khutbahs',
  DUAS: 'duas',
} as const;

/**
 * Get prayer times collection for a specific year
 */
export function getPrayerTimesCollection(year: number = new Date().getFullYear()): string {
  return `prayerTimes${year}`;
}

// ============================================================================
// CALCULATION METHODS
// ============================================================================

/**
 * Aladhan API calculation methods
 * @see https://aladhan.com/prayer-times-api#methods
 */
export enum CalculationMethod {
  MAKKAH = 1,
  ISNA = 2,
  MUSLIM_WORLD_LEAGUE = 3,
  UMM_AL_QURA = 4,
  EGYPTIAN = 5,
  KARACHI = 7,
  TEHRAN = 8,
  JAFARI = 9,
  SINGAPORE = 11, // ✅ Default for Singapore
  TURKEY = 13,
  DUBAI = 15,
}

/**
 * Juristic school for Asr calculation
 */
export enum School {
  SHAFI = 0, // ✅ Default for Singapore (Asr when shadow = object length)
  HANAFI = 1, // Asr when shadow = 2x object length
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default location (Singapore)
 */
export const DEFAULT_LOCATION = {
  latitude: 1.3521,
  longitude: 103.8198,
  city: 'Singapore',
  country: 'Singapore',
} as const;

/**
 * Kaaba coordinates (for Qibla calculation)
 */
export const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
} as const;

/**
 * Default prayer times configuration
 */
export const DEFAULT_PRAYER_CONFIG = {
  method: CalculationMethod.SINGAPORE,
  school: School.SHAFI,
} as const;

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

/**
 * Cache TTL values (in milliseconds)
 */
export const CACHE_TTL = {
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Prayer times stale times (when to refetch)
 */
export const STALE_TIME = {
  TODAY_PRAYER_TIMES: CACHE_TTL.ONE_HOUR, // Refetch after 1 hour
  SPECIFIC_DATE: CACHE_TTL.ONE_DAY, // Refetch after 1 day
  MONTHLY: CACHE_TTL.ONE_MONTH, // Refetch after 1 month
  PRAYER_LOG: CACHE_TTL.FIVE_MINUTES, // Refetch after 5 minutes
  PRAYER_STATS: CACHE_TTL.FIFTEEN_MINUTES, // Refetch after 15 minutes
} as const;

// ============================================================================
// PRAYER TIMING WINDOWS
// ============================================================================

/**
 * Prayer logging window (minutes before/after prayer time)
 */
export const PRAYER_LOG_WINDOW = {
  BEFORE: 0, // Can't log before prayer time
  AFTER: 24 * 60, // Can log up to 24 hours after
} as const;

/**
 * Qibla proximity threshold (degrees)
 * User is "close" to Qibla if within this range
 */
export const QIBLA_PROXIMITY_THRESHOLD = 5; // degrees

/**
 * Earth radius in kilometers (for distance calculations)
 */
export const EARTH_RADIUS_KM = 6371;

/**
 * Conversion factor: km to miles
 */
export const KM_TO_MILES = 0.621371;

// ============================================================================
// PRAYER NAMES
// ============================================================================

/**
 * Prayer display order
 */
export const PRAYER_ORDER = [
  'Subuh',
  'Syuruk',
  'Zohor',
  'Asar',
  'Maghrib',
  'Isyak',
] as const;

/**
 * Loggable prayers (excludes Syuruk)
 */
export const LOGGABLE_PRAYERS = [
  'Subuh',
  'Zohor',
  'Asar',
  'Maghrib',
  'Isyak',
] as const;

/**
 * Prayer name translations (for display)
 */
export const PRAYER_TRANSLATIONS = {
  Subuh: { en: 'Fajr', ar: 'الفجر' },
  Syuruk: { en: 'Sunrise', ar: 'الشروق' },
  Zohor: { en: 'Dhuhr', ar: 'الظهر' },
  Asar: { en: 'Asr', ar: 'العصر' },
  Maghrib: { en: 'Maghrib', ar: 'المغرب' },
  Isyak: { en: 'Isha', ar: 'العشاء' },
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Aladhan API base URL
 */
export const ALADHAN_BASE_URL = 'https://api.aladhan.com/v1';

/**
 * Aladhan API endpoints
 */
export const ALADHAN_ENDPOINTS = {
  TIMINGS: '/timings',
  CALENDAR: '/calendar',
  HIJRI_CALENDAR: '/hijriCalendar',
  CONVERT_TO_HIJRI: '/gToH', // Gregorian to Hijri
  CONVERT_TO_GREGORIAN: '/hToG', // Hijri to Gregorian
} as const;

// ============================================================================
// DATE FORMATS
// ============================================================================

/**
 * Date format strings
 */
export const DATE_FORMATS = {
  API: 'dd-MM-yyyy', // Aladhan API format
  ISO: 'yyyy-MM-dd', // ISO 8601 / Firebase format
  FIREBASE: 'D/M/yyyy', // Legacy Firebase format (e.g., "1/1/2025")
  DISPLAY: 'MMM dd, yyyy', // Display format (e.g., "Jan 01, 2025")
  HIJRI_DISPLAY: 'dd MMMM yyyy', // Hijri display (e.g., "15 Ramadan 1446")
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Coordinate boundaries
 */
export const COORDINATE_BOUNDS = {
  LATITUDE: { min: -90, max: 90 },
  LONGITUDE: { min: -180, max: 180 },
} as const;

/**
 * Singapore boundaries (for validation)
 */
export const SINGAPORE_BOUNDS = {
  LATITUDE: { min: 1.15, max: 1.47 },
  LONGITUDE: { min: 103.6, max: 104.0 },
} as const;

/**
 * Time string regex patterns
 */
export const TIME_PATTERNS = {
  HH_MM: /^\d{1,2}:\d{2}$/,
  HH_MM_SS: /^\d{1,2}:\d{2}:\d{2}$/,
  HH_MM_WITH_TZ: /^\d{1,2}:\d{2}(\s*\([A-Z]+\))?$/,
  FULL: /^\d{1,2}:\d{2}(:\d{2})?(\s*\([A-Z]+\))?$/,
} as const;

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

/**
 * Available reminder intervals (minutes before prayer)
 */
export const REMINDER_INTERVALS = [0, 5, 10, 15, 20, 25, 30] as const;

/**
 * Available adhan options
 */
export const ADHAN_OPTIONS = [
  'None',
  'Ahmad Al-Nafees',
  'Mishary Rashid Alafasy',
] as const;

// ============================================================================
// STREAK CALCULATION
// ============================================================================

/**
 * Streak calculation settings
 */
export const STREAK_SETTINGS = {
  PRAYERS_REQUIRED_FOR_STREAK: 5, // All 5 loggable prayers
  MAX_GAP_DAYS: 1, // Max 1 day gap allowed
} as const;

// ============================================================================
// WIDGET STORAGE (iOS)
// ============================================================================

/**
 * iOS widget app group identifier
 */
export const WIDGET_APP_GROUP = 'group.com.rihlah.prayerTimesWidget' as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to prayer time service. Please check your internet connection.',
  API_ERROR: 'Failed to fetch prayer times. Please try again later.',
  FIREBASE_ERROR: 'Unable to sync prayer data. Please try again.',
  VALIDATION_ERROR: 'Invalid prayer time data received.',
  LOCATION_ERROR: 'Unable to get your location. Please enable location services.',
  NOT_FOUND: 'Prayer times not found for this date.',
  UNAUTHORIZED: 'Please sign in to access this feature.',
  GENERIC: 'Something went wrong. Please try again.',
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Feature flags for gradual rollout
 */
export const FEATURES = {
  USE_FIREBASE_FIRST: true, // Prioritize Firebase over Aladhan API
  ENABLE_OFFLINE_MODE: true, // Use cached data when offline
  ENABLE_BACKGROUND_SYNC: true, // Sync data in background
  ENABLE_WIDGET_SUPPORT: true, // iOS widget support
  ENABLE_NOTIFICATIONS: true, // Prayer notifications
} as const;

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Debug logging (disable in production)
 */
export const DEBUG = {
  ENABLED: __DEV__,
  PREFIX: '[Prayer Service]',
  COLORS: {
    INFO: '\x1b[36m', // Cyan
    SUCCESS: '\x1b[32m', // Green
    WARNING: '\x1b[33m', // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m',
  },
} as const;

/**
 * Debug logger utility
 */
export const logger = {
  info: (...args: any[]) =>
    DEBUG.ENABLED &&
    console.log(DEBUG.COLORS.INFO, DEBUG.PREFIX, ...args, DEBUG.COLORS.RESET),
  success: (...args: any[]) =>
    DEBUG.ENABLED &&
    console.log(DEBUG.COLORS.SUCCESS, DEBUG.PREFIX, '✅', ...args, DEBUG.COLORS.RESET),
  warn: (...args: any[]) =>
    DEBUG.ENABLED &&
    console.warn(DEBUG.COLORS.WARNING, DEBUG.PREFIX, '⚠️', ...args, DEBUG.COLORS.RESET),
  error: (...args: any[]) =>
    console.error(DEBUG.COLORS.ERROR, DEBUG.PREFIX, '❌', ...args, DEBUG.COLORS.RESET),
} as const;