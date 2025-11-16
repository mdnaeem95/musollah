import { useCallback, useRef } from 'react';
import TrackPlayer, { Capability, RatingType, RepeatMode } from 'react-native-track-player';

interface UseTrackPlayerSetupReturn {
  setupPlayer: () => Promise<void>;
  isInitialized: boolean;
}

/**
 * Lazy TrackPlayer setup hook
 * Call setupPlayer() when the Quran/Audio tab is opened
 * Uses singleton pattern to prevent multiple initializations
 */
export const useTrackPlayerSetup = (): UseTrackPlayerSetupReturn => {
  const isInitializedRef = useRef(false);
  const setupPromiseRef = useRef<Promise<void> | null>(null);

  const setupPlayer = useCallback(async () => {
    // Return existing promise if setup is in progress
    if (setupPromiseRef.current) {
      return setupPromiseRef.current;
    }

    // Already initialized
    if (isInitializedRef.current) {
      return Promise.resolve();
    }

    // Create setup promise
    setupPromiseRef.current = (async () => {
      try {
        console.log('🎵 Initializing TrackPlayer...');

        await TrackPlayer.setupPlayer({
          maxCacheSize: 1024 * 10,
          autoHandleInterruptions: true, // Handle phone calls, etc.
        });

        await TrackPlayer.updateOptions({
          ratingType: RatingType.Heart,
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
            Capability.SeekTo,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          progressUpdateEventInterval: 1, // Update every second
        });

        await TrackPlayer.setVolume(0.3);
        await TrackPlayer.setRepeatMode(RepeatMode.Off);

        isInitializedRef.current = true;
        console.log('✅ TrackPlayer initialized');
      } catch (error) {
        console.error('❌ TrackPlayer setup failed:', error);
        setupPromiseRef.current = null; // Allow retry
        throw error;
      }
    })();

    return setupPromiseRef.current;
  }, []);

  return {
    setupPlayer,
    isInitialized: isInitializedRef.current,
  };
};