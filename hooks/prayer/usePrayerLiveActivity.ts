/**
 * usePrayerLiveActivity
 *
 * Starts / advances the iOS prayer-countdown Live Activity as the next prayer
 * changes. The Live Activity counts down on-device (SwiftUI timer text), so we
 * only need to (re)start it when the next prayer advances — no per-second
 * bridge traffic. No-ops on Android and on iOS < 16.1.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { PrayerLiveActivity } from '../../modules/prayer-live-activity';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Prayer Live Activity');

interface NextPrayerInfo {
  prayer: string;       // e.g. "Zohor"
  minutesUntil: number;
}

/** "13:08" -> "1:08 PM" */
function formatClock12(hhmm?: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function usePrayerLiveActivity(
  nextPrayerInfo: NextPrayerInfo | null | undefined,
  prayerTimes: Record<string, any> | null | undefined
) {
  const prayerName = nextPrayerInfo?.prayer;

  useEffect(() => {
    if (Platform.OS !== 'ios' || !prayerName || !nextPrayerInfo) return;
    if (!PrayerLiveActivity.isAvailable()) return;

    // Target epoch (seconds). minutesUntil is captured at the moment the prayer
    // advances; the on-device timer then counts down to it.
    const targetEpoch = Date.now() / 1000 + Math.max(0, nextPrayerInfo.minutesUntil) * 60;
    const clockLabel = formatClock12(prayerTimes?.[prayerName.toLowerCase()]);

    PrayerLiveActivity.start(prayerName, targetEpoch, clockLabel)
      .then((id) => id && logger.info('Prayer Live Activity started', { prayer: prayerName }))
      .catch((e) => logger.warn('Failed to start prayer Live Activity', { error: String(e) }));
    // Intentionally keyed only on the prayer name — restart when it advances.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prayerName]);
}
