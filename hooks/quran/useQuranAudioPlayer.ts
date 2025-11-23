// useQuranAudioPlayer.ts - Updated
import { useEffect, useState, useCallback } from 'react';
import TrackPlayer, { Event, Track, type PlaybackTrackChangedEvent } from 'react-native-track-player';
import { useQuranStore } from '../../stores/useQuranStore';
import { reciterOptions } from '../../utils/constants';

interface UseQuranAudioPlayerParams {
  surahNumber: number;
  surahName: string;
  audioLinks: string[];
  reciter: string;
  enabled: boolean;
  isPlayerSetup: boolean; // ✅ Add this
}

interface UseQuranAudioPlayerReturn {
  currentAyahIndex: number;
  isReady: boolean;
}

export function useQuranAudioPlayer({
  surahNumber,
  surahName,
  audioLinks,
  reciter,
  enabled,
  isPlayerSetup, // ✅ Add this
}: UseQuranAudioPlayerParams): UseQuranAudioPlayerReturn {
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const { setLastListenedAyah } = useQuranStore();

  const generateTracks = useCallback((): Track[] => {
    return audioLinks.map((link, index) => {
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
  }, [audioLinks, reciter, surahNumber, surahName]);

  useEffect(() => {
    // ✅ Wait for player setup
    if (!enabled || !isPlayerSetup || audioLinks.length === 0) return;
    let isMounted = true;

    const setupTracks = async () => {
      try {
        const tracks = generateTracks();
        await TrackPlayer.reset();
        await TrackPlayer.add(tracks);
        if (isMounted) setIsReady(true);
      } catch (error) {
        console.error('❌ Error setting up audio tracks:', error);
      }
    };

    setupTracks();
    return () => {
      isMounted = false;
    };
  }, [enabled, isPlayerSetup, audioLinks, generateTracks]); // ✅ Add isPlayerSetup

  useEffect(() => {
    if (!enabled || !isPlayerSetup) return; // ✅ Add isPlayerSetup check

    const onTrackChange = TrackPlayer.addEventListener(
      Event.PlaybackTrackChanged,
      async ({ nextTrack }: PlaybackTrackChangedEvent) => {
        if (nextTrack == null) return;

        setCurrentAyahIndex(nextTrack);

        const queue = await TrackPlayer.getQueue();
        const activeTrack = queue[nextTrack];

        if (activeTrack?.id) {
          const [, ayahStr] = activeTrack.id.split('-');
          const ayahNumber = parseInt(ayahStr, 10);
          if (!Number.isNaN(ayahNumber)) {
            setLastListenedAyah(surahNumber, ayahNumber);
          }
        }
      }
    );

    return () => {
      onTrackChange.remove();
    };
  }, [enabled, isPlayerSetup, surahNumber, setLastListenedAyah]); // ✅ Add isPlayerSetup

  useEffect(() => {
    if (!enabled || !isPlayerSetup) return; // ✅ Add isPlayerSetup check

    const onQueueEnd = TrackPlayer.addEventListener(
      Event.PlaybackQueueEnded,
      async () => {
        try {
          const queue = await TrackPlayer.getQueue();
          if (queue.length > 0) {
            await TrackPlayer.skip(0);
            setCurrentAyahIndex(0);
          }
        } catch (error) {
          console.error('❌ Error handling queue end:', error);
        }
      }
    );

    return () => {
      onQueueEnd.remove();
    };
  }, [enabled, isPlayerSetup]); // ✅ Add isPlayerSetup

  return { currentAyahIndex, isReady };
}