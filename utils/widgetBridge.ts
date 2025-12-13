// utils/widgetBridge.ts
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { DailyPrayerTimes } from './types/prayer.types';

const APP_GROUP_IDENTIFIER = 'group.com.rihlah.prayerTimesWidget';

/**
 * Updates iOS widget with prayer times data
 * Widget will automatically reload when shared data changes
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
    // Transform to widget format
    const widgetData = prayerTimesData.map(day => {
      const [year, month, dayNum] = day.date.split('-');
      const firebaseDate = `${parseInt(dayNum, 10)}/${parseInt(month, 10)}/${year}`;
      
      return {
        date: firebaseDate,
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