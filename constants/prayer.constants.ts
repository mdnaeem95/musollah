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