import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { Platform } from 'react-native';

class AnalyticsService {
  async trackEvent(eventName: string, params?: Record<string, any>) {
    try {
      await analytics().logEvent(eventName, {
        ...params,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  async trackScreenView(screenName: string, params?: Record<string, any>) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
        ...params,
      });
    } catch (error) {
      console.error('Screen tracking error:', error);
    }
  }

  async setUserProperties(properties: Record<string, string>) {
    try {
      for (const [key, value] of Object.entries(properties)) {
        await analytics().setUserProperty(key, value);
      }
    } catch (error) {
      console.error('User properties error:', error);
    }
  }

  async logError(error: Error, context?: Record<string, any>) {
    try {
      crashlytics().recordError(error, error.name);
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          crashlytics().setAttribute(key, String(value));
        });
      }
    } catch (e) {
      console.error('Crashlytics error:', e);
    }
  }

  async setUserId(userId: string) {
    try {
      await analytics().setUserId(userId);
      await crashlytics().setUserId(userId);
    } catch (error) {
      console.error('Set user ID error:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();