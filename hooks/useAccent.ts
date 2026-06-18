/**
 * useAccent — the app's single accent source.
 *
 * Returns the highlight color to use for active/selected/emphasis UI. By default
 * (useSkyAccent preference, on by default) this is the **live sky-phase accent**,
 * so the whole app's accent shifts with the real time of day — the signature
 * identity. When the user turns the toggle off, it falls back to their chosen
 * theme accent (green/blue/purple). Light/dark and the theme palette are
 * untouched; this only governs the accent.
 *
 * Pass `skyTimesOverride` on the prayer home (the day being viewed) so the accent
 * stays in sync with the visible SkyBackground. Elsewhere call with no args and
 * it derives the phase from today's (cached) prayer times.
 */

import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSkyAccentEnabled } from '../stores/userPreferencesStore';
import { useCoordinates } from '../stores/useLocationStore';
import { useTodayPrayerTimes } from '../api/services/prayer';
import { useSkyPhase, SkyPrayerTimes } from './prayer/useSkyPhase';

export interface AccentInfo {
  /** The accent color to render. */
  accent: string;
  /** The current sky-phase label (e.g. "Golden hour") — null when sky accent is off. */
  label: string | null;
  /** Whether the accent is currently sky-driven. */
  isSky: boolean;
}

export function useAccent(skyTimesOverride?: SkyPrayerTimes | null): AccentInfo {
  const { theme } = useTheme();
  const useSky = useSkyAccentEnabled();
  const coordinates = useCoordinates();
  // Shared/cached query — multiple callers (tab bar, screens) dedupe on the key.
  const { data: today } = useTodayPrayerTimes(coordinates);

  const skyTimes = useMemo<SkyPrayerTimes | null>(() => {
    // An explicit override (incl. null) wins — keeps the prayer home in sync with
    // the sky it's actually showing. Only fall back to today's times otherwise.
    if (skyTimesOverride !== undefined) return skyTimesOverride;
    return today
      ? {
          subuh: today.subuh,
          syuruk: today.syuruk,
          zohor: today.zohor,
          asar: today.asar,
          maghrib: today.maghrib,
          isyak: today.isyak,
        }
      : null;
  }, [skyTimesOverride, today]);

  const phase = useSkyPhase(skyTimes);

  return {
    accent: useSky ? phase.accent : theme.colors.accent,
    label: useSky ? phase.label : null,
    isSky: useSky,
  };
}
