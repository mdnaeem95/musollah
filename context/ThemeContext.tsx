import React, { createContext, useContext, useMemo } from 'react';
import { Animated } from 'react-native'; // ✅ correct import
import { usePreferencesStore } from '../stores/userPreferencesStore';
import { greenTheme, blueTheme, purpleTheme } from '../theme/theme';
import { useThemeTransition } from '../hooks/useThemeTransition';

// Theme object mapping
const themes = {
  green: greenTheme,
  blue: blueTheme,
  purple: purpleTheme,
};

// Types
export type ThemeType = typeof greenTheme['light'] | typeof greenTheme['dark'];
export type ThemeColor = 'green' | 'blue' | 'purple';

interface ThemeContextValue {
  theme: ThemeType;
  currentTheme: ThemeColor;
  isDarkMode: boolean;
  switchTheme: (themeName: ThemeColor) => void;
  toggleDarkMode: () => void;
  switchThemeAnimated: (themeName: ThemeColor) => void;
  toggleDarkModeAnimated: () => void;
  textSize: number;
  setTextSize: (size: number) => void;
  reciter: string;
  setReciter: (reciter: string) => void;
}

// Context with default values
const ThemeContext = createContext<ThemeContextValue>({
  theme: greenTheme.light,
  currentTheme: 'green',
  isDarkMode: false,
  switchTheme: () => {},
  toggleDarkMode: () => {},
  switchThemeAnimated: () => {},
  toggleDarkModeAnimated: () => {},
  textSize: 30,
  setTextSize: () => {},
  reciter: 'ar.alafasy',
  setReciter: () => {},
});

/**
 * Theme Provider using Zustand
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeTransitionAnim, triggerThemeTransition } = useThemeTransition();

  // Selective subscriptions for performance
  const currentThemeName = usePreferencesStore(state => state.theme);
  const isDarkMode = usePreferencesStore(state => state.isDarkMode);
  const textSize = usePreferencesStore(state => state.textSize);
  const reciter = usePreferencesStore(state => state.reciter);

  // Actions
  const setTheme = usePreferencesStore(state => state.setTheme);
  const toggleDarkMode = usePreferencesStore(state => state.toggleDarkMode);
  const setTextSize = usePreferencesStore(state => state.setTextSize);
  const setReciter = usePreferencesStore(state => state.setReciter);

  // Memoized theme object
  const theme = useMemo(
    () => (isDarkMode ? themes[currentThemeName].dark : themes[currentThemeName].light),
    [currentThemeName, isDarkMode]
  );

  // Animated wrappers
  const switchThemeAnimated = (themeName: ThemeColor) => {
    triggerThemeTransition(() => setTheme(themeName));
  };

  const toggleDarkModeAnimated = () => {
    triggerThemeTransition(() => toggleDarkMode());
  };

  // Global transition styles (opacity + scale)
  const transitionStyle = useMemo(() => {
    const opacity = themeTransitionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });

    const scale = themeTransitionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.98],
    });

    return {
      opacity,
      transform: [{ scale }], // ✅ scale is an Animated node -> valid
    };
  }, [themeTransitionAnim]);

  // Memoized context value
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      currentTheme: currentThemeName,
      isDarkMode,
      switchTheme: setTheme,
      toggleDarkMode,
      switchThemeAnimated,
      toggleDarkModeAnimated,
      textSize,
      setTextSize,
      reciter,
      setReciter,
    }),
    [
      theme,
      currentThemeName,
      isDarkMode,
      setTheme,
      toggleDarkMode,
      textSize,
      setTextSize,
      reciter,
      setReciter,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>
      <Animated.View style={[{ flex: 1 }, transitionStyle]}>
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Export for backwards compatibility
export { themes };
