/**
 * Ramadan Store (Zustand + MMKV)
 *
 * Manages Ramadan tracking state:
 * - Fasting logs (30 days)
 * - Tarawih logs (30 nights)
 * - Quran khatam progress (30 juz)
 * - Notification preferences
 * - Prompt/summary tracking
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';
import { createLogger } from '../services/logging/logger';
import type {
  RamadanYear,
  RamadanTrackerState,
  FastingDayLog,
  FastingStatus,
  MissedReason,
  TarawihDayLog,
  TarawihLocation,
  QuranJuzLog,
  RamadanNotificationPrefs,
} from '../api/services/ramadan/types';
import { DEFAULT_RAMADAN_NOTIFICATION_PREFS } from '../api/services/ramadan/types/constants';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('Ramadan Store');

// ============================================================================
// TYPES
// ============================================================================

interface RamadanStoreState {
  // State
  tracker: RamadanTrackerState | null;
  notificationPrefs: RamadanNotificationPrefs;
  hasSeenRamadanPrompt: boolean;
  hasSeenSummary: boolean;

  // Initialization
  initializeRamadan: (
    year: RamadanYear,
    startDate: string,
    endDate: string,
    totalDays: number
  ) => void;

  // Fasting
  logFastingDay: (
    day: number,
    gregorianDate: string,
    hijriDate: string,
    status: FastingStatus,
    missedReason?: MissedReason,
    notes?: string
  ) => void;
  updateFastingDay: (day: number, updates: Partial<FastingDayLog>) => void;

  // Tarawih
  logTarawihDay: (
    day: number,
    gregorianDate: string,
    prayed: boolean,
    location?: TarawihLocation,
    mosqueId?: string,
    mosqueName?: string
  ) => void;
  updateTarawihDay: (day: number, updates: Partial<TarawihDayLog>) => void;

  // Quran Khatam
  logJuzProgress: (juzNumber: number, pagesRead: number) => void;
  markJuzComplete: (juzNumber: number) => void;
  unmarkJuzComplete: (juzNumber: number) => void;

  // Notification prefs
  updateNotificationPrefs: (prefs: Partial<RamadanNotificationPrefs>) => void;

  // Prompt tracking
  markRamadanPromptSeen: () => void;
  markSummarySeen: () => void;

  // Restore from Firebase
  restoreTracker: (tracker: RamadanTrackerState) => void;

  // Reset
  resetRamadanData: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useRamadanStore = create<RamadanStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      tracker: null,
      notificationPrefs: DEFAULT_RAMADAN_NOTIFICATION_PREFS,
      hasSeenRamadanPrompt: false,
      hasSeenSummary: false,

      // ======================================================================
      // INITIALIZATION
      // ======================================================================

      initializeRamadan: (year, startDate, endDate, totalDays) => {
        const existing = get().tracker;

        // Don't reinitialize if same year already exists
        if (existing && existing.ramadanYear === year) {
          logger.debug('Ramadan already initialized for this year', {
            year,
            existingDays: Object.keys(existing.fastingLogs).length,
          });
          return;
        }

        logger.info('Initializing Ramadan tracker', {
          year,
          startDate,
          endDate,
          totalDays,
        });

        set({
          tracker: {
            ramadanYear: year,
            ramadanStartGregorian: startDate,
            ramadanEndGregorian: endDate,
            totalDays,
            fastingLogs: {},
            tarawihLogs: {},
            quranKhatamLogs: {},
          },
        });
      },

      // ======================================================================
      // FASTING ACTIONS
      // ======================================================================

      logFastingDay: (day, gregorianDate, hijriDate, status, missedReason, notes) => {
        set((state) => {
          if (!state.tracker) {
            logger.warn('Cannot log fasting: Ramadan not initialized');
            return state;
          }

          const now = new Date().toISOString();
          const log: FastingDayLog = {
            day,
            hijriDate,
            gregorianDate,
            status,
            missedReason,
            notes,
            loggedAt: now,
            updatedAt: now,
          };

          logger.info('Fasting day logged', {
            day,
            status,
            missedReason,
            gregorianDate,
          });

          return {
            tracker: {
              ...state.tracker,
              fastingLogs: {
                ...state.tracker.fastingLogs,
                [day]: log,
              },
            },
          };
        });
      },

      updateFastingDay: (day, updates) => {
        set((state) => {
          if (!state.tracker || !state.tracker.fastingLogs[day]) {
            logger.warn('Cannot update fasting: Day not found', { day });
            return state;
          }

          logger.info('Fasting day updated', { day, updates: Object.keys(updates) });

          return {
            tracker: {
              ...state.tracker,
              fastingLogs: {
                ...state.tracker.fastingLogs,
                [day]: {
                  ...state.tracker.fastingLogs[day],
                  ...updates,
                  updatedAt: new Date().toISOString(),
                },
              },
            },
          };
        });
      },

      // ======================================================================
      // TARAWIH ACTIONS
      // ======================================================================

      logTarawihDay: (day, gregorianDate, prayed, location, mosqueId, mosqueName) => {
        set((state) => {
          if (!state.tracker) {
            logger.warn('Cannot log tarawih: Ramadan not initialized');
            return state;
          }

          const log: TarawihDayLog = {
            day,
            gregorianDate,
            prayed,
            location,
            mosqueId,
            mosqueName,
            loggedAt: new Date().toISOString(),
          };

          logger.info('Tarawih day logged', {
            day,
            prayed,
            location,
            mosqueName,
          });

          return {
            tracker: {
              ...state.tracker,
              tarawihLogs: {
                ...state.tracker.tarawihLogs,
                [day]: log,
              },
            },
          };
        });
      },

      updateTarawihDay: (day, updates) => {
        set((state) => {
          if (!state.tracker || !state.tracker.tarawihLogs[day]) {
            logger.warn('Cannot update tarawih: Day not found', { day });
            return state;
          }

          logger.info('Tarawih day updated', { day, updates: Object.keys(updates) });

          return {
            tracker: {
              ...state.tracker,
              tarawihLogs: {
                ...state.tracker.tarawihLogs,
                [day]: {
                  ...state.tracker.tarawihLogs[day],
                  ...updates,
                },
              },
            },
          };
        });
      },

      // ======================================================================
      // QURAN KHATAM ACTIONS
      // ======================================================================

      logJuzProgress: (juzNumber, pagesRead) => {
        set((state) => {
          if (!state.tracker) {
            logger.warn('Cannot log juz: Ramadan not initialized');
            return state;
          }

          const existing = state.tracker.quranKhatamLogs[juzNumber];
          const log: QuranJuzLog = {
            juzNumber,
            completed: existing?.completed ?? pagesRead >= 20,
            pagesRead,
            completedDate: pagesRead >= 20 ? new Date().toISOString() : existing?.completedDate,
            loggedAt: new Date().toISOString(),
          };

          logger.info('Juz progress logged', {
            juzNumber,
            pagesRead,
            completed: log.completed,
          });

          return {
            tracker: {
              ...state.tracker,
              quranKhatamLogs: {
                ...state.tracker.quranKhatamLogs,
                [juzNumber]: log,
              },
            },
          };
        });
      },

      markJuzComplete: (juzNumber) => {
        set((state) => {
          if (!state.tracker) {
            logger.warn('Cannot mark juz: Ramadan not initialized');
            return state;
          }

          const existing = state.tracker.quranKhatamLogs[juzNumber];
          const log: QuranJuzLog = {
            juzNumber,
            completed: true,
            pagesRead: existing?.pagesRead ?? 20,
            completedDate: new Date().toISOString(),
            loggedAt: existing?.loggedAt ?? new Date().toISOString(),
          };

          logger.info('Juz marked complete', { juzNumber });

          return {
            tracker: {
              ...state.tracker,
              quranKhatamLogs: {
                ...state.tracker.quranKhatamLogs,
                [juzNumber]: log,
              },
            },
          };
        });
      },

      unmarkJuzComplete: (juzNumber) => {
        set((state) => {
          if (!state.tracker || !state.tracker.quranKhatamLogs[juzNumber]) {
            logger.warn('Cannot unmark juz: Not found', { juzNumber });
            return state;
          }

          logger.info('Juz unmarked', { juzNumber });

          return {
            tracker: {
              ...state.tracker,
              quranKhatamLogs: {
                ...state.tracker.quranKhatamLogs,
                [juzNumber]: {
                  ...state.tracker.quranKhatamLogs[juzNumber],
                  completed: false,
                  completedDate: undefined,
                },
              },
            },
          };
        });
      },

      // ======================================================================
      // NOTIFICATION PREFERENCES
      // ======================================================================

      updateNotificationPrefs: (prefs) => {
        logger.info('Ramadan notification prefs updated', {
          updates: Object.keys(prefs),
        });
        set((state) => ({
          notificationPrefs: {
            ...state.notificationPrefs,
            ...prefs,
          },
        }));
      },

      // ======================================================================
      // PROMPT TRACKING
      // ======================================================================

      markRamadanPromptSeen: () => {
        logger.info('Ramadan prompt marked as seen');
        set({ hasSeenRamadanPrompt: true });
      },

      markSummarySeen: () => {
        logger.info('Ramadan summary marked as seen');
        set({ hasSeenSummary: true });
      },

      // ======================================================================
      // RESTORE FROM FIREBASE
      // ======================================================================

      restoreTracker: (tracker) => {
        const existing = get().tracker;
        const existingCount = existing
          ? Object.keys(existing.fastingLogs).length +
            Object.keys(existing.tarawihLogs).length
          : 0;
        const incomingCount =
          Object.keys(tracker.fastingLogs).length +
          Object.keys(tracker.tarawihLogs).length;

        // Only restore if Firebase has more data than local
        if (existing && existingCount >= incomingCount) {
          logger.debug('Skipping restore: local data is equal or newer', {
            localCount: existingCount,
            firebaseCount: incomingCount,
          });
          return;
        }

        logger.info('Restoring tracker from Firebase', {
          year: tracker.ramadanYear,
          fastingDays: Object.keys(tracker.fastingLogs).length,
          tarawihDays: Object.keys(tracker.tarawihLogs).length,
        });

        set({ tracker });
      },

      // ======================================================================
      // RESET
      // ======================================================================

      resetRamadanData: () => {
        const tracker = get().tracker;
        logger.info('Ramadan data reset', {
          hadTracker: !!tracker,
          year: tracker?.ramadanYear,
          fastingDays: tracker ? Object.keys(tracker.fastingLogs).length : 0,
        });

        set({
          tracker: null,
          hasSeenRamadanPrompt: false,
          hasSeenSummary: false,
        });
      },
    }),
    {
      name: 'ramadan',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = defaultStorage.getString(name);
          return value ?? null;
        },
        setItem: (name, value) => {
          defaultStorage.setString(name, value);
        },
        removeItem: (name) => {
          defaultStorage.delete(name);
        },
      })),
      partialize: (state) => ({
        tracker: state.tracker,
        notificationPrefs: state.notificationPrefs,
        hasSeenRamadanPrompt: state.hasSeenRamadanPrompt,
        hasSeenSummary: state.hasSeenSummary,
      }),
      version: 1,
      onRehydrateStorage: () => {
        logger.debug('Hydrating Ramadan store from MMKV');

        return (state, error) => {
          if (error) {
            logger.error('Hydration failed', { error });
          } else if (state) {
            logger.success('Hydration complete', {
              hasTracker: !!state.tracker,
              year: state.tracker?.ramadanYear,
              fastingDays: state.tracker
                ? Object.keys(state.tracker.fastingLogs).length
                : 0,
              tarawihDays: state.tracker
                ? Object.keys(state.tracker.tarawihLogs).length
                : 0,
              juzCompleted: state.tracker
                ? Object.values(state.tracker.quranKhatamLogs).filter((j) => j.completed).length
                : 0,
            });
          }
        };
      },
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

// Stable empty objects to avoid infinite re-render loops from `?? {}`
const EMPTY_FASTING_LOGS: Record<number, FastingDayLog> = {};
const EMPTY_TARAWIH_LOGS: Record<number, TarawihDayLog> = {};
const EMPTY_QURAN_LOGS: Record<number, QuranJuzLog> = {};

export const useRamadanTracker = () => useRamadanStore((s) => s.tracker);
export const useRamadanNotifPrefs = () => useRamadanStore((s) => s.notificationPrefs);
export const useFastingLogs = () =>
  useRamadanStore((s) => s.tracker?.fastingLogs ?? EMPTY_FASTING_LOGS);
export const useTarawihLogs = () =>
  useRamadanStore((s) => s.tracker?.tarawihLogs ?? EMPTY_TARAWIH_LOGS);
export const useQuranKhatamLogs = () =>
  useRamadanStore((s) => s.tracker?.quranKhatamLogs ?? EMPTY_QURAN_LOGS);
export const useHasSeenRamadanPrompt = () =>
  useRamadanStore((s) => s.hasSeenRamadanPrompt);
export const useHasSeenSummary = () => useRamadanStore((s) => s.hasSeenSummary);
