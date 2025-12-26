/**
 * TrackPlayer Setup Hook
 * 
 * ✅ REFACTORED: Using structured logging system
 * 
 * Lazy initialization of TrackPlayer for Quran audio playback.
 * Uses singleton pattern to prevent multiple initializations.
 * 
 * @version 2.0
 * @since 2025-12-24
 * 
 * @example
 * ```typescript
 * const { setupPlayer, isInitialized } = useTrackPlayerSetup();
 * 
 * // Call when Quran/Audio tab is opened
 * useEffect(() => {
 *   setupPlayer();
 * }, []);
 * ```
 */

import { useCallback, useRef } from 'react';
import TrackPlayer, { Capability, RatingType, RepeatMode } from 'react-native-track-player';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('TrackPlayer');

interface UseTrackPlayerSetupReturn {
  setupPlayer: () => Promise<void>;
  isInitialized: boolean;
}

/**
 * Lazy TrackPlayer setup hook
 * 
 * Call setupPlayer() when the Quran/Audio tab is opened.
 * Uses singleton pattern to prevent multiple initializations.
 */
export const useTrackPlayerSetup = (): UseTrackPlayerSetupReturn => {
  const isInitializedRef = useRef(false);
  const setupPromiseRef = useRef<Promise<void> | null>(null);

  const setupPlayer = useCallback(async () => {
    // ==========================================================================
    // Check 1: Return existing promise if setup is in progress
    // ==========================================================================
    if (setupPromiseRef.current) {
      logger.debug('TrackPlayer setup already in progress, returning existing promise');
      return setupPromiseRef.current;
    }

    // ==========================================================================
    // Check 2: Already initialized (singleton)
    // ==========================================================================
    if (isInitializedRef.current) {
      logger.debug('TrackPlayer already initialized (singleton)', {
        isInitialized: true,
      });
      return Promise.resolve();
    }

    // ==========================================================================
    // Initialize TrackPlayer
    // ==========================================================================
    logger.info('Starting TrackPlayer initialization...');
    logger.time('trackplayer-setup');

    // Create setup promise
    setupPromiseRef.current = (async () => {
      try {
        // Step 1: Setup Player
        logger.debug('Configuring TrackPlayer instance...');
        await TrackPlayer.setupPlayer({
          maxCacheSize: 1024 * 10, // 10MB cache
          autoHandleInterruptions: true, // Handle phone calls, alarms, etc.
        });
        
        logger.success('TrackPlayer instance created', {
          maxCacheSize: '10MB',
          autoHandleInterruptions: true,
        });

        // Step 2: Update Player Options
        logger.debug('Configuring player capabilities...');
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
        
        logger.success('Player capabilities configured', {
          capabilities: 6,
          compactCapabilities: 4,
          progressInterval: '1s',
        });

        // Step 3: Set Initial Volume
        logger.debug('Setting initial volume...');
        await TrackPlayer.setVolume(0.3);
        logger.debug('Volume set', { volume: 0.3 });

        // Step 4: Set Repeat Mode
        logger.debug('Setting repeat mode...');
        await TrackPlayer.setRepeatMode(RepeatMode.Off);
        logger.debug('Repeat mode set', { mode: 'Off' });

        // Mark as initialized
        isInitializedRef.current = true;
        
        logger.success('✅ TrackPlayer fully initialized');
        logger.timeEnd('trackplayer-setup');
      } catch (error) {
        logger.error('TrackPlayer setup failed', error, {
          willRetry: 'yes (on next call)',
          errorType: error instanceof Error ? error.name : typeof error,
        });
        
        // Clear promise to allow retry
        setupPromiseRef.current = null;
        
        logger.timeEnd('trackplayer-setup');
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