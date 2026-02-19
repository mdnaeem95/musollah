import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Accessibility');

/**
 * Custom hook for accessibility features
 * Checks for reduce motion and screen reader settings
 */
export const useAccessibility = () => {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    // Check reduce motion setting
    const checkReduceMotion = async () => {
      if (Platform.OS === 'ios') {
        try {
          const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
          setIsReduceMotionEnabled(reduceMotion);
        } catch (error) {
          logger.warn('Error checking reduce motion:', { error });
        }
      }
    };

    // Check screen reader setting
    const checkScreenReader = async () => {
      try {
        const screenReader = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(screenReader);
      } catch (error) {
        logger.warn('Error checking screen reader:', { error });
      }
    };

    checkReduceMotion();
    checkScreenReader();

    // Listen for changes
    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => {
      reduceMotionSubscription?.remove();
      screenReaderSubscription?.remove();
    };
  }, []);

  return {
    isReduceMotionEnabled,
    isScreenReaderEnabled,
  };
};