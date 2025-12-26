/**
 * Track Player Setup Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Setup monitoring and error tracking
 * 
 * Initializes TrackPlayer once when Quran feature is accessed.
 * Safe to call multiple times - setup only runs once.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useEffect, useState } from 'react';
import TrackPlayer, { Capability } from 'react-native-track-player';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Track Player Setup');

/**
 * Hook to setup TrackPlayer once
 * Idempotent - safe to call multiple times
 * 
 * @returns {Object} Setup status and error state
 * 
 * @example
 * ```tsx
 * const { isSetup, error } = useTrackPlayerSetup();
 * 
 * if (!isSetup) return <LoadingSpinner />;
 * return <QuranAudioPlayer />;
 * ```
 */
export function useTrackPlayerSetup() {
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Track player setup hook mounted');
    
    return () => {
      logger.debug('Track player setup hook unmounted', {
        wasSetup: isSetup,
        hadError: !!error,
      });
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setupPlayer = async () => {
      logger.info('Starting TrackPlayer setup...');
      logger.time('track-player-setup');

      // ============================================
      // Step 1: Check if already setup
      // ============================================
      try {
        logger.debug('Checking if TrackPlayer already setup...');
        const state = await TrackPlayer.getPlaybackState();
        
        if (state !== undefined) {
          logger.timeEnd('track-player-setup');
          logger.success('TrackPlayer already setup (skipping initialization)', {
            playbackState: state,
          });
          
          if (isMounted) setIsSetup(true);
          return;
        }
      } catch {
        logger.debug('TrackPlayer not setup yet, proceeding with initialization');
      }

      // ============================================
      // Step 2: Setup player
      // ============================================
      try {
        logger.debug('Initializing TrackPlayer...');
        
        await TrackPlayer.setupPlayer({
          waitForBuffer: true,
        });
        
        logger.success('TrackPlayer initialized');

        // ============================================
        // Step 3: Configure capabilities
        // ============================================
        logger.debug('Configuring TrackPlayer capabilities...');
        
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

        logger.success('TrackPlayer capabilities configured', {
          capabilities: [
            'Play',
            'Pause',
            'SkipToNext',
            'SkipToPrevious',
            'SeekTo',
          ],
        });

        // ============================================
        // Step 4: Complete setup
        // ============================================
        logger.timeEnd('track-player-setup');

        if (isMounted) {
          setIsSetup(true);
          logger.success('TrackPlayer setup complete');
        }
      } catch (err) {
        logger.timeEnd('track-player-setup');
        logger.error('Error setting up TrackPlayer', err as Error, {
          stage: 'initialization',
        });
        
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