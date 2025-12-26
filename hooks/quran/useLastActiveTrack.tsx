/**
 * Last Active Track Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Track change monitoring
 * 
 * Tracks the last active track from TrackPlayer.
 * Useful for maintaining UI state when track becomes inactive.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useEffect, useState } from 'react';
import { Track, useActiveTrack } from 'react-native-track-player';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Quran Audio');

/**
 * Hook to track the last active track
 * Maintains reference to track even after it becomes inactive
 * 
 * @returns {Track | undefined} Last active track
 * 
 * @example
 * ```tsx
 * const lastTrack = useLastActiveTrack();
 * const displayTrack = activeTrack || lastTrack;
 * ```
 */
export const useLastActiveTrack = () => {
  const activeTrack = useActiveTrack();
  const [lastActiveTrack, setLastActiveTrack] = useState<Track>();

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Last active track hook mounted');
    
    return () => {
      logger.debug('Last active track hook unmounted', {
        hadTrack: !!lastActiveTrack,
        lastTrackId: lastActiveTrack?.id,
      });
    };
  }, []);

  // ✅ Log track changes
  useEffect(() => {
    if (!activeTrack) return;

    // Check if track actually changed
    const isNewTrack = activeTrack.id !== lastActiveTrack?.id;

    if (isNewTrack) {
      logger.info('Active track changed', {
        newTrackId: activeTrack.id,
        newTrackTitle: activeTrack.title,
        previousTrackId: lastActiveTrack?.id || 'none',
      });
    }

    setLastActiveTrack(activeTrack);
  }, [activeTrack, lastActiveTrack?.id]);

  return lastActiveTrack;
};