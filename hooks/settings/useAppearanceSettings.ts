import { useState, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useThemeTransition } from '../useThemeTransition';

type ThemeName = 'green' | 'blue' | 'purple';

export function useAppearanceSettings() {
  const { theme, currentTheme, switchTheme, isDarkMode, toggleDarkMode } = useTheme();
  const { themeTransitionAnim, triggerThemeTransition } = useThemeTransition();
  
  const themes: ThemeName[] = ['green', 'blue', 'purple'];
  const [transitionColor, setTransitionColor] = useState(theme.colors.primary);

  // Initialize animated values for theme selection
  const animatedValues = useMemo(() => {
    return themes.reduce((acc, themeName) => {
      acc[themeName] = new Animated.Value(currentTheme === themeName ? 1 : 0);
      return acc;
    }, {} as Record<ThemeName, Animated.Value>);
  }, [currentTheme]);

  const handleThemeChange = (themeName: ThemeName) => {
    // Set transition color (could be improved with actual theme colors)
    setTransitionColor(theme.colors.primary);

    // Trigger transition animation
    triggerThemeTransition(() => switchTheme(themeName));

    // Animate theme selection indicators
    Object.entries(animatedValues).forEach(([key, animValue]) => {
      Animated.timing(animValue, {
        toValue: key === themeName ? 1 : 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    });
  };

  const handleDarkModeToggle = () => {
    setTransitionColor(theme.colors.primary);
    triggerThemeTransition(toggleDarkMode);
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