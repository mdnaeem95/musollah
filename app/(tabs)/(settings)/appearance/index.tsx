import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Switch,
} from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';

const Appearance = () => {
 const { theme, currentTheme, switchTheme, isDarkMode, toggleDarkMode } = useTheme();
  const themes = ['green', 'blue', 'purple']; // Available themes

  const [animatedValues, setAnimatedValues] = useState(() =>
    themes.reduce((acc, themeName) => {
      //@ts-ignore
      acc[themeName] = new Animated.Value(currentTheme === themeName ? 1 : 0);
      return acc;
    }, {})
  );

  const handleThemeChange = (themeName: any) => {
    Object.keys(animatedValues).forEach((key) => {
      //@ts-ignore
      Animated.timing(animatedValues[key], {
        toValue: key === themeName ? 1 : 0,
        duration: 300, // Smooth transition
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    });
    switchTheme(themeName);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.settingsContainer}>
        <Text style={styles.title}>Theme</Text>

        {/* Theme Selection */}
        <View style={styles.checkboxContainer}>
          {themes.map((themeName: any) => {
            //@ts-ignore
            const animatedColor = animatedValues[themeName].interpolate({
              inputRange: [0, 1],
              outputRange: [
                theme.colors.text.muted,
                theme.colors.accent,
              ],
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
            onValueChange={toggleDarkMode}
            trackColor={{
              false: theme.colors.text.muted,
              true: theme.colors.accent,
            }}
            thumbColor={
              isDarkMode
                ? theme.colors.primary
                : theme.colors.secondary
            }
          />
        </View>
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
