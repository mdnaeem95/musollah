// utils/types/prayer.types.ts
export interface PrayerTime {
    name: PrayerName;
    time: string; // HH:mm format
    adhanTime?: string; // Optional different adhan time
    iqamaTime?: string; // Optional iqama time
  }
  
  export enum PrayerName {
    SUBUH = 'Subuh',
    SYURUK = 'Syuruk',
    ZOHOR = 'Zohor',
    ASAR = 'Asar',
    MAGHRIB = 'Maghrib',
    ISYAK = 'Isyak'
  }
  
  export interface DailyPrayerTimes {
    date: string; // ISO date string
    hijriDate: string;
    prayers: Record<PrayerName, string>;
    location?: {
      latitude: number;
      longitude: number;
      city: string;
      country: string;
    };
  }
  
  export interface PrayerLog {
    userId: string;
    date: string; // ISO date string
    prayers: Partial<Record<Exclude<PrayerName, PrayerName.SYURUK>, boolean>>;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface IslamicDate {
    day: number;
    month: string;
    year: number;
    formatted: string;
  }
  
  export interface PrayerNotificationSettings {
    enabled: boolean;
    reminderMinutes: number;
    selectedAdhan: string;
    mutedPrayers: PrayerName[];
  }
  
  export interface PrayerStats {
    totalPrayers: number;
    completedPrayers: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  }

  // Type guards
export const isPrayerName = (value: string): value is PrayerName => {
  return Object.values(PrayerName).includes(value as PrayerName);
};

export const validatePrayerNames = (values: string[]): PrayerName[] => {
  return values.filter(isPrayerName) as PrayerName[];
};