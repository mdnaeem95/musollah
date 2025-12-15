import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { usePreferencesStore, type AdhanSelection } from '../../stores/userPreferencesStore';

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

export function usePrayerSettings() {
  const router = useRouter();

  // Modal state
  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState(false);

  // Audio state (expo-audio)
  const [previewSource, setPreviewSource] = useState<any | null>(null);
  const [previewOptionId, setPreviewOptionId] = useState<number | null>(null);

  // Create a player that rebinds when source changes (source can be null)
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

  // ============================================================================
  // AUDIO SETUP
  // ============================================================================

  useEffect(() => {
    // Configure global audio behavior (expo-audio)
    // Note: expo-audio uses different option names vs expo-av
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionModeAndroid: 'duckOthers',
      interruptionMode: 'mixWithOthers',
    }).catch((error) => {
      console.error('Failed to configure audio mode:', error);
    });
  }, []);

  // When preview source changes, restart from 0 and play.
  // expo-audio does NOT auto-reset to 0 after it finishes; you must seekTo(0) before replay. :contentReference[oaicite:2]{index=2}
  useEffect(() => {
    if (!previewSource) return;

    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.error('Failed to autoplay preview:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSource]);

  // ============================================================================
  // TIME FORMAT
  // ============================================================================

  const handleTimeFormatToggle = useCallback(() => {
    toggleTimeFormat();
  }, [toggleTimeFormat]);

  // ============================================================================
  // REMINDER INTERVAL
  // ============================================================================

  const handleReminderIntervalChange = useCallback(
    (value: number) => {
      setReminderInterval(value);
      setIsReminderPickerVisible(false);
    },
    [setReminderInterval]
  );

  const openReminderPicker = useCallback(() => setIsReminderPickerVisible(true), []);
  const closeReminderPicker = useCallback(() => setIsReminderPickerVisible(false), []);

  // ============================================================================
  // PRAYER NOTIFICATIONS
  // ============================================================================

  const handleToggleNotification = useCallback(
    (prayerName: string) => {
      toggleNotificationForPrayer(prayerName);
    },
    [toggleNotificationForPrayer]
  );

  // ============================================================================
  // ADHAN SELECTION
  // ============================================================================

  const stopCurrentSound = useCallback(() => {
    try {
      player.pause();
      player.seekTo(0);
    } catch (e) {
      console.error('Error stopping preview:', e);
    } finally {
      setPreviewSource(null);
      setPreviewOptionId(null);
    }
  }, [player]);

  const playAdhanPreview = useCallback(
    (file: any, optionId: number) => {
      // None selected
      if (!file) {
        stopCurrentSound();
        return;
      }

      // If same option tapped again, replay
      if (previewOptionId === optionId) {
        try {
          player.seekTo(0);
          player.play();
        } catch (e) {
          console.error('Error replaying preview:', e);
        }
        return;
      }

      // Switch to new source (autoplays via effect)
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
      setSelectedAdhan(selection);

      playAdhanPreview(option.file, option.id);
    },
    [setSelectedAdhan, playAdhanPreview]
  );

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const navigateToAdhanSelection = useCallback(() => {
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
