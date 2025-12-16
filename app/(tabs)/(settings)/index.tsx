/**
 * Settings Tab - Modern Design
 * 
 * Main settings screen with glassmorphism and Islamic patterns
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { calculateContrastColor, enter } from '../../../utils';

// ============================================================================
// SETTINGS ITEMS DATA
// ============================================================================

const SETTINGS_ITEMS = [
  { icon: 'user', label: 'Account', route: '/account' },
  { icon: 'person-praying', label: 'Prayers', route: '/prayers' },
  { icon: 'palette', label: 'Appearance', route: '/appearance' },
  { icon: 'envelope', label: 'Support', route: '/support' },
  { icon: 'gift', label: 'Referral', route: '/referral' },
];

const FEATURE_CARDS = [
  { icon: 'flask', label: 'Food Additives', route: '/food-additives' },
  { icon: 'hand-holding-dollar', label: 'Zakat Calculator', route: '/zakat' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SettingsTab = () => {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Settings Section */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <SectionHeader icon="gear" label="Settings" theme={theme} />

          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.settingsCard, { backgroundColor: theme.colors.secondary }]}
          >
            {SETTINGS_ITEMS.map((item, index) => (
              <React.Fragment key={item.label}>
                <SettingsItem
                  icon={item.icon}
                  label={item.label}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(item.route as any);
                  }}
                  index={index}
                  theme={theme}
                />
                {index < SETTINGS_ITEMS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.colors.muted }]} />
                )}
              </React.Fragment>
            ))}
          </BlurView>
        </MotiView>

        {/* Other Features Section */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <SectionHeader icon="sparkles" label="Other Features" theme={theme} />

          <View style={styles.featuresGrid}>
            {FEATURE_CARDS.map((feature, index) => (
              <FeatureCard
                key={feature.label}
                icon={feature.icon}
                label={feature.label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(feature.route as any);
                }}
                index={index}
                theme={theme}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>
        </MotiView>

        {/* App Info */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', delay: 200, duration: 400 }}
          style={styles.appInfo}
        >
          <Text style={[styles.appName, { color: theme.colors.text.secondary }]}>
            Rihlah
          </Text>
          <Text style={[styles.appVersion, { color: theme.colors.text.muted }]}>
            Version 2.0.0
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

const SectionHeader = ({ 
  icon, 
  label, 
  theme 
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
// SETTINGS ITEM COMPONENT
// ============================================================================

const SettingsItem = ({
  icon,
  label,
  onPress,
  index,
  theme,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  index: number;
  theme: any;
}) => {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={enter(0)}
    >
      <TouchableOpacity
        onPress={onPress}
        style={styles.settingsItem}
        activeOpacity={0.7}
      >
        {/* Icon Badge */}
        <View style={[styles.itemIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name={icon} size={18} color={theme.colors.accent} />
        </View>

        {/* Label */}
        <Text style={[styles.itemLabel, { color: theme.colors.text.primary }]}>
          {label}
        </Text>

        {/* Chevron */}
        <FontAwesome6
          name="chevron-right"
          size={18}
          color={theme.colors.text.muted}
        />
      </TouchableOpacity>
    </MotiView>
  );
};

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================

const FeatureCard = ({
  icon,
  label,
  onPress,
  index,
  theme,
  isDarkMode,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  index: number;
  theme: any;
  isDarkMode: boolean;
}) => {
  const accentBg = theme.colors.accent;
  const accentText = calculateContrastColor(accentBg);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
      style={styles.featureCardWrapper}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.featureCard, { backgroundColor: theme.colors.secondary }]}
        >
          {/* Icon Badge */}
          <View style={[styles.featureIcon, { backgroundColor: accentBg }]}>
            <FontAwesome6 name={icon} size={28} color={accentText} />
          </View>

          {/* Label */}
          <Text style={[styles.featureLabel, { color: theme.colors.text.primary }]}>
            {label}
          </Text>
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
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
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Settings Card
  settingsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Settings Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  divider: {
    height: 1,
    marginLeft: 58, // Align with text after icon
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  featureCardWrapper: {
    flex: 1,
  },
  featureCard: {
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featureLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    lineHeight: 18,
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    gap: 4,
  },
  appName: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  appVersion: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
});

export default SettingsTab;