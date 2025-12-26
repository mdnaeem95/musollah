/**
 * Prayer Settings Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Audio preview tracking and settings monitoring
 * 
 * Business logic for prayer settings screen.
 * Handles time format, reminders, adhan selection, and notifications.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { usePreferencesStore, type AdhanSelection } from '../../stores/userPreferencesStore';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Prayer Settings');

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type AdhanOption = {
  id: number;
  label: 'None' | 'Ahmad Al-Nafees' | 'Mishary Rashid Alafasy';
  file: any; // AudioSource-compatible (require(...) or { uri })
};

export const ADHAN_OPTIONS: AdhanOption[] = [
  { id: 1, label: 'None', file: null },
  { id: 2, label: 'Ahmad Al-Nafees', file: require('../../assets/adhans/ahmadAlNafees.mp3') },
  { id: 3, label: 'Mishary Rashid Alafasy', file: require('../../assets/adhans/mishary.mp3') },
];

// Map UI label -> store enum
const labelToSelection: Record<AdhanOption['label'], AdhanSelection> = {
  None: 'None',
  'Ahmad Al-Nafees': 'Ahmad Al-Nafees',
  'Mishary Rashid Alafasy': 'Mishary Rashid Alafasy',
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for prayer settings page
 * Manages time format, reminders, adhan selection, and notifications
 * 
 * @returns {Object} Prayer settings state and actions
 */
export function usePrayerSettings() {
  const router = useRouter();

  // Modal state
  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState(false);

  // Audio state (expo-audio)
  const [previewSource, setPreviewSource] = useState<any | null>(null);
  const [previewOptionId, setPreviewOptionId] = useState<number | null>(null);

  // Create a player that rebinds when source changes
  const player = useAudioPlayer(previewSource);
  const playerStatus = useAudioPlayerStatus(player);

  const isPlayingAdhan = !!playerStatus?.playing;

  // Preferences store
  const {
    timeFormat,
    reminderInterval,
    selectedAdhan,
    mutedNotifications,
    toggleTimeFormat,
    setReminderInterval,
    setSelectedAdhan,
    toggleNotificationForPrayer,
  } = usePreferencesStore();

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Prayer settings hook mounted', {
      timeFormat,
      reminderInterval,
      selectedAdhan,
      mutedNotificationsCount: mutedNotifications.length,
      mutedPrayers: mutedNotifications,
    });
    
    return () => {
      logger.debug('Prayer settings hook unmounted', {
        wasPlayingAdhan: isPlayingAdhan,
      });
    };
  }, []);

  // ============================================================================
  // AUDIO SETUP
  // ============================================================================

  useEffect(() => {
    logger.debug('Configuring audio mode...');

    // Configure global audio behavior (expo-audio)
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionModeAndroid: 'duckOthers',
      interruptionMode: 'mixWithOthers',
    })
      .then(() => {
        logger.success('Audio mode configured', {
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
      })
      .catch((error) => {
        logger.error('Failed to configure audio mode', error as Error);
      });
  }, []);

  // When preview source changes, restart from 0 and play
  useEffect(() => {
    if (!previewSource) return;

    logger.debug('Starting adhan preview', {
      optionId: previewOptionId,
    });

    try {
      player.seekTo(0);
      player.play();
      logger.success('Adhan preview started');
    } catch (e) {
      logger.error('Failed to autoplay preview', e as Error, {
        optionId: previewOptionId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSource]);

  // ============================================================================
  // TIME FORMAT
  // ============================================================================

  const handleTimeFormatToggle = useCallback(() => {
    logger.info('Time format toggled', {
      from: timeFormat,
      to: timeFormat === '12-hour' ? '24-hour' : '12-hour',
    });
    
    toggleTimeFormat();
  }, [toggleTimeFormat, timeFormat]);

  // ============================================================================
  // REMINDER INTERVAL
  // ============================================================================

  const handleReminderIntervalChange = useCallback(
    (value: number) => {
      logger.info('Reminder interval changed', {
        from: reminderInterval,
        to: value,
        unit: 'minutes',
      });
      
      setReminderInterval(value);
      setIsReminderPickerVisible(false);
    },
    [setReminderInterval, reminderInterval]
  );

  const openReminderPicker = useCallback(() => {
    logger.debug('Opening reminder picker', {
      currentInterval: reminderInterval,
    });
    
    setIsReminderPickerVisible(true);
  }, [reminderInterval]);

  const closeReminderPicker = useCallback(() => {
    logger.debug('Closing reminder picker');
    setIsReminderPickerVisible(false);
  }, []);

  // ============================================================================
  // PRAYER NOTIFICATIONS
  // ============================================================================

  const handleToggleNotification = useCallback(
    (prayerName: string) => {
      const isMuted = mutedNotifications.includes(prayerName);
      
      logger.info('Prayer notification toggled', {
        prayer: prayerName,
        action: isMuted ? 'unmuted' : 'muted',
        from: isMuted ? 'muted' : 'unmuted',
        to: isMuted ? 'unmuted' : 'muted',
      });
      
      toggleNotificationForPrayer(prayerName);
    },
    [toggleNotificationForPrayer, mutedNotifications]
  );

  // ============================================================================
  // ADHAN SELECTION
  // ============================================================================

  const stopCurrentSound = useCallback(() => {
    if (!previewOptionId) return;

    logger.debug('Stopping adhan preview', {
      optionId: previewOptionId,
    });

    try {
      player.pause();
      player.seekTo(0);
      logger.success('Adhan preview stopped');
    } catch (e) {
      logger.error('Error stopping preview', e as Error);
    } finally {
      setPreviewSource(null);
      setPreviewOptionId(null);
    }
  }, [player, previewOptionId]);

  const playAdhanPreview = useCallback(
    (file: any, optionId: number) => {
      // None selected
      if (!file) {
        logger.debug('Adhan set to None (no preview)');
        stopCurrentSound();
        return;
      }

      // If same option tapped again, replay
      if (previewOptionId === optionId) {
        logger.debug('Replaying current adhan preview', {
          optionId,
        });

        try {
          player.seekTo(0);
          player.play();
        } catch (e) {
          logger.error('Error replaying preview', e as Error);
        }
        return;
      }

      // Switch to new source
      logger.info('Switching adhan preview', {
        from: previewOptionId,
        to: optionId,
      });

      try {
        player.pause();
        player.seekTo(0);
      } catch {
        // ignore
      }

      setPreviewOptionId(optionId);
      setPreviewSource(file);
    },
    [player, previewOptionId, stopCurrentSound]
  );

  const handleAdhanSelect = useCallback(
    (option: AdhanOption) => {
      const selection = labelToSelection[option.label];
      
      logger.info('Adhan selected', {
        optionId: option.id,
        label: option.label,
        selection,
      });
      
      setSelectedAdhan(selection);
      playAdhanPreview(option.file, option.id);
    },
    [setSelectedAdhan, playAdhanPreview]
  );

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const navigateToAdhanSelection = useCallback(() => {
    logger.info('Navigating to adhan selection page');
    router.push('./prayers/adhanSelection');
  }, [router]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State - General
    timeFormat,
    reminderInterval,
    selectedAdhan,
    mutedNotifications,
    isReminderPickerVisible,

    // State - Adhan
    adhanOptions: ADHAN_OPTIONS,
    isPlayingAdhan,

    // Actions - General
    handleTimeFormatToggle,
    handleReminderIntervalChange,
    handleToggleNotification,
    navigateToAdhanSelection,
    openReminderPicker,
    closeReminderPicker,

    // Actions - Adhan
    handleAdhanSelect,
    stopCurrentSound,
  };
}