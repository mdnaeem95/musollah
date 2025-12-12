/**
 * DoaItem - Modern Design
 * 
 * Individual dua card with Arabic text, romanization, and translation
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
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
      intensity={20}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[styles.container, { backgroundColor: theme.colors.secondary }]}
    >
      {/* Arabic Text */}
      <View style={styles.arabicSection}>
        <Text style={[styles.arabicText, { color: theme.colors.text.primary }]}>
          {item.arabicText}
        </Text>
      </View>

      {/* Romanization */}
      <View style={[styles.romanizationSection, { backgroundColor: theme.colors.primary }]}>
        <View style={[styles.sectionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name="language" size={12} color={theme.colors.accent} />
        </View>
        <Text style={[styles.romanizationText, { color: theme.colors.text.secondary }]}>
          {item.romanized}
        </Text>
      </View>

      {/* Translation */}
      <View style={[styles.translationSection, { backgroundColor: theme.colors.accent + '08' }]}>
        <View style={[styles.sectionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name="quote-left" size={10} color={theme.colors.accent} />
        </View>
        <Text style={[styles.translationText, { color: theme.colors.text.primary }]}>
          {item.englishTranslation}
        </Text>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#fff',
  },
  repetitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  repetitionText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Arabic Section
  arabicSection: {
    paddingVertical: 8,
  },
  arabicText: {
    fontSize: 24,
    fontFamily: 'Amiri_400Regular',
    lineHeight: 42,
    textAlign: 'right',
  },

  // Romanization Section
  romanizationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  romanizationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    lineHeight: 22,
  },

  // Translation Section
  translationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  translationText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 23,
  },

  // Source Section
  sourceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    fontStyle: 'italic',
  },
});

export default DoaItem;