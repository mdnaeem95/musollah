/**
 * Prayer Constants (Modernized)
 * 
 * Updated to work with new prayer service string literal types.
 * 
 * @version 4.0
 * @since 2025-12-24
 */

import type { LocalPrayerName } from '../api/services/prayer/types';

// ============================================================================
// PRAYER BACKGROUNDS
// ============================================================================

export type ThemeColor = 'green' | 'purple' | 'blue';

/**
 * Prayer time background images by prayer and theme
 * ✅ Uses string literal keys to match LocalPrayerName type
 */
export const PRAYER_BACKGROUNDS: Record<
  LocalPrayerName,
  Record<ThemeColor, any>
> = {
  Subuh: {
    green: require('../assets/prayerBackgroundImages/subuhBackground.png'),
    purple: require('../assets/prayerBackgroundImages/subuhBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/subuhBackgroundBlue.png'),
  },
  Syuruk: {
    green: require('../assets/prayerBackgroundImages/subuhBackground.png'),
    purple: require('../assets/prayerBackgroundImages/subuhBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/subuhBackgroundBlue.png'),
  },
  Zohor: {
    green: require('../assets/prayerBackgroundImages/zuhurBackground.png'),
    purple: require('../assets/prayerBackgroundImages/zuhurBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/zuhurBackgroundBlue.png'),
  },
  Asar: {
    green: require('../assets/prayerBackgroundImages/asarBackground.png'),
    purple: require('../assets/prayerBackgroundImages/asarBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/asarBackgroundBlue.png'),
  },
  Maghrib: {
    green: require('../assets/prayerBackgroundImages/maghribBackground.png'),
    purple: require('../assets/prayerBackgroundImages/maghribBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/maghribBackgroundBlue.png'),
  },
  Isyak: {
    green: require('../assets/prayerBackgroundImages/isyaBackground.png'),
    purple: require('../assets/prayerBackgroundImages/isyaBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/isyaBackgroundBlue.png'),
  },
} as const;

// ============================================================================
// PRAYER NAMES & LISTS
// ============================================================================

/**
 * All prayers in order
 */
export const PRAYER_NAMES: readonly LocalPrayerName[] = [
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
export const LOGGABLE_PRAYERS: readonly LocalPrayerName[] = [
  'Subuh',
  'Zohor',
  'Asar',
  'Maghrib',
  'Isyak',
] as const;

// ============================================================================
// PRAYER COLORS
// ============================================================================

/**
 * Prayer-specific color schemes for UI
 */
export const PRAYER_COLORS: Record<
  LocalPrayerName,
  { light: string; dark: string }
> = {
  Subuh: { light: '#DCEFFB', dark: '#1E2A36' },
  Syuruk: { light: '#DCEFFB', dark: '#1E2A36' },
  Zohor: { light: '#FFF4D6', dark: '#332B1E' },
  Asar: { light: '#FFE3C8', dark: '#3A2A22' },
  Maghrib: { light: '#F9D0D3', dark: '#3A1F24' },
  Isyak: { light: '#D7D3F9', dark: '#272547' },
} as const;

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
  API: 'yyyy-MM-dd',
  FIREBASE: 'd/M/yyyy',
  DISPLAY: 'dd MMM yyyy',
  ISLAMIC_API: 'dd-MM-yyyy',
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const CACHE_KEYS = {
  PRAYER_TIMES: 'prayer_times',
  PRAYER_LOGS: 'prayer_logs',
  MONTHLY_TIMES: 'monthly_times',
  USER_LOCATION: 'user_location',
} as const;

export const CACHE_DURATION = {
  PRAYER_TIMES: 24 * 60 * 60 * 1000, // 24 hours
  LOCATION: 60 * 60 * 1000, // 1 hour
  MONTHLY: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// ============================================================================
// ISLAMIC CALENDAR
// ============================================================================

export const SINGAPORE_ISLAMIC_MONTHS: Record<number, string> = {
  1: 'Muharram',
  2: 'Safar',
  3: "Rabi'ul Awwal",
  4: "Rabi'ul Thani",
  5: 'Jamadil Awwal',
  6: 'Jamadil Thani',
  7: 'Rajab',
  8: "Sya'ban",
  9: 'Ramadan',
  10: 'Syawal',
  11: 'Zulkaedah',
  12: 'Zulhijjah',
} as const;

export const ENGLISH_TO_MONTH_NUMBER: Record<string, number> = {
  "Muharram'": 1,
  'Safar': 2,
  "Rabi' al-Awwal": 3,
  "Rabi' al-Thani": 3,
  "Rabi' al-awwal": 3,
  "Rabi' al-thani": 4,
  "Rabī' al-awwal": 3,
  "Rabī' al-thānī": 4,
  'Jumada al-Awwal': 5,
  'Jumada al-Thani': 6,
  'Jumada al-awwal': 5,
  'Jumada al-thani': 6,
  'Jumādā al-awwal': 5,
  'Jumādā al-thānī': 6,
  'Jumada Al-Ula': 5,
  'Jumada Al-Akhirah': 6,
  'Rajab': 7,
  "Sha'ban": 8,
  "Sha'bān": 8,
  'Ramadan': 9,
  'Ramaḍān': 9,
  'Shawwal': 10,
  'Shawwāl': 10,
  "Dhu al-Qi'dah": 11,
  "Dhū al-Qi'dah": 11,
  'Dhu al-Hijjah': 12,
  'Dhū al-Ḥijjah': 12,
} as const;

// ============================================================================
// LEGACY ENUM (for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use LocalPrayerName string literals instead
 * Kept for backwards compatibility with old code
 */
export enum PrayerName {
  SUBUH = 'Subuh',
  SYURUK = 'Syuruk',
  ZOHOR = 'Zohor',
  ASAR = 'Asar',
  MAGHRIB = 'Maghrib',
  ISYAK = 'Isyak',
}