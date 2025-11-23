import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { usePreferencesStore, type AdhanSelection } from '../../stores/userPreferencesStore';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type AdhanOption = {
  id: number;
  label: 'None' | 'Ahmad Al-Nafees' | 'Mishary Rashid Alafasy';
  file: any;
};

export const ADHAN_OPTIONS: AdhanOption[] = [
  { id: 1, label: 'None', file: null },
  { id: 2, label: 'Ahmad Al-Nafees', file: require('../../assets/adhans/ahmadAlNafees.mp3') },
  { id: 3, label: 'Mishary Rashid Alafasy', file: require('../../assets/adhans/mishary.mp3') },
];

// Map UI label -> store enum
const labelToSelection: Record<AdhanOption['label'], AdhanSelection> = {
  'None': 'None',
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
  
  // Audio state
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAdhan, setIsPlayingAdhan] = useState(false);

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
  // AUDIO SETUP & CLEANUP
  // ============================================================================

  // Configure audio mode on mount
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Failed to configure audio:', error);
      }
    };
    configureAudio();
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync().catch((error) => {
          console.error('Failed to unload sound:', error);
        });
      }
    };
  }, [currentSound]);

  // ============================================================================
  // TIME FORMAT
  // ============================================================================

  const handleTimeFormatToggle = useCallback(() => {
    toggleTimeFormat();
  }, [toggleTimeFormat]);

  // ============================================================================
  // REMINDER INTERVAL
  // ============================================================================

  const handleReminderIntervalChange = useCallback((value: number) => {
    setReminderInterval(value);
    setIsReminderPickerVisible(false);
  }, [setReminderInterval]);

  const openReminderPicker = useCallback(() => {
    setIsReminderPickerVisible(true);
  }, []);

  const closeReminderPicker = useCallback(() => {
    setIsReminderPickerVisible(false);
  }, []);

  // ============================================================================
  // PRAYER NOTIFICATIONS
  // ============================================================================

  const handleToggleNotification = useCallback((prayerName: string) => {
    toggleNotificationForPrayer(prayerName);
  }, [toggleNotificationForPrayer]);

  // ============================================================================
  // ADHAN SELECTION
  // ============================================================================

  const stopCurrentSound = useCallback(async () => {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setIsPlayingAdhan(false);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  }, [currentSound]);

  const playAdhanPreview = useCallback(
    async (file: any) => {
      try {
        await stopCurrentSound();
        if (!file) return; // None selected

        const { sound: newSound } = await Audio.Sound.createAsync(file, {
          shouldPlay: true,
          isLooping: false,
        });

        setCurrentSound(newSound);
        setIsPlayingAdhan(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if ('isLoaded' in status && status.isLoaded && (status as any).didJustFinish) {
            setIsPlayingAdhan(false);
          }
        });
      } catch (error) {
        console.error('Error playing adhan preview:', error);
        setIsPlayingAdhan(false);
      }
    },
    [stopCurrentSound]
  );

  const handleAdhanSelect = useCallback(
    async (option: AdhanOption) => {
      // Convert UI label to store type
      const selection = labelToSelection[option.label];
      setSelectedAdhan(selection);

      // Play preview
      await playAdhanPreview(option.file);
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