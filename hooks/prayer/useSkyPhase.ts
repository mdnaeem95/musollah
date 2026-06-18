/**
 * useSkyPhase — the app's signature time-of-day signal.
 *
 * Derives the current "sky phase" (night → dawn → sunrise → … → dusk → night)
 * from the real MUIS prayer times, mirroring the phase boundaries used by the
 * procedural `SkyBackground`. Unlike SkyBackground (which renders the full sky),
 * this is a lightweight, reusable hook so ANY surface in the app can react to the
 * time of day — a phase-tinted accent, a header glow, a hero card, etc.
 *
 * This is the foundation for the app-wide time-of-day identity: the look is tied
 * to *Singapore's* prayer times, which a generic global app can't replicate.
 */

import { useEffect, useMemo, useState } from 'react';

export type SkyPhase =
  | 'night'
  | 'dawn'
  | 'sunrise'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'goldenHour'
  | 'sunset'
  | 'dusk';

export interface SkyPhaseInfo {
  phase: SkyPhase;
  /** Human label, e.g. "Golden hour". */
  label: string;
  /** Vivid, legible accent representing the phase (reads well over its sky). */
  accent: string;
  /** Whether the sky is currently dark (night/dusk/dawn) — for contrast choices. */
  isNight: boolean;
}

export interface SkyPrayerTimes {
  subuh: string;
  syuruk: string;
  zohor: string;
  asar: string;
  maghrib: string;
  isyak: string;
}

/** Per-phase label + accent. Accents are tuned to sit on the matching sky. */
export const PHASE_META: Record<SkyPhase, { label: string; accent: string; isNight: boolean }> = {
  night:      { label: 'Night',       accent: '#7FA0E0', isNight: true },
  dawn:       { label: 'Dawn',        accent: '#B07CD8', isNight: true },
  sunrise:    { label: 'Sunrise',     accent: '#FF8C42', isNight: false },
  morning:    { label: 'Morning',     accent: '#56B7E8', isNight: false },
  midday:     { label: 'Midday',      accent: '#3FA9F5', isNight: false },
  afternoon:  { label: 'Afternoon',   accent: '#F5A623', isNight: false },
  goldenHour: { label: 'Golden hour', accent: '#FF7A00', isNight: false },
  sunset:     { label: 'Sunset',      accent: '#E0518A', isNight: false },
  dusk:       { label: 'Dusk',        accent: '#6E5BD0', isNight: true },
};

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Classify the current discrete sky phase from prayer times + now.
 * Boundaries mirror `SkyBackground.computeSkyState` so the accent matches the sky.
 */
export function getSkyPhase(prayerTimes: SkyPrayerTimes | null, now: Date): SkyPhase {
  if (!prayerTimes) return 'night';

  const t = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const subuh = toMinutes(prayerTimes.subuh);
  const syuruk = toMinutes(prayerTimes.syuruk);
  const zohor = toMinutes(prayerTimes.zohor);
  const asar = toMinutes(prayerTimes.asar);
  const maghrib = toMinutes(prayerTimes.maghrib);
  const isyak = toMinutes(prayerTimes.isyak);

  // Same derived markers as SkyBackground.
  const syurukToZohorOneThird = syuruk + (zohor - syuruk) / 3;
  const syurukToZohorTwoThirds = syuruk + (2 * (zohor - syuruk)) / 3;
  const zohorToAsarTwoThirds = zohor + (2 * (asar - zohor)) / 3;
  const asarToMaghribOneThird = asar + (maghrib - asar) / 3;
  const asarToMaghribTwoThirds = asar + (2 * (maghrib - asar)) / 3;

  if (t < subuh) return 'night';
  if (t < syuruk) return 'dawn'; // predawn → sunrise glow
  if (t < syurukToZohorOneThird) return 'sunrise';
  if (t < syurukToZohorTwoThirds) return 'morning';
  if (t < zohorToAsarTwoThirds) return 'midday';
  if (t < asarToMaghribOneThird) return 'afternoon';
  if (t < asarToMaghribTwoThirds) return 'goldenHour';
  if (t < maghrib) return 'sunset';
  if (t < isyak) return 'dusk';
  return 'night';
}

/**
 * Reactive time-of-day signal. Re-evaluates every 30s (sky changes are gradual).
 */
export function useSkyPhase(prayerTimes: SkyPrayerTimes | null): SkyPhaseInfo {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const phase = getSkyPhase(prayerTimes, now);
    const meta = PHASE_META[phase];
    return { phase, label: meta.label, accent: meta.accent, isNight: meta.isNight };
  }, [prayerTimes, now]);
}
