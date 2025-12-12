/**
 * Appearance Settings - Modern Design (FIXED LAYOUT)
 * 
 * Theme selection and dark mode toggle
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Switch, StyleSheet as RNStyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useAppearanceSettings } from '../../../../hooks/settings/useAppearanceSettings';

// Theme color mapping for preview swatches
const THEME_COLORS = {
  green: '#BFE1DB',
  blue: '#A7C7E7',
  purple: '#D8BFD8',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
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

      <View style={styles.content}>
        {/* Theme Selection Section */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <SectionHeader icon="palette" label="Theme Color" theme={theme} />

          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.themeCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.themeOptions}>
              {themes.map((themeName, index) => {
                const animatedColor = animatedValues[themeName].interpolate({
                  inputRange: [0, 1],
                  outputRange: [theme.colors.text.muted, THEME_COLORS[themeName as keyof typeof THEME_COLORS]],
                });

                const isSelected = currentTheme === themeName;

                return (
                  <MotiView
                    key={themeName}
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: 'spring',
                      delay: index * 100,
                      damping: 15,
                    }}
                    style={styles.themeOptionWrapper}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleThemeChange(themeName);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.themeOption,
                        isSelected && [
                          styles.themeOptionSelected,
                          {
                            borderColor: THEME_COLORS[themeName as keyof typeof THEME_COLORS],
                            backgroundColor: THEME_COLORS[themeName as keyof typeof THEME_COLORS] + '15',
                          },
                        ],
                      ]}
                    >
                      {/* Color Swatch */}
                      <Animated.View
                        style={[
                          styles.colorSwatch,
                          {
                            backgroundColor: animatedColor,
                          },
                        ]}
                      >
                        {isSelected && (
                          <FontAwesome6
                            name="check"
                            size={20}
                            color="#fff"
                          />
                        )}
                      </Animated.View>

                      {/* Label */}
                      <Text
                        style={[
                          styles.themeLabel,
                          { color: theme.colors.text.primary },
                          isSelected && [
                            styles.themeLabelSelected,
                            { color: THEME_COLORS[themeName as keyof typeof THEME_COLORS] },
                          ],
                        ]}
                        numberOfLines={1}
                      >
                        {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  </MotiView>
                );
              })}
            </View>
          </BlurView>
        </MotiView>

        {/* Dark Mode Section */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 150, damping: 20 }}
        >
          <SectionHeader icon="moon" label="Display Mode" theme={theme} />

          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.settingCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6
                  name={isDarkMode ? 'moon' : 'sun'}
                  size={18}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                  {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleDarkModeToggle();
                }}
                trackColor={{
                  false: theme.colors.muted,
                  true: theme.colors.accent + '80',
                }}
                thumbColor={theme.colors.primary}
                ios_backgroundColor={theme.colors.muted}
              />
            </View>
          </BlurView>
        </MotiView>

        {/* Info Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 250, damping: 20 }}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.infoCard, { backgroundColor: theme.colors.text.muted + '15' }]}
          >
            <View style={[styles.infoIcon, { backgroundColor: theme.colors.text.muted + '20' }]}>
              <FontAwesome6 name="lightbulb" size={16} color={theme.colors.text.muted} />
            </View>
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              Your theme choice will be applied throughout the app instantly
            </Text>
          </BlurView>
        </MotiView>
      </View>
    </View>
  );
};

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

const SectionHeader = ({
  icon,
  label,
  theme,
}: {
  icon: string;
  label: string;
  theme: any;
}) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
      <FontAwesome6 name={icon} size={14} color={theme.colors.accent} />
    </View>
    <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
      {label}
    </Text>
  </View>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Theme Card
  themeCard: {
    borderRadius: 16,
    paddingVertical: 24, // ✅ Increased vertical padding
    paddingHorizontal: 16, // ✅ Reduced horizontal padding
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between', // ✅ Even distribution
    gap: 8, // ✅ Smaller gap
  },
  themeOptionWrapper: {
    flex: 1, // ✅ Equal width distribution
  },
  themeOption: {
    alignItems: 'center',
    gap: 10, // ✅ Reduced gap
    paddingVertical: 12, // ✅ Better vertical padding
    paddingHorizontal: 8, // ✅ Smaller horizontal padding
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 120, // ✅ Ensure enough height for label
  },
  themeOptionSelected: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  themeLabel: {
    fontSize: 14, // ✅ Slightly smaller
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
    paddingHorizontal: 4, // ✅ Small padding to prevent cutoff
  },
  themeLabelSelected: {
    fontFamily: 'Outfit_700Bold',
  },

  // Setting Card
  settingCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
  },
});

export default Appearance;