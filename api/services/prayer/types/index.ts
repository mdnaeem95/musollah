/**
 * Prayer Service Types
 * 
 * Consolidated type definitions for prayer times, logs, and related entities.
 * Uses Zod for runtime validation and type inference.
 * 
 * @version 3.0
 * @since 2025-12-22
 */

import { z } from 'zod';

// ============================================================================
// PRAYER NAMES (Standardized)
// ============================================================================

/**
 * Prayer names in both English (Aladhan API) and Malay (Singapore)
 */
export const PRAYER_NAME_MAP = {
  // API format → Local format
  Fajr: 'Subuh',
  Sunrise: 'Syuruk',
  Dhuhr: 'Zohor',
  Asr: 'Asar',
  Maghrib: 'Maghrib',
  Isha: 'Isyak',
} as const;

export type ApiPrayerName = keyof typeof PRAYER_NAME_MAP;
export type LocalPrayerName = (typeof PRAYER_NAME_MAP)[ApiPrayerName];

/**
 * All valid prayer names (loggable prayers exclude Syuruk)
 */
export type PrayerName = LocalPrayerName;
export type LoggablePrayerName = Exclude<LocalPrayerName, 'Syuruk'>;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Time string schema (HH:MM or HH:MM:SS format)
 */
export const TimeStringSchema = z
  .string()
  .regex(/^\d{1,2}:\d{2}(:\d{2})?(\s*\([A-Z]+\))?$/, 'Invalid time format');

/**
 * Coordinates schema
 */
export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Prayer timings schema (Aladhan API format)
 */
export const PrayerTimingsSchema = z.object({
  Fajr: TimeStringSchema,
  Sunrise: TimeStringSchema,
  Dhuhr: TimeStringSchema,
  Asr: TimeStringSchema,
  Maghrib: TimeStringSchema,
  Isha: TimeStringSchema,
  // Optional metadata fields
  Imsak: TimeStringSchema.optional(),
  Midnight: TimeStringSchema.optional(),
  Firstthird: TimeStringSchema.optional(),
  Lastthird: TimeStringSchema.optional(),
});

/**
 * Local prayer times schema (Firebase/Singapore format)
 */
export const LocalPrayerTimesSchema = z.object({
  subuh: TimeStringSchema,
  syuruk: TimeStringSchema,
  zohor: TimeStringSchema,
  asar: TimeStringSchema,
  maghrib: TimeStringSchema,
  isyak: TimeStringSchema,
});

/**
 * Prayer log schema
 */
export const PrayerLogSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  prayers: z.object({
    Subuh: z.boolean(),
    Zohor: z.boolean(),
    Asar: z.boolean(),
    Maghrib: z.boolean(),
    Isyak: z.boolean(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Aladhan API response schema
 */
export const AladhanResponseSchema = z.object({
  code: z.number(),
  status: z.string(),
  data: z.object({
    timings: PrayerTimingsSchema,
    date: z.object({
      readable: z.string(),
      timestamp: z.string(),
      gregorian: z.object({
        date: z.string(),
        format: z.string(),
        day: z.string(),
        weekday: z.object({
          en: z.string(),
        }),
        month: z.object({
          number: z.number(),
          en: z.string(),
        }),
        year: z.string(),
        designation: z.object({
          abbreviated: z.string(),
          expanded: z.string(),
        }),
      }),
      hijri: z.object({
        date: z.string(),
        format: z.string(),
        day: z.string(),
        weekday: z.object({
          en: z.string(),
          ar: z.string().optional(),
        }),
        month: z.object({
          number: z.number(),
          en: z.string(),
          ar: z.string().optional(),
        }),
        year: z.string(),
        designation: z.object({
          abbreviated: z.string(),
          expanded: z.string(),
        }),
        holidays: z.array(z.string()).optional(),
      }),
    }),
    meta: z.object({
      latitude: z.number(),
      longitude: z.number(),
      timezone: z.string(),
      method: z.object({
        id: z.number(),
        name: z.string(),
        params: z.object({
          Fajr: z.number(),
          Isha: z.union([z.number(), z.string()]),
        }),
      }),
      latitudeAdjustmentMethod: z.string(),
      midnightMode: z.string(),
      school: z.string(),
      offset: z.record(z.string(), z.number()),
    }),
  }),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type Coordinates = z.infer<typeof CoordinatesSchema>;
export type PrayerTimings = z.infer<typeof PrayerTimingsSchema>;
export type LocalPrayerTimes = z.infer<typeof LocalPrayerTimesSchema>;
export type PrayerLog = z.infer<typeof PrayerLogSchema>;
export type AladhanResponse = z.infer<typeof AladhanResponseSchema>;

// ============================================================================
// NORMALIZED TYPES (Universal Format)
// ============================================================================

/**
 * Normalized prayer times (used throughout app)
 * Consistent format regardless of source (Aladhan or Firebase)
 */
export interface NormalizedPrayerTimes {
  date: string; // YYYY-MM-DD
  subuh: string;
  syuruk: string;
  zohor: string;
  asar: string;
  maghrib: string;
  isyak: string;
}

/**
 * Daily prayer time with metadata
 */
export interface DailyPrayerTime extends NormalizedPrayerTimes {
  hijriDate?: string;
  location?: Coordinates;
  source: 'aladhan' | 'firebase';
}

/**
 * Prayer statistics
 */
export interface PrayerStats {
  totalPrayers: number;
  completedPrayers: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-100
  lastUpdated: string; // ISO timestamp
}

/**
 * Prayer availability (for logging UI)
 */
export interface PrayerAvailability {
  name: PrayerName;
  time: string;
  isAvailable: boolean;
  isPast: boolean;
  isCurrent: boolean;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Prayer times request params
 */
export interface PrayerTimesParams {
  latitude: number;
  longitude: number;
  date?: string; // DD-MM-YYYY (Aladhan format)
  method?: number; // Calculation method
  school?: 0 | 1; // 0 = Shafi, 1 = Hanafi
}

/**
 * Islamic date conversion response
 */
export interface IslamicDateConversion {
  gregorian: string;
  hijri: {
    date: string;
    day: string;
    month: string;
    year: string;
    formatted: string; // e.g., "15 Ramadan 1446"
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Typed errors for prayer service
 */
export enum PrayerErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  FIREBASE_ERROR = 'FIREBASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  LOCATION_ERROR = 'LOCATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export class PrayerServiceError extends Error {
  constructor(
    public code: PrayerErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PrayerServiceError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard for prayer names
 */
export function isPrayerName(value: unknown): value is PrayerName {
  return (
    typeof value === 'string' &&
    Object.values(PRAYER_NAME_MAP).includes(value as LocalPrayerName)
  );
}

/**
 * Type guard for loggable prayer names
 */
export function isLoggablePrayerName(value: unknown): value is LoggablePrayerName {
  return isPrayerName(value) && value !== 'Syuruk';
}

/**
 * Validate and parse prayer log
 */
export function parsePrayerLog(data: unknown): PrayerLog {
  return PrayerLogSchema.parse(data);
}

/**
 * Validate and parse Aladhan response
 */
export function parseAladhanResponse(data: unknown): AladhanResponse {
  return AladhanResponseSchema.parse(data);
}