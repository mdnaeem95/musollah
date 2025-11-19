import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { usePreferencesStore, type AdhanSelection } from '../../../../stores/userPreferencesStore';

export type AdhanOption = {
  id: number;
  label: 'None' | 'Ahmad Al-Nafees' | 'Mishary Rashid Alafasy'; // tighten for safety
  file: any;
};

export const ADHAN_OPTIONS: AdhanOption[] = [
  { id: 1, label: 'None', file: null },
  { id: 2, label: 'Ahmad Al-Nafees', file: require('../../../../assets/adhans/ahmadAlNafees.mp3') },
  { id: 3, label: 'Mishary Rashid Alafasy', file: require('../../../../assets/adhans/mishary.mp3') },
];

// 🔁 Map UI label -> store enum/union
const labelToSelection: Record<AdhanOption['label'], AdhanSelection> = {
  'None': 'None' as AdhanSelection,                       // or AdhanSelection.None
  'Ahmad Al-Nafees': 'AhmadAlNafees' as AdhanSelection,   // or AdhanSelection.AhmadAlNafees
  'Mishary Rashid Alafasy': 'MisharyRashidAlafasy' as AdhanSelection, // or AdhanSelection.MisharyRashidAlafasy
};

export function useAdhanSelection() {
  const { selectedAdhan, setSelectedAdhan } = usePreferencesStore();
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync().catch((error) => {
          console.error('Failed to unload sound:', error);
        });
      }
    };
  }, [currentSound]);

  const stopCurrentSound = useCallback(async () => {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setIsPlaying(false);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  }, [currentSound]);

  const playAudio = useCallback(
    async (file: any) => {
      try {
        await stopCurrentSound();
        if (!file) return; // None selected

        const { sound: newSound } = await Audio.Sound.createAsync(file, {
          shouldPlay: true,
          isLooping: false,
        });

        setCurrentSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if ('isLoaded' in status && status.isLoaded && (status as any).didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error('Error playing sound:', error);
        setIsPlaying(false);
      }
    },
    [stopCurrentSound]
  );

  const handleAdhanSelect = useCallback(
    async (option: AdhanOption) => {
      // ✅ Convert UI label to store type
      const selection = labelToSelection[option.label];
      setSelectedAdhan(selection);

      // Play preview
      await playAudio(option.file);
    },
    [setSelectedAdhan, playAudio]
  );

  return {
    // State
    adhanOptions: ADHAN_OPTIONS,
    selectedAdhan, // this is AdhanSelection from the store
    isPlaying,

    // Actions
    handleAdhanSelect,
    stopCurrentSound,
  };
}
