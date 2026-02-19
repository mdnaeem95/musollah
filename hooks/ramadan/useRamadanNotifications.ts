/**
 * Ramadan Notifications Hook
 *
 * Manages scheduling/cancelling Ramadan notifications
 * based on user preferences and current Ramadan state.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import { useEffect, useRef } from 'react';
import { useRamadanStore, useRamadanNotifPrefs } from '../../stores/useRamadanStore';
import { useRamadanDetection } from './useRamadanDetection';
import { ramadanNotificationService } from '../../services/notifications/ramadanNotificationService';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Ramadan Notifications Hook');

/**
 * Auto-schedules Ramadan notifications when:
 * - Ramadan is active
 * - Preferences change
 * - Day changes
 */
export function useRamadanNotifications() {
  const prefs = useRamadanNotifPrefs();
  const tracker = useRamadanStore((s) => s.tracker);
  const { data: detection } = useRamadanDetection();
  const lastScheduledDay = useRef<number>(0);

  useEffect(() => {
    if (!detection?.isRamadan || !tracker) {
      return;
    }

    const currentDay = detection.currentDay;
    if (currentDay === lastScheduledDay.current) {
      return; // Already scheduled for today
    }

    logger.info('Scheduling Ramadan notifications', {
      day: currentDay,
      totalDays: tracker.totalDays,
    });

    lastScheduledDay.current = currentDay;

    ramadanNotificationService.scheduleNotifications(
      prefs,
      currentDay,
      tracker.totalDays
    );
  }, [detection?.isRamadan, detection?.currentDay, prefs, tracker]);

  // Cancel when Ramadan ends or mode is disabled
  useEffect(() => {
    return () => {
      ramadanNotificationService.cancelAllRamadanNotifications();
    };
  }, []);
}
