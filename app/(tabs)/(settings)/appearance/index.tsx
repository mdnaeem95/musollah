import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Switch,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { toggleRamadanMode } from '../../../../redux/slices/userPreferencesSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { greenTheme, blueTheme, purpleTheme } from '../../../../theme/theme';
import { useThemeTransition } from '../../../../hooks/useThemeTransition'; // ✅ Shared hook

const Appearance = () => {
  const { theme, currentTheme, switchTheme, isDarkMode, toggleDarkMode } = useTheme();
  const dispatch = useDispatch();
  const { themeTransitionAnim, triggerThemeTransition } = useThemeTransition(); // ✅ Shared value
  const isRamadanMode = useSelector((state: RootState) => state.userPreferences.ramadanMode);
  const themes = ['green', 'blue', 'purple'];

  const [transitionColor, setTransitionColor] = useState(theme.colors.primary);

  const [animatedValues, setAnimatedValues] = useState(() =>
    themes.reduce((acc, themeName) => {
      //@ts-ignore
      acc[themeName] = new Animated.Value(currentTheme === themeName ? 1 : 0);
      return acc;
    }, {})
  );

  const handleThemeChange = (themeName: any) => {
    //@ts-ignore
    const nextColor = themes[themeName]?.light?.colors?.primary ?? theme.colors.primary;
    setTransitionColor(nextColor);

    triggerThemeTransition(() => switchTheme(themeName));

    Object.keys(animatedValues).forEach((key) => {
      //@ts-ignore
      Animated.timing(animatedValues[key], {
        toValue: key === themeName ? 1 : 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    });
  };

  const handleDarkModeToggle = () => {
    const nextColor = isDarkMode ? theme.colors.primary : theme.colors.primary;
    setTransitionColor(nextColor);
    triggerThemeTransition(toggleDarkMode);
  };

  const toggleRamadanModeHandler = () => {
    dispatch(toggleRamadanMode());
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      {/* Gradient overlay synced with header */}
      <Animated.View
        pointerEvents="none"
        style={[
          RNStyleSheet.absoluteFillObject,
          {
            zIndex: 100,
            elevation: 20,
            opacity: themeTransitionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            transform: [
              {
                scale: themeTransitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[transitionColor, `${transitionColor}99`, `${transitionColor}00`]}
          locations={[0, 0.4, 1]}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <View style={styles.settingsContainer}>
        <Text style={styles.title}>Theme</Text>

        {/* Theme Selection */}
        <View style={styles.checkboxContainer}>
          {themes.map((themeName: any) => {
            //@ts-ignore
            const animatedColor = animatedValues[themeName].interpolate({
              inputRange: [0, 1],
              outputRange: [theme.colors.text.muted, theme.colors.accent],
            });

            return (
              <TouchableWithoutFeedback
                key={themeName}
                onPress={() => handleThemeChange(themeName)}
              >
                <View style={styles.checkboxItem}>
                  <Text style={styles.label}>{themeName.toUpperCase()}</Text>
                  <Animated.View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: animatedColor,
                        borderColor: theme.colors.text.primary,
                      },
                    ]}
                  />
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>

        {/* Dark Mode Toggle */}
        <View style={styles.settingsField}>
          <Text style={styles.darkModeLabel}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{
              false: theme.colors.text.muted,
              true: theme.colors.accent,
            }}
            thumbColor={isDarkMode ? theme.colors.primary : theme.colors.secondary}
          />
        </View>

        {/* Ramadan Mode Toggle (Optional) */}
        {/* <View style={styles.settingsField}>
          <Text style={styles.darkModeLabel}>Ramadan Mode</Text>
          <Switch
            value={isRamadanMode}
            onValueChange={toggleRamadanModeHandler}
            trackColor={{
              false: theme.colors.text.muted,
              true: theme.colors.accent,
            }}
            thumbColor={isRamadanMode ? theme.colors.primary : theme.colors.secondary}
          />
        </View> */}
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    settingsContainer: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.medium,
      gap: theme.spacing.large,
      ...theme.shadows.default,
    },
    title: {
      fontSize: theme.fontSizes.xxLarge,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.accent,
      marginBottom: theme.spacing.large,
    },
    checkboxContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.large,
    },
    checkboxItem: {
      alignItems: 'center',
      marginHorizontal: theme.spacing.small,
    },
    label: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.small,
    },
    checkbox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
    },
    settingsField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.small,
    },
    darkModeLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
    },
  });

export default Appearance;
