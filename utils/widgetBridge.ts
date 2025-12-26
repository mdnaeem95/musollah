// utils/widgetBridge.ts
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import type { NormalizedPrayerTimes } from '../api/services/prayer/types';

const APP_GROUP_IDENTIFIER = 'group.com.rihlah.prayerTimesWidget';

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
    console.log('⏭️ Skipping widget update (not iOS)');
    return;
  }
  
  if (!prayerTimesData || prayerTimesData.length === 0) {
    console.log('⏭️ Skipping widget update (no data)');
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
        console.warn('⚠️ Unknown date format:', day.date);
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
      console.log('📊 Widget data sample:', {
        date: widgetData[0].date,
        subuh: widgetData[0].time.subuh,
      });
    }
    
    const jsonString = JSON.stringify(widgetData);
    
    // Write prayer times data
    await SharedGroupPreferences.setItem(
      'prayerTimes2025',
      jsonString,
      APP_GROUP_IDENTIFIER
    );
    
    // Write timestamp
    await SharedGroupPreferences.setItem(
      'lastUpdated',
      new Date().toISOString(),
      APP_GROUP_IDENTIFIER
    );
    
    console.log('✅ Widget data updated:', {
      count: widgetData.length,
      firstDate: widgetData[0]?.date,
      lastDate: widgetData[widgetData.length - 1]?.date,
    });
    
    // Note: Widget will auto-reload based on its timeline configuration
    
  } catch (error) {
    console.error('❌ Failed to update widget:', error);
    // Don't throw - widget failure shouldn't crash app
  }
}

/**
 * Manually trigger widget update (for debug/testing)
 */
export async function forceWidgetUpdate(prayerTimesData: DailyPrayerData[]) {
  console.log('🔄 Force updating widget...');
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
    const data = await SharedGroupPreferences.getItem(
      'prayerTimes2025',
      APP_GROUP_IDENTIFIER
    );
    
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
    console.warn('⚠️ Failed to get widget status:', error);
    return { hasData: false, lastUpdated: null };
  }
}