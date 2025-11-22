// ============================================================================
// PRAYER TIMES
// ============================================================================

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface PrayerDate {
  readable: string;
  timestamp: string;
  gregorian: GregorianDate;
  hijri: HijriDate;
}

export interface GregorianDate {
  date: string;
  format: string;
  day: string;
  weekday: WeekdayInfo;
  month: MonthInfo;
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
}

export interface HijriDate {
  date: string;
  format: string;
  day: string;
  weekday: WeekdayInfo;
  month: MonthInfo;
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
  holidays?: string[];
}

export interface WeekdayInfo {
  en: string;
  ar?: string;
}

export interface MonthInfo {
  number: number;
  en: string;
  ar?: string;
}

export interface Meta {
  latitude: number;
  longitude: number;
  timezone: string;
  method: Method;
  latitudeAdjustmentMethod: string;
  midnightMode: string;
  school: string;
  offset: Record<string, number>;
}

export interface Method {
  id: number;
  name: string;
  params: {
    Fajr: number;
    Isha: number | string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface PrayerTimesData {
  timings: PrayerTimings;
  date: PrayerDate;
  meta: Meta;
}

export interface PrayerTimesResponse {
  code: number;
  status: string;
  data: PrayerTimesData;
}

// ============================================================================
// ISLAMIC DATE
// ============================================================================

export interface IslamicDateConversion {
  hijri: {
    date: string;
    format: string;
    day: string;
    weekday: WeekdayInfo;
    month: MonthInfo;
    year: string;
    designation: {
      abbreviated: string;
      expanded: string;
    };
    holidays: string[];
  };
  gregorian: {
    date: string;
    format: string;
    day: string;
    weekday: WeekdayInfo;
    month: MonthInfo;
    year: string;
    designation: {
      abbreviated: string;
      expanded: string;
    };
  };
}

export interface IslamicDateResponse {
  code: number;
  status: string;
  data: IslamicDateConversion;
}

// ============================================================================
// MONTHLY PRAYER TIMES (Local Format)
// ============================================================================

export interface DailyPrayerTime {
  date: string; // Format: "1/1/2025" or just "1"
  day?: number;
  subuh: string; // Fajr
  syuruk: string; // Sunrise
  zohor: string; // Dhuhr
  asar: string; // Asr
  maghrib: string; // Maghrib
  isyak: string; // Isha
}

export interface MonthlyPrayerTimes {
  month: number;
  year: number;
  prayers: DailyPrayerTime[];
}

// ============================================================================
// NORMALIZED PRAYER NAMES
// ============================================================================

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface NormalizedPrayerTimes {
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

// ============================================================================
// LOCATION & CALCULATION PARAMS
// ============================================================================

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface PrayerTimesParams extends LocationCoordinates {
  method?: number; // Calculation method (1-15)
  school?: 0 | 1; // 0 = Shafi, 1 = Hanafi
  date?: string; // Format: DD-MM-YYYY
}

// ============================================================================
// CALCULATION METHODS
// ============================================================================

export enum CalculationMethod {
  MAKKAH = 1,
  ISNA = 2,
  MUSLIM_WORLD_LEAGUE = 3,
  UMM_AL_QURA = 4,
  EGYPTIAN = 5,
  KARACHI = 7,
  TEHRAN = 8,
  JAFARI = 9,
  SINGAPORE = 11,
  TURKEY = 13,
  DUBAI = 15,
}

// ============================================================================
// PRAYER LOG
// ============================================================================

export interface PrayerLog {
  id: string;
  userId: string;
  date: string; // ISO date string
  prayer: PrayerName;
  timestamp: number;
  location?: LocationCoordinates;
  notes?: string;
}

// ============================================================================
// QUERY KEYS (for TanStack Query)
// ============================================================================

export const PRAYER_QUERY_KEYS = {
  all: ['prayers'] as const,
  times: (params: PrayerTimesParams) => 
    ['prayers', 'times', params] as const,
  daily: (date: string, location: LocationCoordinates) => 
    ['prayers', 'daily', date, location] as const,
  monthly: (year: number, month: number) => 
    ['prayers', 'monthly', year, month] as const,
  islamicDate: (date: string) => 
    ['prayers', 'islamic-date', date] as const,
  logs: (userId: string) => 
    ['prayers', 'logs', userId] as const,
} as const;