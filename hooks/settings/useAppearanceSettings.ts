/**
 * Appearance Settings Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Theme change tracking and animation monitoring
 * 
 * Business logic for appearance settings screen.
 * Handles theme switching (green/blue/purple) and dark mode.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useState, useMemo, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useThemeTransition } from './useThemeTransition';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Appearance Settings');

type ThemeName = 'green' | 'blue' | 'purple';

/**
 * Hook for appearance settings page
 * Manages theme selection and dark mode with animations
 * 
 * @returns {Object} Theme state and actions
 */
export function useAppearanceSettings() {
  const { theme, currentTheme, switchTheme, isDarkMode, toggleDarkMode } = useTheme();
  const { themeTransitionAnim, triggerThemeTransition } = useThemeTransition();
  
  const themes: ThemeName[] = ['green', 'blue', 'purple'];
  const [transitionColor, setTransitionColor] = useState(theme.colors.primary);

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Appearance settings hook mounted', {
      currentTheme,
      isDarkMode,
      transitionColor,
    });
    
    return () => {
      logger.debug('Appearance settings hook unmounted');
    };
  }, []);

  // Initialize animated values for theme selection
  const animatedValues = useMemo(() => {
    logger.debug('Initializing theme animations', {
      currentTheme,
      themes,
    });

    return themes.reduce((acc, themeName) => {
      acc[themeName] = new Animated.Value(currentTheme === themeName ? 1 : 0);
      return acc;
    }, {} as Record<ThemeName, Animated.Value>);
  }, [currentTheme]);

  // ============================================================================
  // THEME CHANGE
  // ============================================================================

  const handleThemeChange = (themeName: ThemeName) => {
    if (themeName === currentTheme) {
      logger.debug('Theme already selected', { theme: themeName });
      return;
    }

    logger.info('Theme change initiated', {
      from: currentTheme,
      to: themeName,
    });

    logger.time('theme-transition');

    // Set transition color
    setTransitionColor(theme.colors.primary);

    // Trigger transition animation with theme switch
    triggerThemeTransition(() => {
      logger.debug('Switching theme mid-transition', { newTheme: themeName });
      switchTheme(themeName);
    });

    // Animate theme selection indicators
    logger.debug('Animating theme indicators...');
    
    Object.entries(animatedValues).forEach(([key, animValue]) => {
      Animated.timing(animValue, {
        toValue: key === themeName ? 1 : 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        if (key === themeName) {
          logger.timeEnd('theme-transition');
          logger.success('Theme changed successfully', {
            newTheme: themeName,
          });
        }
      });
    });
  };

  // ============================================================================
  // DARK MODE TOGGLE
  // ============================================================================

  const handleDarkModeToggle = () => {
    logger.info('Dark mode toggle initiated', {
      currentMode: isDarkMode ? 'dark' : 'light',
      newMode: isDarkMode ? 'light' : 'dark',
    });

    logger.time('dark-mode-transition');

    setTransitionColor(theme.colors.primary);
    
    triggerThemeTransition(() => {
      logger.debug('Toggling dark mode mid-transition');
      toggleDarkMode();
      
      logger.timeEnd('dark-mode-transition');
      logger.success('Dark mode toggled', {
        newMode: !isDarkMode ? 'dark' : 'light',
      });
    });
  };

  return {
    theme,
    currentTheme,
    themes,
    isDarkMode,
    transitionColor,
    themeTransitionAnim,
    animatedValues,
    handleThemeChange,
    handleDarkModeToggle,
  };
}