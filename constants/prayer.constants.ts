import { PrayerName } from '../utils/types/prayer.types'

export const PRAYER_NAMES = Object.values(PrayerName);

export const LOGGABLE_PRAYERS = PRAYER_NAMES.filter(
  prayer => prayer !== PrayerName.SYURUK
);

export const PRAYER_BACKGROUNDS = {
  [PrayerName.SUBUH]: {
    green: require('../assets/prayerBackgroundImages/subuhBackground.png'),
    purple: require('../assets/prayerBackgroundImages/subuhBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/subuhBackgroundBlue.png'),
  },
  [PrayerName.SYURUK]: {
    green: require('../assets/prayerBackgroundImages/subuhBackground.png'),
    purple: require('../assets/prayerBackgroundImages/subuhBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/subuhBackgroundBlue.png'),
  },
  [PrayerName.ZOHOR]: {
    green: require('../assets/prayerBackgroundImages/zuhurBackground.png'),
    purple: require('../assets/prayerBackgroundImages/zuhurBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/zuhurBackgroundBlue.png'),
  },
  [PrayerName.ASAR]: {
    green: require('../assets/prayerBackgroundImages/asarBackground.png'),
    purple: require('../assets/prayerBackgroundImages/asarBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/asarBackgroundBlue.png'),
  },
  [PrayerName.MAGHRIB]: {
    green: require('../assets/prayerBackgroundImages/maghribBackground.png'),
    purple: require('../assets/prayerBackgroundImages/maghribBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/maghribBackgroundBlue.png'),
  },
  [PrayerName.ISYAK]: {
    green: require('../assets/prayerBackgroundImages/isyaBackground.png'),
    purple: require('../assets/prayerBackgroundImages/isyaBackgroundPurple.png'),
    blue: require('../assets/prayerBackgroundImages/isyaBackgroundBlue.png'),
  },
} as const;

export type ThemeColor = 'green' | 'purple' | 'blue';

export const PRAYER_COLORS = {
  [PrayerName.SUBUH]: { light: '#DCEFFB', dark: '#1E2A36' },
  [PrayerName.ZOHOR]: { light: '#FFF4D6', dark: '#332B1E' },
  [PrayerName.ASAR]: { light: '#FFE3C8', dark: '#3A2A22' },
  [PrayerName.MAGHRIB]: { light: '#F9D0D3', dark: '#3A1F24' },
  [PrayerName.ISYAK]: { light: '#D7D3F9', dark: '#272547' },
} as const;

export const DATE_FORMATS = {
  API: 'yyyy-MM-dd',
  FIREBASE: 'd/M/yyyy',
  DISPLAY: 'dd MMM yyyy',
  ISLAMIC_API: 'dd-MM-yyyy',
} as const;

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