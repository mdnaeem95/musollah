/**
 * DoaItem - Modern Design
 *
 * Individual dua card with Arabic text, romanization, and translation
 *
 * @version 3.0 - Redesigned with glass card, number badge, clean dividers
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '../../../context/ThemeContext';
import type { DoaAfterPrayer } from '../../../types/doa.types';

interface DoaItemProps {
  item: DoaAfterPrayer;
  index: number;
}

const DoaItem: React.FC<DoaItemProps> = ({ item, index }) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <BlurView
      intensity={22}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.9)',
          borderColor: 'rgba(255,255,255,0.12)',
        },
      ]}
    >
      {/* Number badge */}
      <View style={[styles.numberBadge, { backgroundColor: theme.colors.accent + '20' }]}>
        <Text style={[styles.numberText, { color: theme.colors.accent }]}>{index + 1}</Text>
      </View>

      {/* Arabic Text */}
      <View style={styles.arabicSection}>
        <Text
          style={[
            styles.arabicText,
            {
              color: theme.colors.text.primary,
              textShadowColor: 'rgba(0,0,0,0.1)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            },
          ]}
        >
          {item.arabicText}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

      {/* Romanization */}
      <View style={styles.romanizationSection}>
        <Text style={[styles.romanizationLabel, { color: theme.colors.text.muted }]}>Romanization</Text>
        <Text style={[styles.romanizationText, { color: theme.colors.text.secondary }]}>
          {item.romanized}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

      {/* Translation */}
      <View style={styles.translationSection}>
        <Text style={[styles.translationLabel, { color: theme.colors.text.muted }]}>Translation</Text>
        <Text style={[styles.translationText, { color: theme.colors.text.primary }]}>
          {item.englishTranslation}
        </Text>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Number badge
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  numberText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: 4,
  },

  // Arabic Section
  arabicSection: {
    paddingVertical: 4,
  },
  arabicText: {
    fontSize: 26,
    fontFamily: 'Amiri_400Regular',
    lineHeight: 44,
    textAlign: 'right',
  },

  // Romanization Section
  romanizationSection: {
    gap: 4,
  },
  romanizationLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  romanizationText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 22,
  },

  // Translation Section
  translationSection: {
    gap: 4,
  },
  translationLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  translationText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 23,
    fontStyle: 'italic',
  },
});

export default DoaItem;
