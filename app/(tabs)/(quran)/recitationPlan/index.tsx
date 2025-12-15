/**
 * Recitation Plan Index - Modern Design
 * 
 * Shows active plan or prompts to start new one
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Progress from 'react-native-progress';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { useQuranStore, calculateRecitationProgress } from '../../../../stores/useQuranStore';
import { calculateContrastColor, enter } from '../../../../utils';

export default function RecitationPlanIndex() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  
  const { recitationPlan, clearRecitationPlan } = useQuranStore();
  const progress = recitationPlan ? calculateRecitationProgress(recitationPlan) : null;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Start a New Plan?',
      'This will delete your current recitation plan and its progress. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: 'Yes, Start New',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            clearRecitationPlan();
            router.push('/recitationPlan/timeline');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/recitationPlan/timeline');
  };

  const accentBg = theme.colors.accent;
  const accentText = calculateContrastColor(accentBg);

  // ============================================================================
  // ACTIVE PLAN VIEW
  // ============================================================================

  if (recitationPlan && progress) {
    const progressPercentage = Math.round(progress.progressRatio * 100);

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.content}>
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={enter(0)}
            style={styles.headerContainer}
          >
            <View style={[styles.iconBadge, { backgroundColor: theme.colors.accent + '15' }]}>
              <FontAwesome6
                name="book-quran"
                size={32}
                color={theme.colors.accent}
              />
            </View>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Active Recitation Plan
            </Text>
          </MotiView>

          {/* Plan Card */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={enter(0)}
          >
            <BlurView
              intensity={20}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.planCard, { backgroundColor: theme.colors.secondary }]}
            >
              {/* Plan Info */}
              <View style={styles.planInfo}>
                <View style={styles.infoRow}>
                  <FontAwesome6
                    name="calendar-days"
                    size={16}
                    color={theme.colors.accent}
                  />
                  <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                    Day {progress.daysPassed} of {recitationPlan.daysToFinish}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <FontAwesome6
                    name="book-open"
                    size={16}
                    color={theme.colors.accent}
                  />
                  <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                    {recitationPlan.planType.charAt(0).toUpperCase() + 
                     recitationPlan.planType.slice(1)} Plan
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Progress.Bar
                  progress={progress.progressRatio}
                  width={null}
                  height={12}
                  color={theme.colors.accent}
                  unfilledColor={theme.colors.muted}
                  borderWidth={0}
                  borderRadius={6}
                />
                <View style={[styles.percentBadge, { backgroundColor: accentBg }]}>
                  <Text style={[styles.percentText, { color: accentText }]}>
                    {progressPercentage}%
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                    {progress.completed}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    Completed
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: theme.colors.muted }]} />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                    {progress.expected - progress.completed}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    Remaining
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: theme.colors.muted }]} />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                    {progress.expected}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    Total
                  </Text>
                </View>
              </View>
            </BlurView>
          </MotiView>

          {/* Start New Button */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={enter(0)}
          >
            <TouchableOpacity
              onPress={handleStartNew}
              style={[styles.secondaryButton, { backgroundColor: theme.colors.secondary }]}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="rotate"
                size={16}
                color={theme.colors.text.primary}
              />
              <Text style={[styles.secondaryText, { color: theme.colors.text.primary }]}>
                Start a New Plan
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </View>
    );
  }

  // ============================================================================
  // EMPTY STATE (NO ACTIVE PLAN)
  // ============================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {/* Empty State Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={enter(0)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.emptyCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.accent + '15' }]}>
              <FontAwesome6
                name="book-quran"
                size={48}
                color={theme.colors.accent}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
              Start Your Recitation Plan
            </Text>

            <Text style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}>
              Complete the Quran at your own pace — by ayah, surah, or juz
            </Text>

            {/* Features List */}
            <View style={styles.featuresList}>
              {[
                { icon: 'calendar-check', text: 'Flexible timeline' },
                { icon: 'chart-line', text: 'Track your progress' },
                { icon: 'trophy', text: 'Stay motivated' },
              ].map((feature, index) => (
                <MotiView
                  key={feature.text}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={enter(0)}
                  style={styles.featureItem}
                >
                  <View style={[styles.featureIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                    <FontAwesome6
                      name={feature.icon}
                      size={14}
                      color={theme.colors.accent}
                    />
                  </View>
                  <Text style={[styles.featureText, { color: theme.colors.text.primary }]}>
                    {feature.text}
                  </Text>
                </MotiView>
              ))}
            </View>

            {/* Get Started Button */}
            <TouchableOpacity
              onPress={handleGetStarted}
              style={[styles.primaryButton, { backgroundColor: accentBg }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryText, { color: accentText }]}>
                Get Started
              </Text>
              <FontAwesome6
                name="arrow-right"
                size={16}
                color={accentText}
              />
            </TouchableOpacity>
          </BlurView>
        </MotiView>
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },

  // Plan Card
  planCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  planInfo: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
  },

  // Progress
  progressContainer: {
    marginBottom: 20,
  },
  percentBadge: {
    position: 'absolute',
    right: 0,
    top: -8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  percentText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  statDivider: {
    width: 1,
    height: 40,
  },

  // Empty State
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  // Features List
  featuresList: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
});