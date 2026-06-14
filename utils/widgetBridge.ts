// utils/widgetBridge.ts
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import type { NormalizedPrayerTimes } from '../api/services/prayer/types';
import { createLogger } from '../services/logging/logger';

const logger = createLogger('Widget');

const APP_GROUP_IDENTIFIER = 'group.com.rihlah.prayerTimesWidget';

/**
 * Shared-storage key for the widget's prayer-times payload.
 *
 * This is a year-agnostic app-group key (NOT a Firestore collection). The
 * payload itself already contains every day's date, so the key must not encode
 * a year. `LEGACY_WIDGET_KEY` is the old hardcoded name kept for backward
 * compatibility: we keep writing it so an older native widget build (which may
 * still read it after a JS-only OTA update) keeps working. Readers prefer the
 * new key and fall back to the legacy one. The legacy write can be removed once
 * every shipped native build reads `WIDGET_PRAYER_TIMES_KEY`.
 */
const WIDGET_PRAYER_TIMES_KEY = 'prayerTimesData';
const LEGACY_WIDGET_KEY = 'prayerTimes2025';

/**
 * Daily prayer data with date (for widget)
 * Extends normalized prayer times with date field
 */
export interface DailyPrayerData extends NormalizedPrayerTimes {
  date: string; // ISO format: "YYYY-MM-DD"
}

/**
 * Updates iOS widget with prayer times data
 * Widget will automatically reload when shared data changes
 * 
 * @param prayerTimesData - Array of daily prayer times in normalized format
 */
export async function updatePrayerTimesWidget(prayerTimesData: DailyPrayerData[]) {
  if (Platform.OS !== 'ios') {
    logger.debug('Skipping widget update (not iOS)');
    return;
  }
  
  if (!prayerTimesData || prayerTimesData.length === 0) {
    logger.debug('Skipping widget update (no data)');
    return;
  }
  
  try {
    // Transform to widget format
    const widgetData = prayerTimesData.map(day => {
      // Handle both ISO (YYYY-MM-DD) and Firebase (D/M/YYYY) formats
      let firebaseDate: string;
      
      if (day.date.includes('-')) {
        // ISO format: YYYY-MM-DD → D/M/YYYY
        const [year, month, dayNum] = day.date.split('-');
        firebaseDate = `${parseInt(dayNum, 10)}/${parseInt(month, 10)}/${year}`;
      } else if (day.date.includes('/')) {
        // Already in Firebase format: D/M/YYYY
        firebaseDate = day.date;
      } else {
        // Fallback
        logger.warn('Unknown date format', { date: day.date });
        firebaseDate = day.date;
      }
      
      return {
        date: firebaseDate,
        time: {
          // ✅ Use flat structure (new API format)
          subuh: day.subuh,
          syuruk: day.syuruk,
          zohor: day.zohor,
          asar: day.asar,
          maghrib: day.maghrib,
          isyak: day.isyak,
        }
      };
    });
    
    // Debug: Log first entry to verify format
    if (widgetData.length > 0) {
      logger.debug('Widget data sample', {
        date: widgetData[0].date,
        subuh: widgetData[0].time.subuh,
      });
    }
    
    const jsonString = JSON.stringify(widgetData);
    
    // Write prayer times data under the year-agnostic key, plus the legacy key
    // so an older native widget build keeps working after a JS-only OTA update.
    await SharedGroupPreferences.setItem(
      WIDGET_PRAYER_TIMES_KEY,
      jsonString,
      APP_GROUP_IDENTIFIER
    );
    await SharedGroupPreferences.setItem(
      LEGACY_WIDGET_KEY,
      jsonString,
      APP_GROUP_IDENTIFIER
    );
    
    // Write timestamp
    await SharedGroupPreferences.setItem(
      'lastUpdated',
      new Date().toISOString(),
      APP_GROUP_IDENTIFIER
    );
    
    logger.info('Widget data updated', {
      count: widgetData.length,
      firstDate: widgetData[0]?.date,
      lastDate: widgetData[widgetData.length - 1]?.date,
    });
    
    // Note: Widget will auto-reload based on its timeline configuration
    
  } catch (error) {
    logger.error('Failed to update widget', error as Error);
    // Don't throw - widget failure shouldn't crash app
  }
}

/**
 * Manually trigger widget update (for debug/testing)
 */
export async function forceWidgetUpdate(prayerTimesData: DailyPrayerData[]) {
  logger.info('Force updating widget...');
  await updatePrayerTimesWidget(prayerTimesData);
}

/**
 * Check if widget data exists and when it was last updated
 */
export async function getWidgetStatus() {
  if (Platform.OS !== 'ios') {
    return { hasData: false, lastUpdated: null };
  }
  
  try {
    const data =
      (await SharedGroupPreferences.getItem(WIDGET_PRAYER_TIMES_KEY, APP_GROUP_IDENTIFIER)) ??
      (await SharedGroupPreferences.getItem(LEGACY_WIDGET_KEY, APP_GROUP_IDENTIFIER));
    
    const timestamp = await SharedGroupPreferences.getItem(
      'lastUpdated',
      APP_GROUP_IDENTIFIER
    );
    
    return {
      hasData: !!data,
      dataLength: data ? JSON.parse(data).length : 0,
      lastUpdated: timestamp,
    };
  } catch (error) {
    logger.warn('Failed to get widget status', { error: (error as Error)?.message });
    return { hasData: false, lastUpdated: null };
  }
}