/**
 * Timeline Selection - Modern Design
 * 
 * Choose how many days to complete the Quran
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { usePlan } from './context';
import { useTheme } from '../../../../context/ThemeContext';
import { calculateContrastColor } from '../../../../utils';

const TIMELINE_OPTIONS = [
  { days: 7, icon: 'bolt', label: 'Express' },
  { days: 30, icon: 'calendar', label: 'Balanced' },
  { days: 60, icon: 'calendar-plus', label: 'Relaxed' },
  { days: 90, icon: 'hourglass', label: 'Extended' },
];

export default function TimelineScreen() {
  const { theme, isDarkMode } = useTheme();
  //@ts-ignore
  const { setPlan } = usePlan();
  const router = useRouter();

  const handleSelect = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlan({ daysToFinish: days });
    router.push('/recitationPlan/unit');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6
              name="calendar-days"
              size={28}
              color={theme.colors.accent}
            />
          </View>
          <Text style={[styles.question, { color: theme.colors.text.primary }]}>
            When would you like to complete the Quran?
          </Text>
        </MotiView>

        {/* Timeline Options */}
        <View style={styles.optionsContainer}>
          {TIMELINE_OPTIONS.map((option, index) => {
            const accentBg = theme.colors.accent;
            const accentText = calculateContrastColor(accentBg);

            return (
              <MotiView
                key={option.days}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'spring',
                  delay: index * 100,
                  damping: 20,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSelect(option.days)}
                  activeOpacity={0.7}
                >
                  <BlurView
                    intensity={20}
                    tint={isDarkMode ? 'dark' : 'light'}
                    style={[styles.optionCard, { backgroundColor: theme.colors.secondary }]}
                  >
                    {/* Icon Badge */}
                    <View style={[styles.optionIcon, { backgroundColor: accentBg }]}>
                      <FontAwesome6
                        name={option.icon}
                        size={20}
                        color={accentText}
                      />
                    </View>

                    {/* Text Content */}
                    <View style={styles.optionText}>
                      <Text style={[styles.optionDays, { color: theme.colors.text.primary }]}>
                        {option.days} Days
                      </Text>
                      <Text style={[styles.optionLabel, { color: theme.colors.text.secondary }]}>
                        {option.label}
                      </Text>
                    </View>

                    {/* Chevron */}
                    <FontAwesome6
                      name="chevron-right"
                      size={18}
                      color={theme.colors.text.muted}
                    />
                  </BlurView>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 20,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  question: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    lineHeight: 28,
  },

  // Options
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
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
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionDays: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});