import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated, Easing, Switch } from 'react-native';
import { ThemeContext } from '../../../../context/ThemeContext';

const Appearance = () => {
  const { theme, currentTheme, switchTheme, isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light; // Access the correct theme dynamically
  const themes = ['green', 'blue', 'purple'];

  const [animatedValues, setAnimatedValues] = useState(() =>
    themes.reduce((acc, themeName) => {
      acc[themeName] = new Animated.Value(currentTheme === themeName ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  );

  const handleThemeChange = (themeName: string) => {
    Object.keys(animatedValues).forEach((key) => {
      Animated.timing(animatedValues[key], {
        toValue: key === themeName ? 1 : 0,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    });
    switchTheme(themeName);
  };

  const styles = createStyles(activeTheme);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.settingsContainer}>
        <Text style={styles.title}>Theme</Text>

        {/* Theme Selection */}
        <View style={styles.checkboxContainer}>
          {themes.map((themeName) => {
            const animatedColor = animatedValues[themeName].interpolate({
              inputRange: [0, 1],
              outputRange: [activeTheme.colors.text.muted, activeTheme.colors.accent],
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
                        borderColor: activeTheme.colors.text.primary,
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
              false: activeTheme.colors.text.muted,
              true: activeTheme.colors.accent,
            }}
            thumbColor={isDarkMode ? activeTheme.colors.primary : activeTheme.colors.secondary}
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
