/**
 * Ramadan Service Types
 *
 * Type definitions for Ramadan fasting tracker, tarawih logger,
 * Quran khatam tracker, and Ramadan schedule.
 * Uses Zod for runtime validation and type inference.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { z } from 'zod';

// ============================================================================
// RAMADAN YEAR IDENTIFIER
// ============================================================================

/** Ramadan is identified by its Hijri year (e.g., 1447 for 2026) */
export type RamadanYear = number;

// ============================================================================
// FASTING TRACKER
// ============================================================================

export const FastingStatusSchema = z.enum([
  'fasted',
  'missed',
  'excused',
  'not_logged',
]);
export type FastingStatus = z.infer<typeof FastingStatusSchema>;

export const MissedReasonSchema = z.enum([
  'illness',
  'travel',
  'menstruation',
  'other',
]);
export type MissedReason = z.infer<typeof MissedReasonSchema>;

export const FastingDayLogSchema = z.object({
  day: z.number().min(1).max(30),
  hijriDate: z.string(),
  gregorianDate: z.string(),
  status: FastingStatusSchema,
  missedReason: MissedReasonSchema.optional(),
  notes: z.string().optional(),
  loggedAt: z.string(),
  updatedAt: z.string(),
});
export type FastingDayLog = z.infer<typeof FastingDayLogSchema>;

// ============================================================================
// TARAWIH TRACKER
// ============================================================================

export const TarawihLocationSchema = z.enum(['mosque', 'home']);
export type TarawihLocation = z.infer<typeof TarawihLocationSchema>;

export const TarawihDayLogSchema = z.object({
  day: z.number().min(1).max(30),
  gregorianDate: z.string(),
  prayed: z.boolean(),
  location: TarawihLocationSchema.optional(),
  mosqueId: z.string().optional(),
  mosqueName: z.string().optional(),
  loggedAt: z.string(),
});
export type TarawihDayLog = z.infer<typeof TarawihDayLogSchema>;

// ============================================================================
// QURAN KHATAM TRACKER
// ============================================================================

export const QuranJuzLogSchema = z.object({
  juzNumber: z.number().min(1).max(30),
  completed: z.boolean(),
  pagesRead: z.number().min(0).max(20).default(0),
  completedDate: z.string().optional(),
  loggedAt: z.string(),
});
export type QuranJuzLog = z.infer<typeof QuranJuzLogSchema>;

// ============================================================================
// RAMADAN SCHEDULE (per day)
// ============================================================================

export interface RamadanDaySchedule {
  day: number;
  hijriDate: string;
  gregorianDate: string;
  imsak: string;
  subuh: string;
  syuruk: string;
  zohor: string;
  asar: string;
  maghrib: string;
  isyak: string;
  isSpecialNight: boolean;
  isLastTenNights: boolean;
  holidays: string[];
}

// ============================================================================
// RAMADAN TRACKER STATE (persisted in Zustand)
// ============================================================================

export interface RamadanTrackerState {
  ramadanYear: RamadanYear;
  ramadanStartGregorian: string;
  ramadanEndGregorian: string;
  totalDays: number;
  fastingLogs: Record<number, FastingDayLog>;
  tarawihLogs: Record<number, TarawihDayLog>;
  quranKhatamLogs: Record<number, QuranJuzLog>;
}

// ============================================================================
// COMPUTED STATS (derived, not persisted)
// ============================================================================

export interface RamadanStats {
  daysFasted: number;
  daysMissed: number;
  daysExcused: number;
  daysRemaining: number;
  qadaDaysNeeded: number;
  fastingStreak: number;
  longestFastingStreak: number;
  tarawihCompleted: number;
  tarawihAtMosque: number;
  tarawihAtHome: number;
  tarawihMissed: number;
  juzCompleted: number;
  totalPagesRead: number;
  quranProgress: number;
  currentRamadanDay: number;
  daysElapsed: number;
  overallScore: number;
}

// ============================================================================
// RAMADAN DETECTION
// ============================================================================

export interface RamadanDetectionResult {
  isRamadan: boolean;
  isApproaching: boolean;
  currentDay: number;
  daysUntilRamadan: number;
  ramadanYear: RamadanYear;
  startDate: string;
  endDate: string;
  hijriMonth: number;
  hijriMonthName: string;
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export interface RamadanNotificationPrefs {
  suhoorReminderEnabled: boolean;
  suhoorReminderMinutes: 30 | 45 | 60;
  iftarAlertEnabled: boolean;
  tarawihReminderEnabled: boolean;
  lastTenNightsEnabled: boolean;
  laylatulQadrEmphasis: boolean;
}

// ============================================================================
// DAILY DUA/HADITH CONTENT
// ============================================================================

export interface RamadanDailyContent {
  day: number;
  duaArabic: string;
  duaTransliteration: string;
  duaTranslation: string;
  hadith: string;
  hadithSource: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum RamadanErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  FIREBASE_ERROR = 'FIREBASE_ERROR',
  DETECTION_ERROR = 'DETECTION_ERROR',
  NOT_RAMADAN = 'NOT_RAMADAN',
}

export class RamadanServiceError extends Error {
  constructor(
    public code: RamadanErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'RamadanServiceError';
  }
}
