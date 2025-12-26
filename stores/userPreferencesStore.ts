/**
 * Preferences Store (REFACTORED WITH STRUCTURED LOGGING)
 * 
 * Manages user preferences and app settings.
 * Replaces Redux userPreferencesSlice with Zustand.
 * 
 * Features:
 * - Theme selection (green/blue/purple)
 * - Dark mode toggle
 * - Text size customization
 * - Reciter selection
 * - Time format (12/24 hour)
 * - Adhan selection
 * - Prayer notifications
 * - Ramadan mode
 * - MMKV persistence
 * 
 * @version 2.0
 * @refactored 2025-12-23
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';
import { createLogger } from '../services/logging/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('Preferences');

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'green' | 'blue' | 'purple';
export type TimeFormat = '12-hour' | '24-hour';
export type AdhanSelection = 'Ahmad Al-Nafees' | 'Mishary Rashid Alafasy' | 'None';

interface PreferencesState {
  // State
  theme: Theme;
  isDarkMode: boolean;
  textSize: number;
  reciter: string;
  timeFormat: TimeFormat;
  reminderInterval: number;
  selectedAdhan: AdhanSelection;
  mutedNotifications: string[];
  ramadanMode: boolean;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
  setTextSize: (size: number) => void;
  setReciter: (reciter: string) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setReminderInterval: (interval: number) => void;
  toggleTimeFormat: () => void;
  setSelectedAdhan: (adhan: AdhanSelection) => void;
  toggleNotificationForPrayer: (prayer: string) => void;
  toggleRamadanMode: () => void;
  resetPreferences: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  theme: 'green' as Theme,
  isDarkMode: false,
  textSize: 30,
  reciter: 'ar.alafasy',
  timeFormat: '12-hour' as TimeFormat,
  reminderInterval: 0,
  selectedAdhan: 'None' as AdhanSelection,
  mutedNotifications: [],
  ramadanMode: false,
};

// ============================================================================
// STORE
// ============================================================================

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,
      
      // ========================================================================
      // APPEARANCE ACTIONS
      // ========================================================================
      
      setTheme: (theme) => {
        logger.info('Theme changed', {
          oldTheme: get().theme,
          newTheme: theme,
        });
        
        set({ theme });
      },
      
      toggleDarkMode: () => {
        set((state) => {
          const newMode = !state.isDarkMode;
          
          logger.info('Dark mode toggled', {
            oldMode: state.isDarkMode,
            newMode,
          });
          
          return { isDarkMode: newMode };
        });
      },
      
      setTextSize: (textSize) => {
        const oldSize = get().textSize;
        
        logger.info('Text size changed', {
          oldSize,
          newSize: textSize,
          change: textSize > oldSize ? 'increased' : 'decreased',
        });
        
        set({ textSize });
      },
      
      // ========================================================================
      // QURAN ACTIONS
      // ========================================================================
      
      setReciter: (reciter) => {
        logger.info('Reciter changed', {
          oldReciter: get().reciter,
          newReciter: reciter,
        });
        
        set({ reciter });
      },
      
      // ========================================================================
      // PRAYER ACTIONS
      // ========================================================================
      
      setTimeFormat: (timeFormat) => {
        logger.info('Time format changed', {
          oldFormat: get().timeFormat,
          newFormat: timeFormat,
        });
        
        set({ timeFormat });
      },
      
      toggleTimeFormat: () => {
        set((state) => {
          const newFormat = state.timeFormat === '12-hour' ? '24-hour' : '12-hour';
          
          logger.info('Time format toggled', {
            oldFormat: state.timeFormat,
            newFormat,
          });
          
          return { timeFormat: newFormat };
        });
      },
      
      setReminderInterval: (reminderInterval) => {
        logger.info('Reminder interval changed', {
          oldInterval: get().reminderInterval,
          newInterval: reminderInterval,
          unit: 'minutes',
        });
        
        set({ reminderInterval });
      },
      
      setSelectedAdhan: (selectedAdhan) => {
        logger.info('Adhan selection changed', {
          oldAdhan: get().selectedAdhan,
          newAdhan: selectedAdhan,
        });
        
        set({ selectedAdhan });
      },
      
      toggleNotificationForPrayer: (prayer) => {
        set((state) => {
          const isMuted = state.mutedNotifications.includes(prayer);
          const newMutedNotifications = isMuted
            ? state.mutedNotifications.filter((p) => p !== prayer)
            : [...state.mutedNotifications, prayer];
          
          logger.info(`Prayer notification toggled`, {
            prayer,
            action: isMuted ? 'unmuted' : 'muted',
            totalMuted: newMutedNotifications.length,
            mutedPrayers: newMutedNotifications,
          });
          
          return { mutedNotifications: newMutedNotifications };
        });
      },
      
      // ========================================================================
      // RAMADAN ACTIONS
      // ========================================================================
      
      toggleRamadanMode: () => {
        set((state) => {
          const newMode = !state.ramadanMode;
          
          logger.info('Ramadan mode toggled', {
            oldMode: state.ramadanMode,
            newMode,
          });
          
          return { ramadanMode: newMode };
        });
      },
      
      // ========================================================================
      // RESET ACTIONS
      // ========================================================================
      
      resetPreferences: () => {
        const currentState = get();
        
        logger.info('Preferences reset to defaults', {
          changedSettings: {
            theme: currentState.theme !== initialState.theme,
            darkMode: currentState.isDarkMode !== initialState.isDarkMode,
            textSize: currentState.textSize !== initialState.textSize,
            reciter: currentState.reciter !== initialState.reciter,
            timeFormat: currentState.timeFormat !== initialState.timeFormat,
            reminderInterval: currentState.reminderInterval !== initialState.reminderInterval,
            adhan: currentState.selectedAdhan !== initialState.selectedAdhan,
            mutedCount: currentState.mutedNotifications.length,
            ramadanMode: currentState.ramadanMode !== initialState.ramadanMode,
          },
        });
        
        set(initialState);
      },
    }),
    {
      name: 'preferences', // Storage key
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
      version: 1,
      // Migration logic
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          logger.warn('Migrating preferences from version 0 to 1');
          // Migration logic if needed
        }
        return persistedState as PreferencesState;
      },
      // Log store hydration
      onRehydrateStorage: () => {
        logger.debug('Hydrating preferences from MMKV');
        
        return (state, error) => {
          if (error) {
            logger.error('Hydration failed', { error: error });
          } else if (state) {
            logger.success('Hydration complete', {
              theme: state.theme,
              isDarkMode: state.isDarkMode,
              textSize: state.textSize,
              timeFormat: state.timeFormat,
              adhan: state.selectedAdhan,
              mutedPrayers: state.mutedNotifications.length,
              ramadanMode: state.ramadanMode,
            });
          }
        };
      },
    }
  )
);

// ============================================================================
// SELECTORS (for performance optimization)
// ============================================================================

/**
 * Select only theme - component only re-renders when theme changes
 */
export const useTheme = () => usePreferencesStore((state) => state.theme);

/**
 * Select only dark mode - component only re-renders when dark mode changes
 */
export const useDarkMode = () => usePreferencesStore((state) => state.isDarkMode);

/**
 * Select only text size - component only re-renders when text size changes
 */
export const useTextSize = () => usePreferencesStore((state) => state.textSize);

/**
 * Select only time format - component only re-renders when time format changes
 */
export const useTimeFormat = () => usePreferencesStore((state) => state.timeFormat);

/**
 * Select only Ramadan mode - component only re-renders when Ramadan mode changes
 */
export const useRamadanMode = () => usePreferencesStore((state) => state.ramadanMode);

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Get current theme colors based on theme selection
 */
export const useThemeColors = () => {
  const theme = useTheme();
  
  const themeColors = {
    green: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399',
    },
    blue: {
      primary: '#3B82F6',
      secondary: '#2563EB',
      accent: '#60A5FA',
    },
    purple: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#A78BFA',
    },
  };
  
  return themeColors[theme];
};

/**
 * Check if a prayer notification is muted
 */
export const useIsPrayerMuted = (prayer: string) => {
  return usePreferencesStore(
    (state) => state.mutedNotifications.includes(prayer)
  );
};