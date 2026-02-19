/**
 * Ramadan Dashboard Screen
 *
 * Main screen for the Ramadan tab showing:
 * - Hero countdown to next Suhoor/Iftar
 * - Quick stats (fasting, tarawih, quran)
 * - Quick action buttons
 * - Daily dua/hadith card
 * - Notification settings
 *
 * @version 1.1
 * @since 2026-02-14
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import { useRamadanStore, useFastingLogs, useTarawihLogs, useQuranKhatamLogs, useRamadanNotifPrefs } from '../../../stores/useRamadanStore';
import { useRamadanDetection } from '../../../hooks/ramadan/useRamadanDetection';
import { useRamadanCountdown } from '../../../hooks/ramadan/useRamadanCountdown';
import { useRamadanNotifications } from '../../../hooks/ramadan/useRamadanNotifications';
import { useRamadanFirebaseSync } from '../../../hooks/ramadan/useRamadanFirebaseSync';
import { RAMADAN_DAILY_CONTENT, TOTAL_JUZ, SUHOOR_REMINDER_OPTIONS } from '../../../api/services/ramadan/types/constants';
import type { RamadanNotificationPrefs } from '../../../api/services/ramadan/types';
import RamadanSummary from '../../../components/ramadan/RamadanSummary';
import FastingTimeline from '../../../components/ramadan/FastingTimeline';

const RamadanDashboard = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const tracker = useRamadanStore((s) => s.tracker);
  const fastingLogs = useFastingLogs();
  const tarawihLogs = useTarawihLogs();
  const quranKhatamLogs = useQuranKhatamLogs();
  const notifPrefs = useRamadanNotifPrefs();
  const updateNotifPrefs = useRamadanStore((s) => s.updateNotificationPrefs);

  const { data: detection, isLoading, refetch } = useRamadanDetection();
  const countdown = useRamadanCountdown();

  // Mount notification scheduling hook
  useRamadanNotifications();

  // Mount Firebase sync (restore on load, debounced sync on changes)
  useRamadanFirebaseSync();

  // Compute stats
  const stats = useMemo(() => {
    const daysFasted = Object.values(fastingLogs).filter(
      (l) => l.status === 'fasted'
    ).length;
    const tarawihCompleted = Object.values(tarawihLogs).filter(
      (l) => l.prayed
    ).length;
    const juzCompleted = Object.values(quranKhatamLogs).filter(
      (l) => l.completed
    ).length;

    return { daysFasted, tarawihCompleted, juzCompleted };
  }, [fastingLogs, tarawihLogs, quranKhatamLogs]);

  // Get daily dua (based on current Ramadan day)
  const currentDay = detection?.currentDay ?? 1;
  const dailyContent =
    RAMADAN_DAILY_CONTENT[Math.min(currentDay - 1, RAMADAN_DAILY_CONTENT.length - 1)];

  const totalDays = tracker?.totalDays ?? 30;

  const togglePref = useCallback(
    (key: keyof RamadanNotificationPrefs) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateNotifPrefs({ [key]: !notifPrefs[key] });
    },
    [notifPrefs, updateNotifPrefs]
  );

  const cycleSuhoorMinutes = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIdx = SUHOOR_REMINDER_OPTIONS.indexOf(notifPrefs.suhoorReminderMinutes);
    const nextIdx = (currentIdx + 1) % SUHOOR_REMINDER_OPTIONS.length;
    updateNotifPrefs({ suhoorReminderMinutes: SUHOOR_REMINDER_OPTIONS[nextIdx] });
  }, [notifPrefs.suhoorReminderMinutes, updateNotifPrefs]);

  const styles = createStyles(theme);

  return (
    <>
    <RamadanSummary />
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {/* Hero Countdown */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
      >
        <View style={styles.heroContainer}>
          <View style={styles.heroHeader}>
            <FontAwesome6 name="moon" size={24} color="#FFD700" solid />
            <Text style={styles.heroTitle}>Ramadan Mubarak</Text>
          </View>

          <Text style={styles.heroDayText}>
            Day {currentDay} of {totalDays}
          </Text>

          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>
              {countdown.target === 'iftar' ? 'Iftar in' : 'Suhoor in'}
            </Text>
            <Text style={styles.countdownTime}>{countdown.timeRemaining}</Text>
          </View>

          <View style={styles.heroTimesRow}>
            <View style={styles.heroTimeItem}>
              <Text style={styles.heroTimeLabel}>Imsak</Text>
              <Text style={styles.heroTimeValue}>
                {countdown.imsakTime ?? '--:--'}
              </Text>
            </View>
            <View style={styles.heroTimeDivider} />
            <View style={styles.heroTimeItem}>
              <Text style={styles.heroTimeLabel}>Iftar</Text>
              <Text style={styles.heroTimeValue}>
                {countdown.iftarTime ?? '--:--'}
              </Text>
            </View>
          </View>

          <FastingTimeline
            imsakTime={countdown.imsakTime}
            iftarTime={countdown.iftarTime}
          />
        </View>
      </MotiView>

      {/* Quick Stats */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 100 }}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <FontAwesome6 name="utensils" size={16} color={theme.colors.accent} />
            <Text style={styles.statValue}>{stats.daysFasted}/{totalDays}</Text>
            <Text style={styles.statLabel}>Fasted</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome6 name="person-praying" size={16} color={theme.colors.accent} />
            <Text style={styles.statValue}>{stats.tarawihCompleted}/{totalDays}</Text>
            <Text style={styles.statLabel}>Tarawih</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome6 name="book-quran" size={16} color={theme.colors.accent} />
            <Text style={styles.statValue}>{stats.juzCompleted}/{TOTAL_JUZ}</Text>
            <Text style={styles.statLabel}>Quran</Text>
          </View>
        </View>
      </MotiView>

      {/* Quick Actions */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 200 }}
      >
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/(ramadan)/fasting')}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="calendar-check" size={18} color={theme.colors.accent} />
            <Text style={styles.actionText}>Fasting</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/(ramadan)/tarawih')}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="person-praying" size={18} color={theme.colors.accent} />
            <Text style={styles.actionText}>Tarawih</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/(ramadan)/quran-khatam')}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="book-open" size={18} color={theme.colors.accent} />
            <Text style={styles.actionText}>Khatam</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/(ramadan)/share')}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="share-nodes" size={18} color={theme.colors.accent} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </MotiView>

      {/* Daily Dua */}
      {dailyContent && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
        >
          <View style={styles.duaCard}>
            <View style={styles.duaHeader}>
              <FontAwesome6 name="hands-praying" size={16} color="#FFD700" />
              <Text style={styles.duaHeaderText}>
                Day {currentDay} Dua
              </Text>
            </View>
            <Text style={styles.duaArabic}>{dailyContent.duaArabic}</Text>
            <Text style={styles.duaTransliteration}>
              {dailyContent.duaTransliteration}
            </Text>
            <Text style={styles.duaTranslation}>
              {dailyContent.duaTranslation}
            </Text>
            <View style={styles.hadithDivider} />
            <Text style={styles.hadithText}>
              {dailyContent.hadith}
            </Text>
            <Text style={styles.hadithSource}>
              — {dailyContent.hadithSource}
            </Text>
          </View>
        </MotiView>
      )}

      {/* Calendar Quick Access */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 400 }}
      >
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => router.push('/(tabs)/(ramadan)/calendar')}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="calendar" size={18} color={theme.colors.accent} />
          <Text style={styles.calendarButtonText}>View Ramadan Calendar</Text>
          <FontAwesome6 name="chevron-right" size={14} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </MotiView>

      {/* Notification Settings */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 500 }}
      >
        <View style={styles.sectionHeader}>
          <FontAwesome6 name="bell" size={14} color={theme.colors.accent} />
          <Text style={styles.sectionHeaderText}>Reminders</Text>
        </View>

        <View style={styles.notifCard}>
          {/* Suhoor Reminder */}
          <View style={styles.notifRow}>
            <View style={[styles.notifIcon, { backgroundColor: '#6366F120' }]}>
              <FontAwesome6 name="cloud-moon" size={14} color="#6366F1" />
            </View>
            <View style={styles.notifInfo}>
              <Text style={styles.notifLabel}>Suhoor Reminder</Text>
              <TouchableOpacity onPress={cycleSuhoorMinutes} disabled={!notifPrefs.suhoorReminderEnabled}>
                <Text style={[styles.notifSub, notifPrefs.suhoorReminderEnabled && styles.notifSubTappable]}>
                  {notifPrefs.suhoorReminderMinutes} min before Imsak
                </Text>
              </TouchableOpacity>
            </View>
            <Switch
              value={notifPrefs.suhoorReminderEnabled}
              onValueChange={() => togglePref('suhoorReminderEnabled')}
              trackColor={{ false: theme.colors.muted, true: theme.colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.notifDivider} />

          {/* Iftar Alert */}
          <View style={styles.notifRow}>
            <View style={[styles.notifIcon, { backgroundColor: '#F59E0B20' }]}>
              <FontAwesome6 name="sun" size={14} color="#F59E0B" />
            </View>
            <View style={styles.notifInfo}>
              <Text style={styles.notifLabel}>Iftar Alert</Text>
              <Text style={styles.notifSub}>At Maghrib time</Text>
            </View>
            <Switch
              value={notifPrefs.iftarAlertEnabled}
              onValueChange={() => togglePref('iftarAlertEnabled')}
              trackColor={{ false: theme.colors.muted, true: theme.colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.notifDivider} />

          {/* Tarawih Reminder */}
          <View style={styles.notifRow}>
            <View style={[styles.notifIcon, { backgroundColor: '#10B98120' }]}>
              <FontAwesome6 name="person-praying" size={14} color="#10B981" />
            </View>
            <View style={styles.notifInfo}>
              <Text style={styles.notifLabel}>Tarawih Reminder</Text>
              <Text style={styles.notifSub}>30 min after Isyak</Text>
            </View>
            <Switch
              value={notifPrefs.tarawihReminderEnabled}
              onValueChange={() => togglePref('tarawihReminderEnabled')}
              trackColor={{ false: theme.colors.muted, true: theme.colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.notifDivider} />

          {/* Last 10 Nights */}
          <View style={styles.notifRow}>
            <View style={[styles.notifIcon, { backgroundColor: '#FFD70020' }]}>
              <FontAwesome6 name="star" size={14} color="#FFD700" solid />
            </View>
            <View style={styles.notifInfo}>
              <Text style={styles.notifLabel}>Last 10 Nights</Text>
              <Text style={styles.notifSub}>Special reminders for Laylatul Qadr</Text>
            </View>
            <Switch
              value={notifPrefs.lastTenNightsEnabled}
              onValueChange={() => togglePref('lastTenNightsEnabled')}
              trackColor={{ false: theme.colors.muted, true: theme.colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </MotiView>
    </ScrollView>
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
    contentContainer: {
      padding: 16,
      paddingTop: 60,
      paddingBottom: 100,
    },

    // Hero
    heroContainer: {
      backgroundColor: '#1a1a2e',
      borderRadius: 20,
      padding: 24,
      marginBottom: 16,
      alignItems: 'center',
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    heroTitle: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 22,
      color: '#FFD700',
    },
    heroDayText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 16,
    },
    countdownContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    countdownLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.6)',
      marginBottom: 4,
    },
    countdownTime: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 40,
      color: '#FFFFFF',
      letterSpacing: 2,
    },
    heroTimesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
    },
    heroTimeItem: {
      alignItems: 'center',
    },
    heroTimeLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.5)',
      marginBottom: 4,
    },
    heroTimeValue: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 18,
      color: '#FFFFFF',
    },
    heroTimeDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },

    // Stats
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
      gap: 6,
    },
    statValue: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 20,
      color: theme.colors.text.primary,
    },
    statLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: theme.colors.text.secondary,
    },

    // Actions
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
      gap: 8,
    },
    actionText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 12,
      color: theme.colors.text.primary,
    },

    // Dua Card
    duaCard: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    duaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    duaHeaderText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    duaArabic: {
      fontFamily: 'Amiri_400Regular',
      fontSize: 24,
      color: theme.colors.text.primary,
      textAlign: 'right',
      lineHeight: 48,
      marginBottom: 12,
    },
    duaTransliteration: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    duaTranslation: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.primary,
      lineHeight: 22,
      marginBottom: 16,
    },
    hadithDivider: {
      height: 1,
      backgroundColor: theme.colors.text.muted,
      opacity: 0.3,
      marginBottom: 12,
    },
    hadithText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: theme.colors.text.secondary,
      lineHeight: 20,
      marginBottom: 6,
    },
    hadithSource: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 12,
      color: theme.colors.text.muted,
    },

    // Calendar button
    calendarButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 14,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    calendarButtonText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 15,
      color: theme.colors.text.primary,
      flex: 1,
    },

    // Section Header
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionHeaderText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Notification Card
    notifCard: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 16,
      padding: 4,
    },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    notifIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifInfo: {
      flex: 1,
    },
    notifLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    notifSub: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: theme.colors.text.muted,
      marginTop: 1,
    },
    notifSubTappable: {
      color: theme.colors.accent,
      textDecorationLine: 'underline',
    },
    notifDivider: {
      height: 1,
      backgroundColor: theme.colors.text.muted,
      opacity: 0.15,
      marginLeft: 62,
    },
  });

export default RamadanDashboard;
