/**
 * Track Player State Logger Hook
 * 
 * ✅ UPDATED: Converted to structured logging
 * ✅ IMPROVED: Better error details and state tracking
 * 
 * Logs TrackPlayer events for debugging and monitoring.
 * Tracks playback state, errors, and track changes.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useEffect } from 'react';
import { Event, useTrackPlayerEvents } from 'react-native-track-player';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Track Player');

// Events to monitor
const events = [
  Event.PlaybackState,
  Event.PlaybackError,
  Event.PlaybackActiveTrackChanged,
];

/**
 * Hook to log TrackPlayer state changes
 * Monitors playback state, errors, and track changes
 * 
 * @example
 * ```tsx
 * // In your Quran audio screen
 * useLogTrackPlayerState();
 * ```
 */
export const useLogTrackPlayerState = () => {
  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Track player state logger mounted', {
      monitoringEvents: ['PlaybackState', 'PlaybackError', 'PlaybackActiveTrackChanged'],
    });
    
    return () => {
      logger.debug('Track player state logger unmounted');
    };
  }, []);

  // ✅ Convert to structured logging
  useTrackPlayerEvents(events, async (event) => {
    // Playback errors
    if (event.type === Event.PlaybackError) {
      logger.error('Track player playback error', new Error(event.message || 'Unknown error'), {
        code: event.code,
        message: event.message,
      });
    }

    // Playback state changes
    if (event.type === Event.PlaybackState) {
      logger.info('Playback state changed', {
        state: event.state,
        stateLabel: getStateLabel(event.state),
      });
    }

    // Track changes
    if (event.type === Event.PlaybackActiveTrackChanged) {
      const hasTrack = event.index !== undefined && event.index !== null;
      
      if (hasTrack) {
        logger.info('Active track changed', {
          trackIndex: event.index,
        });
      } else {
        logger.debug('Track cleared (no active track)', {
          previousIndex: event.lastIndex,
        });
      }
    }
  });
};

/**
 * Helper to get human-readable state label
 */
function getStateLabel(state: any): string {
  const stateMap: Record<number, string> = {
    1: 'None',
    2: 'Ready',
    3: 'Playing',
    4: 'Paused',
    5: 'Stopped',
    6: 'Buffering',
    7: 'Connecting',
  };
  
  return stateMap[state] || `Unknown (${state})`;
}