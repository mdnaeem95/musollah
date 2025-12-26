/**
 * Quran Audio Player Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Track setup monitoring and error tracking
 * 
 * Manages Quran audio playback using TrackPlayer.
 * Handles track setup, playback, and ayah progress tracking.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useEffect, useState, useCallback } from 'react';
import TrackPlayer, { Event, Track, type PlaybackTrackChangedEvent } from 'react-native-track-player';
import { useQuranStore } from '../../stores/useQuranStore';
import { reciterOptions } from '../../utils/constants';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Quran Player');

// ============================================================================
// TYPES
// ============================================================================

interface UseQuranAudioPlayerParams {
  surahNumber: number;
  surahName: string;
  audioLinks: string[];
  reciter: string;
  enabled: boolean;
  isPlayerSetup: boolean;
}

interface UseQuranAudioPlayerReturn {
  currentAyahIndex: number;
  isReady: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for Quran audio playback
 * Manages TrackPlayer tracks and ayah progress
 * 
 * @param {UseQuranAudioPlayerParams} params - Configuration
 * @returns {UseQuranAudioPlayerReturn} Current ayah and ready state
 */
export function useQuranAudioPlayer({
  surahNumber,
  surahName,
  audioLinks,
  reciter,
  enabled,
  isPlayerSetup,
}: UseQuranAudioPlayerParams): UseQuranAudioPlayerReturn {
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const { setLastListenedAyah } = useQuranStore();

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Quran audio player hook mounted', {
      surahNumber,
      surahName,
      ayahCount: audioLinks.length,
      reciter,
      enabled,
      isPlayerSetup,
    });
    
    return () => {
      logger.debug('Quran audio player hook unmounted', {
        surahNumber,
        wasReady: isReady,
      });
    };
  }, []);

  /**
   * Generate TrackPlayer tracks from audio links
   */
  const generateTracks = useCallback((): Track[] => {
    logger.time('generate-tracks');
    
    const tracks = audioLinks.map((link, index) => {
      const url = link.replace('ar.alafasy', reciter).trim();
      const reciterLabel =
        reciterOptions.find(opt => opt.value === reciter)?.label || 'Unknown Reciter';

      return {
        id: `${surahNumber}-${index + 1}`,
        url,
        title: `${surahName}, Ayah ${index + 1}`,
        artist: reciterLabel,
      };
    });

    logger.timeEnd('generate-tracks');
    logger.debug('Tracks generated', {
      count: tracks.length,
      reciter: reciterOptions.find(opt => opt.value === reciter)?.label,
      firstTrackUrl: tracks[0]?.url,
    });

    return tracks;
  }, [audioLinks, reciter, surahNumber, surahName]);

  /**
   * Setup tracks when ready
   */
  useEffect(() => {
    // Wait for player setup
    if (!enabled || !isPlayerSetup || audioLinks.length === 0) {
      if (!enabled) {
        logger.debug('Audio player disabled', { surahNumber });
      } else if (!isPlayerSetup) {
        logger.debug('Waiting for player setup...', { surahNumber });
      } else if (audioLinks.length === 0) {
        logger.warn('No audio links available', { surahNumber });
      }
      return;
    }

    let isMounted = true;

    const setupTracks = async () => {
      logger.info('Setting up audio tracks', {
        surahNumber,
        surahName,
        ayahCount: audioLinks.length,
      });
      
      logger.time('setup-tracks');

      try {
        const tracks = generateTracks();
        
        logger.debug('Resetting TrackPlayer...');
        await TrackPlayer.reset();
        
        logger.debug('Adding tracks to queue...', { count: tracks.length });
        await TrackPlayer.add(tracks);
        
        logger.timeEnd('setup-tracks');

        if (isMounted) {
          setIsReady(true);
          logger.success('Audio tracks setup complete', {
            surahNumber,
            trackCount: tracks.length,
          });
        }
      } catch (error) {
        logger.timeEnd('setup-tracks');
        logger.error('Error setting up audio tracks', error as Error, {
          surahNumber,
          ayahCount: audioLinks.length,
        });
      }
    };

    setupTracks();

    return () => {
      isMounted = false;
    };
  }, [enabled, isPlayerSetup, audioLinks, generateTracks, surahNumber, surahName]);

  /**
   * Track playback changes
   */
  useEffect(() => {
    if (!enabled || !isPlayerSetup) return;

    logger.debug('Setting up track change listener', { surahNumber });

    const onTrackChange = TrackPlayer.addEventListener(
      Event.PlaybackTrackChanged,
      async ({ nextTrack }: PlaybackTrackChangedEvent) => {
        if (nextTrack == null) {
          logger.debug('Track changed to null (playback stopped)');
          return;
        }

        logger.info('Ayah changed', {
          ayahIndex: nextTrack,
          ayahNumber: nextTrack + 1,
          surahNumber,
        });

        setCurrentAyahIndex(nextTrack);

        // Update last listened ayah
        const queue = await TrackPlayer.getQueue();
        const activeTrack = queue[nextTrack];

        if (activeTrack?.id) {
          const [, ayahStr] = activeTrack.id.split('-');
          const ayahNumber = parseInt(ayahStr, 10);
          
          if (!Number.isNaN(ayahNumber)) {
            logger.debug('Updating last listened ayah', {
              surahNumber,
              ayahNumber,
            });
            setLastListenedAyah(surahNumber, ayahNumber);
          } else {
            logger.warn('Invalid ayah number from track ID', {
              trackId: activeTrack.id,
              ayahStr,
            });
          }
        }
      }
    );

    return () => {
      logger.debug('Removing track change listener', { surahNumber });
      onTrackChange.remove();
    };
  }, [enabled, isPlayerSetup, surahNumber, setLastListenedAyah]);

  /**
   * Handle queue end (loop back to start)
   */
  useEffect(() => {
    if (!enabled || !isPlayerSetup) return;

    logger.debug('Setting up queue end listener', { surahNumber });

    const onQueueEnd = TrackPlayer.addEventListener(
      Event.PlaybackQueueEnded,
      async () => {
        logger.info('Playback queue ended, restarting from beginning', {
          surahNumber,
        });

        try {
          const queue = await TrackPlayer.getQueue();
          
          if (queue.length > 0) {
            logger.debug('Skipping to first track', {
              queueLength: queue.length,
            });
            
            await TrackPlayer.skip(0);
            setCurrentAyahIndex(0);
            
            logger.success('Restarted playback from beginning');
          } else {
            logger.warn('Queue empty, cannot restart playback');
          }
        } catch (error) {
          logger.error('Error handling queue end', error as Error);
        }
      }
    );

    return () => {
      logger.debug('Removing queue end listener', { surahNumber });
      onQueueEnd.remove();
    };
  }, [enabled, isPlayerSetup, surahNumber]);

  return { currentAyahIndex, isReady };
}