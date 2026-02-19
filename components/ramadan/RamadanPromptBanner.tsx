/**
 * Ramadan Prompt Banner
 *
 * Shows a banner 3 days before Ramadan starts prompting
 * users to enable Ramadan Mode. Dismissible.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useRamadanDetection } from '../../hooks/ramadan/useRamadanDetection';
import { useHasSeenRamadanPrompt, useRamadanStore } from '../../stores/useRamadanStore';
import { useRamadanMode, usePreferencesStore } from '../../stores/userPreferencesStore';

const RamadanPromptBanner = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: detection } = useRamadanDetection();
  const hasSeenPrompt = useHasSeenRamadanPrompt();
  const markPromptSeen = useRamadanStore((s) => s.markRamadanPromptSeen);
  const isRamadanMode = useRamadanMode();
  const toggleRamadanMode = usePreferencesStore((s) => s.toggleRamadanMode);

  // Only show when Ramadan is approaching and user hasn't seen it
  if (!detection?.isApproaching || hasSeenPrompt || isRamadanMode) {
    return null;
  }

  const handleEnable = () => {
    toggleRamadanMode();
    markPromptSeen();
  };

  const handleDismiss = () => {
    markPromptSeen();
  };

  const styles = createStyles(theme);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
    >
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.iconContainer}>
            <FontAwesome6 name="moon" size={22} color="#FFD700" solid />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Ramadan is Approaching!</Text>
            <Text style={styles.subtitle}>
              {detection.daysUntilRamadan} days until Ramadan. Enable Ramadan
              Mode for fasting tracker, tarawih logger, and more.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleEnable}
            activeOpacity={0.8}
          >
            <Text style={styles.enableButtonText}>Enable Ramadan Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Text style={styles.dismissButtonText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    banner: {
      backgroundColor: '#1a1a2e',
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    bannerContent: {
      flexDirection: 'row',
      gap: 14,
      marginBottom: 14,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: '#FFD700',
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: 18,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    enableButton: {
      flex: 1,
      backgroundColor: '#FFD700',
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    enableButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 14,
      color: '#1a1a2e',
    },
    dismissButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      justifyContent: 'center',
    },
    dismissButtonText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.5)',
    },
  });

export default RamadanPromptBanner;
