/**
 * Plan Review - Modern Design
 * 
 * Review plan before starting
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlan } from './context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { useQuranStore } from '../../../../stores/useQuranStore';
import { calculateContrastColor } from '../../../../utils';

const TOTAL_AYAHS = 6236;
const TOTAL_SURAHS = 114;
const TOTAL_JUZ = 30;

export default function ReviewScreen() {
  const { theme, isDarkMode } = useTheme();
  //@ts-ignore
  const { plan } = usePlan();
  const setRecitationPlan = useQuranStore((state) => state.setRecitationPlan);
  const router = useRouter();

  // Calculate daily target
  const calculateDailyTarget = () => {
    switch (plan.planType) {
      case 'ayahs':
        return Math.ceil(TOTAL_AYAHS / plan.daysToFinish);
      case 'surahs':
        return Math.ceil(TOTAL_SURAHS / plan.daysToFinish);
      case 'juz':
        return (1 / plan.daysToFinish) * TOTAL_JUZ;
      default:
        return 0;
    }
  };

  const dailyTarget = calculateDailyTarget();

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRecitationPlan({
      ...plan,
      startDate: new Date().toISOString(),
      completedAyahKeys: [],
    });
    router.replace('/(quran)');
  };

  const accentBg = theme.colors.accent;
  const accentText = calculateContrastColor(accentBg);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          style={styles.header}
        >
          <View style={[styles.successIcon, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6
              name="circle-check"
              size={48}
              color={theme.colors.accent}
            />
          </View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Your Recitation Plan
          </Text>
        </MotiView>

        {/* Plan Summary Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100, damping: 20 }}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.summaryCard, { backgroundColor: theme.colors.secondary }]}
          >
            {/* Duration */}
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6
                  name="calendar-days"
                  size={20}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                  Timeline
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                  {plan.daysToFinish} Days
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.muted }]} />

            {/* Unit Type */}
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6
                  name="book-open"
                  size={20}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                  Reading By
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                  {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.muted }]} />

            {/* Daily Target */}
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6
                  name="bullseye"
                  size={20}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                  Daily Target
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                  {plan.planType === 'juz'
                    ? `${dailyTarget.toFixed(2)} Juz`
                    : `${dailyTarget} ${plan.planType}`}
                </Text>
              </View>
            </View>
          </BlurView>
        </MotiView>

        {/* Info Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 150, damping: 20 }}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.infoCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={[styles.infoIcon, { backgroundColor: theme.colors.text.muted + '15' }]}>
              <FontAwesome6
                name="lightbulb"
                size={16}
                color={theme.colors.text.muted}
              />
            </View>
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              You can track your progress and adjust your plan anytime
            </Text>
          </BlurView>
        </MotiView>

        {/* Start Button */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 200, damping: 15 }}
        >
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: accentBg }]}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={[styles.startText, { color: accentText }]}>
              Start My Plan
            </Text>
            <FontAwesome6
              name="rocket"
              size={18}
              color={accentText}
            />
          </TouchableOpacity>
        </MotiView>
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
    marginBottom: 32,
    gap: 16,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },

  // Summary Card
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
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
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 18,
  },

  // Start Button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  startText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
});