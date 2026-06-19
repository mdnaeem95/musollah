/**
 * Hifz (memorization) store
 *
 * Settings for the Quran memorization toolkit, read by the audio player and the
 * Mushaf reader. Playback speed + repeat preference persist; test mode is
 * ephemeral (always starts off, so you never open the reader to hidden text).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';

/** repeatEachAyah sentinels: 1 = play once (off), N = repeat N times, -1 = loop forever. */
export const REPEAT_OFF = 1;
export const REPEAT_INFINITE = -1;

interface HifzState {
  playbackRate: number;     // 0.5–2.0
  repeatEachAyah: number;   // 1 = off, 3/5/7 = finite, -1 = ∞
  testMode: boolean;        // hide Arabic text until tapped (recall practice)

  setPlaybackRate: (rate: number) => void;
  setRepeatEachAyah: (n: number) => void;
  setTestMode: (on: boolean) => void;
  toggleTestMode: () => void;
}

export const useHifzStore = create<HifzState>()(
  persist(
    (set) => ({
      playbackRate: 1,
      repeatEachAyah: REPEAT_OFF,
      testMode: false,

      setPlaybackRate: (playbackRate) => set({ playbackRate }),
      setRepeatEachAyah: (repeatEachAyah) => set({ repeatEachAyah }),
      setTestMode: (testMode) => set({ testMode }),
      toggleTestMode: () => set((s) => ({ testMode: !s.testMode })),
    }),
    {
      name: 'hifz-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => defaultStorage.getString(name) ?? null,
        setItem: (name, value) => defaultStorage.setString(name, value),
        removeItem: (name) => defaultStorage.delete(name),
      })),
      // Persist preferences only — testMode always starts off.
      partialize: (s) => ({ playbackRate: s.playbackRate, repeatEachAyah: s.repeatEachAyah }),
    }
  )
);
