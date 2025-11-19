import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated, Switch, StyleSheet as RNStyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppearanceSettings } from '../../../../hooks/settings/useAppearanceSettings';

const Appearance = () => {
  const {
    theme,
    currentTheme,
    themes,
    isDarkMode,
    transitionColor,
    themeTransitionAnim,
    animatedValues,
    handleThemeChange,
    handleDarkModeToggle,
  } = useAppearanceSettings();

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
          {themes.map((themeName) => {
            const animatedColor = animatedValues[themeName].interpolate({
              inputRange: [0, 1],
              outputRange: [theme.colors.text.muted, theme.colors.accent],
            });

            const isSelected = currentTheme === themeName;

            return (
              <TouchableWithoutFeedback
                key={themeName}
                onPress={() => handleThemeChange(themeName)}
              >
                <View style={styles.checkboxItem}>
                  <Text style={[styles.label, isSelected && styles.labelSelected]}>
                    {themeName.toUpperCase()}
                  </Text>
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
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              {isDarkMode ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{
              false: theme.colors.text.muted,
              true: theme.colors.accent,
            }}
            thumbColor={isDarkMode ? theme.colors.primary : theme.colors.secondary}
            ios_backgroundColor={theme.colors.text.muted}
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
      marginBottom: theme.spacing.small,
    },
    checkboxContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
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
    labelSelected: {
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.accent,
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
      borderTopWidth: 1,
      borderTopColor: theme.colors.text.muted,
      paddingTop: theme.spacing.medium,
    },
    settingInfo: {
      flex: 1,
      gap: theme.spacing.xSmall,
    },
    settingLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
    },
    settingDescription: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.small,
      color: theme.colors.text.muted,
    },
  });

export default Appearance;