/**
 * Theme Transition Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Animation monitoring
 * 
 * Provides smooth animated transitions between themes.
 * Used by appearance settings and header components.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Theme Transition');

/**
 * Hook for theme transition animations
 * Provides animated value and trigger function
 * 
 * @returns {Object} Animation value and trigger function
 * 
 * @example
 * ```tsx
 * const { themeTransitionAnim, triggerThemeTransition } = useThemeTransition();
 * 
 * const handleThemeChange = () => {
 *   triggerThemeTransition(() => switchTheme('blue'));
 * };
 * 
 * <Animated.View style={{ opacity: themeTransitionAnim }}>
 *   {children}
 * </Animated.View>
 * ```
 */
export const useThemeTransition = () => {
  const themeTransitionAnim = useRef(new Animated.Value(0)).current;

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Theme transition hook mounted');
    
    return () => {
      logger.debug('Theme transition hook unmounted');
    };
  }, []);

  /**
   * Trigger theme transition animation
   * Fades out, calls callback at midpoint, then fades in
   * 
   * @param {Function} onMidway - Callback to execute at animation midpoint
   */
  const triggerThemeTransition = (onMidway: () => void) => {
    logger.info('Theme transition triggered');
    logger.time('theme-transition-animation');

    // Reset animation value
    themeTransitionAnim.setValue(0);

    // ============================================
    // Phase 1: Fade out (0 → 1)
    // ============================================
    logger.debug('Phase 1: Fading out...');
    
    Animated.timing(themeTransitionAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      logger.debug('Phase 1 complete (fully faded out)');

      // ============================================
      // Midpoint: Execute theme change
      // ============================================
      logger.debug('Executing midpoint callback (theme change)');
      
      onMidway?.();

      // ============================================
      // Phase 2: Fade in (1 → 0)
      // ============================================
      logger.debug('Phase 2: Fading in...');
      
      Animated.timing(themeTransitionAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        logger.timeEnd('theme-transition-animation');
        logger.success('Theme transition animation complete', {
          totalDuration: '600ms',
        });
      });
    });
  };

  return { themeTransitionAnim, triggerThemeTransition };
};