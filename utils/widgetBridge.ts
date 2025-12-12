// utils/widgetBridge.ts
import { Platform } from 'react-native';
import { DailyPrayerTimes } from './types/prayer.types';

/**
 * Updates iOS widget with prayer times data
 * Called after fetching monthly prayer times from Firebase
 */
export async function updatePrayerTimesWidget(prayerTimesData: DailyPrayerTimes[]) {
  if (Platform.OS !== 'ios') {
    console.log('⏭️ Skipping widget update (not iOS)');
    return;
  }
  
  if (!prayerTimesData || prayerTimesData.length === 0) {
    console.log('⏭️ Skipping widget update (no data)');
    return;
  }
  
  try {
    const SharedGroupPreferences = require('react-native-shared-group-preferences');
    const appGroupIdentifier = 'group.com.rihlah.prayerTimesWidget';
    
    // ✅ Transform to widget format
    const widgetData = prayerTimesData.map(day => {
      // Convert ISO date (2025-01-19) to Firebase format (19/1/2025)
      const [year, month, dayNum] = day.date.split('-');
      const firebaseDate = `${parseInt(dayNum, 10)}/${parseInt(month, 10)}/${year}`;
      
      return {
        date: firebaseDate, // Widget expects "d/M/yyyy" format
        time: {
          subuh: day.prayers.Subuh,
          syuruk: day.prayers.Syuruk,
          zohor: day.prayers.Zohor,
          asar: day.prayers.Asar,
          maghrib: day.prayers.Maghrib,
          isyak: day.prayers.Isyak,
        }
      };
    });
    
    const jsonString = JSON.stringify(widgetData);
    
    await SharedGroupPreferences.setItem(
      'prayerTimes2025',
      jsonString,
      appGroupIdentifier
    );
    
    // Add timestamp for debugging
    await SharedGroupPreferences.setItem(
      'lastUpdated',
      new Date().toISOString(),
      appGroupIdentifier
    );
    
    console.log('✅ Widget data updated:', {
      count: widgetData.length,
      firstDate: widgetData[0]?.date,
      lastDate: widgetData[widgetData.length - 1]?.date,
      timestamp: new Date().toISOString()
    });
    
    // Reload widgets
    const WidgetCenter = require('react-native-widgetcenter');
    WidgetCenter.reloadAllTimelines();
    
  } catch (error) {
    console.error('❌ Failed to update widget:', error);
    throw error; // Re-throw so caller knows it failed
  }
}

/**
 * Manually trigger widget update (for debug/testing)
 */
export async function forceWidgetUpdate(prayerTimesData: DailyPrayerTimes[]) {
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
    const SharedGroupPreferences = require('react-native-shared-group-preferences');
    const appGroupIdentifier = 'group.com.rihlah.prayerTimesWidget';
    
    const data = await SharedGroupPreferences.getItem(
      'prayerTimes2025',
      appGroupIdentifier
    );
    
    const timestamp = await SharedGroupPreferences.getItem(
      'lastUpdated',
      appGroupIdentifier
    );
    
    return {
      hasData: !!data,
      dataLength: data ? JSON.parse(data).length : 0,
      lastUpdated: timestamp,
    };
  } catch (error) {
    console.error('❌ Failed to get widget status:', error);
    return { hasData: false, lastUpdated: null };
  }
}