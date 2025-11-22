import { Platform } from 'react-native';

// ✅ Analytics modular imports
import { getAnalytics, logEvent, setUserId as setAnalyticsUserId, setUserProperty } from '@react-native-firebase/analytics';

// ✅ Crashlytics modular imports
import { getCrashlytics, recordError, setAttribute, setUserId as setCrashUserId } from '@react-native-firebase/crashlytics';

const analyticsInstance = getAnalytics();
const crashlyticsInstance = getCrashlytics();

class AnalyticsService {
  async trackEvent(eventName: string, params: Record<string, any> = {}) {
    try {
      await logEvent(analyticsInstance, eventName, {
        ...params,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  async trackScreenView(screenName: string, params: Record<string, any> = {}) {
    try {
      // Manual screen tracking via GA4 reserved event
      await logEvent(analyticsInstance, 'screen_view', {
        firebase_screen: screenName,
        firebase_screen_class: screenName,
        ...params,
      });
    } catch (error) {
      console.error('Screen tracking error:', error);
    }
  }

  async setUserProperties(properties: Record<string, string>) {
    try {
      for (const [key, value] of Object.entries(properties)) {
        await setUserProperty(analyticsInstance, key, value);
      }
    } catch (error) {
      console.error('User properties error:', error);
    }
  }

  async logError(error: Error, context?: Record<string, any>) {
    try {
      // recordError(instance, error, name?) — signature may vary slightly by version
      await recordError(crashlyticsInstance, error, error.name);

      if (context) {
        for (const [key, value] of Object.entries(context)) {
          await setAttribute(crashlyticsInstance, key, String(value));
        }
      }
    } catch (e) {
      console.error('Crashlytics error:', e);
    }
  }

  async setUserId(userId: string) {
    try {
      await setAnalyticsUserId(analyticsInstance, userId);
      await setCrashUserId(crashlyticsInstance, userId);
    } catch (error) {
      console.error('Set user ID error:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
