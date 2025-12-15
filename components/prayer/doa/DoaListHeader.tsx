/**
 * DoaListHeader - Modern Design
 * 
 * Header for the Doa list with title and info button
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

import { useTheme } from '../../../context/ThemeContext';
import { enter } from '../../../utils';

interface DoaListHeaderProps {
  onInfoPress: () => void;
}

const DoaListHeader: React.FC<DoaListHeaderProps> = ({ onInfoPress }) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
      style={styles.container}
    >
      {/* Header Card */}
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.headerCard, { backgroundColor: theme.colors.secondary }]}
      >
        {/* Icon Badge */}
        <View style={[styles.iconBadge, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name="hands-praying" size={28} color={theme.colors.accent} />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            After Prayer Duas
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Supplications to recite after salah
          </Text>
        </View>

        {/* Info Button */}
        <TouchableOpacity
          onPress={onInfoPress}
          style={[styles.infoButton, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="circle-info" size={18} color={theme.colors.accent} />
        </TouchableOpacity>
      </BlurView>

      {/* Stats Card */}
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.statsCard, { backgroundColor: theme.colors.secondary }]}
      >
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6 name="book-quran" size={16} color={theme.colors.accent} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>
              Source
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              Authentic Hadith
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.text.muted + '20' }]} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.text.success + '15' }]}>
            <FontAwesome6 name="circle-check" size={16} color={theme.colors.text.success || '#4CAF50'} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>
              Verification
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              Verified
            </Text>
          </View>
        </View>
      </BlurView>

      {/* Instructions */}
      <View style={[styles.instructionCard, { backgroundColor: theme.colors.accent + '10' }]}>
        <FontAwesome6 name="lightbulb" size={14} color={theme.colors.accent} />
        <Text style={[styles.instructionText, { color: theme.colors.text.primary }]}>
          Recite these duas in order after completing your prayer
        </Text>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 16,
  },

  // Header Card
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
  },
  statValue: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  divider: {
    width: 1,
    height: 36,
  },

  // Instruction Card
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    lineHeight: 18,
  },
});

export default DoaListHeader;