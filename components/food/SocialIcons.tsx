/**
 * Social Icons Component (MODERN REDESIGN)
 * 
 * Beautiful social media links display with:
 * - Conditional rendering (only shows if URL exists)
 * - Glassmorphism design
 * - Platform-specific colors
 * - Deep linking to native apps
 * - Smooth animations
 * - Empty state handling
 * 
 * @version 2.0 - Complete redesign
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// ============================================================================
// TYPES
// ============================================================================

interface Socials {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  number?: string;
}

interface Props {
  socials: Socials;
}

// ============================================================================
// SOCIAL PLATFORM CONFIG
// ============================================================================

interface SocialPlatform {
  key: keyof Socials;
  label: string;
  icon: string;
  color: string;
  getDeepLink: (handle: string) => string;
  getWebLink: (handle: string) => string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    getDeepLink: (handle) => `instagram://user?username=${handle.replace('@', '')}`,
    getWebLink: (handle) => `https://instagram.com/${handle.replace('@', '')}`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    getDeepLink: (handle) => `fb://profile/${handle}`,
    getWebLink: (handle) => `https://facebook.com/${handle}`,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: 'tiktok',
    color: '#FF0050',
    getDeepLink: (handle) => `tiktok://user?username=${handle.replace('@', '')}`,
    getWebLink: (handle) => `https://tiktok.com/@${handle.replace('@', '')}`,
  },
  {
    key: 'number',
    label: 'Phone',
    icon: 'phone',
    color: '#4CAF50',
    getDeepLink: (number) => `tel:${number}`,
    getWebLink: (number) => `tel:${number}`,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const SocialIcons: React.FC<Props> = ({ socials }) => {
  const { theme, isDarkMode } = useTheme();

  // Filter to only platforms that have data
  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    (platform) => socials[platform.key]
  );

  // Empty state - no socials available
  if (availablePlatforms.length === 0) {
    return (
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.emptyContainer}
      >
        <FontAwesome6
          name="share-nodes"
          size={24}
          color={theme.colors.text.muted}
          style={{ marginBottom: 8 }}
        />
        <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>
          No social media links available
        </Text>
      </MotiView>
    );
  }

  const handleSocialPress = async (platform: SocialPlatform) => {
    const handle = socials[platform.key];
    if (!handle) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Try deep link first (opens native app)
      const deepLink = platform.getDeepLink(handle);
      const canOpen = await Linking.canOpenURL(deepLink);

      if (canOpen) {
        await Linking.openURL(deepLink);
      } else {
        // Fallback to web link
        const webLink = platform.getWebLink(handle);
        await Linking.openURL(webLink);
      }
    } catch (error) {
      console.error('Failed to open social link:', error);
      Alert.alert(
        'Cannot Open Link',
        `Unable to open ${platform.label}. Please try again later.`
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Platform Buttons */}
      <View style={styles.buttonsGrid}>
        {availablePlatforms.map((platform, index) => (
          <MotiView
            key={platform.key}
            from={{ opacity: 0, scale: 0.9, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              damping: 25,
              delay: index * 80,
            }}
            style={styles.buttonWrapper}
          >
            <TouchableOpacity
              onPress={() => handleSocialPress(platform)}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={20}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                  styles.socialButton,
                  { backgroundColor: theme.colors.secondary },
                ]}
              >
                {/* Icon Circle */}
                <View style={[styles.iconCircle, { backgroundColor: platform.color }]}>
                  <FontAwesome6
                    name={platform.icon as any}
                    size={20}
                    color="#fff"
                  />
                </View>

                {/* Label */}
                <View style={styles.labelContainer}>
                  <Text
                    style={[styles.platformLabel, { color: theme.colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {platform.label}
                  </Text>
                  <Text
                    style={[styles.handleText, { color: theme.colors.text.secondary }]}
                    numberOfLines={1}
                  >
                    {socials[platform.key]}
                  </Text>
                </View>

                {/* Arrow Icon */}
                <FontAwesome6
                  name="chevron-right"
                  size={14}
                  color={theme.colors.text.muted}
                />
              </BlurView>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>

      {/* Helper Text */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 400 }}
        style={styles.helperContainer}
      >
        <FontAwesome6
          name="circle-info"
          size={12}
          color={theme.colors.text.muted}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.helperText, { color: theme.colors.text.muted }]}>
          Tap to open in app or browser
        </Text>
      </MotiView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Buttons Grid
  buttonsGrid: {
    gap: 12,
  },
  buttonWrapper: {
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // Icon Circle
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // Label Section
  labelContainer: {
    flex: 1,
    gap: 2,
  },
  platformLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.2,
  },
  handleText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    letterSpacing: 0.1,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },

  // Helper Text
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    fontStyle: 'italic',
  },
});

export default SocialIcons;