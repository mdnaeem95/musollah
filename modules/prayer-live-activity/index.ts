/**
 * prayer-live-activity — local Expo module
 *
 * JS wrapper around the iOS ActivityKit controller. Safe to call on any
 * platform: on Android, in Expo Go, or before the native module is built, the
 * methods no-op (the underlying native module is optional).
 */

import { requireOptionalNativeModule } from 'expo-modules-core';

interface NativePrayerLiveActivity {
  isAvailable(): boolean;
  start(nextPrayer: string, prayerTimeEpoch: number, clockLabel: string): Promise<string | null>;
  update(nextPrayer: string, prayerTimeEpoch: number, clockLabel: string): Promise<void>;
  end(): Promise<void>;
}

const native = requireOptionalNativeModule<NativePrayerLiveActivity>('PrayerLiveActivity');

export const PrayerLiveActivity = {
  /** True only on iOS 16.1+ with Live Activities enabled by the user. */
  isAvailable(): boolean {
    try {
      return native?.isAvailable() ?? false;
    } catch {
      return false;
    }
  },

  /** Start (replacing any existing) the prayer countdown Live Activity. */
  async start(nextPrayer: string, prayerTimeEpoch: number, clockLabel: string): Promise<string | null> {
    return (await native?.start(nextPrayer, prayerTimeEpoch, clockLabel)) ?? null;
  },

  /** Update the running activity — e.g. advance to the next prayer. */
  async update(nextPrayer: string, prayerTimeEpoch: number, clockLabel: string): Promise<void> {
    await native?.update(nextPrayer, prayerTimeEpoch, clockLabel);
  },

  /** End any running prayer activity. */
  async end(): Promise<void> {
    await native?.end();
  },
};
