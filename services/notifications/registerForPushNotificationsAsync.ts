/**
 * Push Notification Registration
 * 
 * ✅ REFACTORED: Using structured logging + graceful simulator handling
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { createLogger } from '../logging/logger';

const logger = createLogger('Push Notifications');

/**
 * Register for push notifications
 * 
 * Returns null on simulators/non-physical devices (graceful fallback)
 * Returns token on success
 * Returns null on errors (non-critical feature)
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  logger.time('push-registration');
  
  try {
    // ========================================================================
    // Check 1: Physical Device Required (iOS/Android)
    // ========================================================================
    if (!Device.isDevice) {
      logger.warn('Push notifications not available on simulator/emulator', {
        platform: Platform.OS,
        isDevice: false,
        willContinue: 'yes (non-critical)',
      });
      logger.timeEnd('push-registration');
      return null; // ✅ Graceful fallback instead of throwing
    }

    logger.debug('Running on physical device, proceeding with registration');

    // ========================================================================
    // Check 2: Existing Permission Status
    // ========================================================================
    logger.debug('Checking existing notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    logger.debug('Existing permission status', { status: existingStatus });

    let finalStatus = existingStatus;

    // ========================================================================
    // Request Permission (if not granted)
    // ========================================================================
    if (existingStatus !== 'granted') {
      logger.info('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      
      logger.info('Permission request result', { status });
    } else {
      logger.debug('Permissions already granted');
    }

    // ========================================================================
    // Check Final Permission Status
    // ========================================================================
    if (finalStatus !== 'granted') {
      logger.warn('Notification permissions denied by user', {
        status: finalStatus,
        platform: Platform.OS,
      });
      logger.timeEnd('push-registration');
      return null; // ✅ Return null instead of throwing
    }

    // ========================================================================
    // Get Expo Push Token
    // ========================================================================
    logger.debug('Requesting Expo push token...');
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    logger.success('Push notification token obtained', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
    });

    // ========================================================================
    // Android: Configure Notification Channel
    // ========================================================================
    if (Platform.OS === 'android') {
      logger.debug('Configuring Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      logger.debug('Android notification channel configured');
    }

    logger.success('✅ Push notifications registered successfully');
    logger.timeEnd('push-registration');
    return token;

  } catch (error) {
    logger.error('Push notification registration failed', error, {
      platform: Platform.OS,
      isDevice: Device.isDevice,
    });
    logger.timeEnd('push-registration');
    
    // ✅ Return null instead of throwing (non-critical feature)
    return null;
  }
}