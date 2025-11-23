// hooks/quran/useTrackPlayerSetup.ts
import { useEffect, useState } from 'react';
import TrackPlayer, { Capability } from 'react-native-track-player';

/**
 * Setup TrackPlayer once when Quran feature is accessed
 * Safe to call multiple times - setup only runs once
 */
export function useTrackPlayerSetup() {
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setupPlayer = async () => {
      try {
        // Check if already set up
        const state = await TrackPlayer.getPlaybackState();
        if (state !== undefined) {
          if (isMounted) setIsSetup(true);
          return;
        }
      } catch {
        // Player not set up yet, continue with setup
      }

      try {
        await TrackPlayer.setupPlayer({
          waitForBuffer: true,
        });

        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
        });

        if (isMounted) {
          setIsSetup(true);
          console.log('✅ TrackPlayer setup complete');
        }
      } catch (err) {
        console.error('❌ Error setting up TrackPlayer:', err);
        if (isMounted) {
          setError(err as Error);
        }
      }
    };

    setupPlayer();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isSetup, error };
}