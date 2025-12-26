/**
 * Prayer Dashboard - Modern Design
 * 
 * Track daily prayers, view weekly progress, and monitor streaks
 * 
 * @version 3.0 - Updated for new API architecture
 */

import React, { useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { format, subDays, addDays, startOfWeek } from 'date-fns';
import { Skeleton } from 'moti/skeleton';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

// Hooks
import { useTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../stores/useAuthStore';
import { useLocationStore } from '../../../../stores/useLocationStore';
import { LOGGABLE_PRAYERS, useTodayPrayerTimes } from '../../../../api/services/prayer';
import { usePrayerLog, useWeeklyPrayerLogs, useSavePrayerLog } from '../../../../api/services/prayer/queries/prayer-logs';
import { usePrayerStreakManager } from '../../../../hooks/prayer/usePrayerStreakManager';
import { usePrayerDateNavigation } from '../../../../hooks/prayer/usePrayerDateNavigation';

// Types
import type { PrayerLog } from '../../../../api/services/prayer';
import { type LocalPrayerName } from '../../../../api/services/prayer/types';

// Weekly logs type - maps dates to prayer completion objects
type WeeklyLogs = Record<string, PrayerLog['prayers']>;

// Components
import SignInModal from '../../../../components/SignInModal';

// Utils
import { enter, shakeButton } from '../../../../utils';
import { getCurrentDayIndex, isSameDate } from '../../../../utils/prayers/dates';

// ============================================================================
// HELPER: Check if prayer can be logged
// ============================================================================

/**
 * ✅ IMPROVED: Determine if a prayer can be logged
 * 
 * Rules:
 * 1. For PAST dates: All prayers are loggable (day is complete)
 * 2. For TODAY: Prayer time must have passed
 * 3. For FUTURE dates: No prayers are loggable
 */
function isPrayerLoggable(
  prayerTime: string,
  selectedDate: Date
): boolean {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedStr = format(selectedDate, 'yyyy-MM-dd');

  // Past date: all prayers are loggable
  if (selectedStr < todayStr) {
    return true;
  }

  // Future date: no prayers are loggable
  if (selectedStr > todayStr) {
    return false;
  }

  // Today: check if prayer time has passed
  const [hours, minutes] = prayerTime.split(':').map(Number);
  const prayerDateTime = new Date();
  prayerDateTime.setHours(hours, minutes, 0, 0);

  return new Date() >= prayerDateTime;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRAYER_CONFIG = {
  Subuh: { icon: 'cloud-sun', color: '#87CEEB' },
  Zohor: { icon: 'sun', color: '#FFD700' },
  Asar: { icon: 'cloud-sun', color: '#FFA500' },
  Maghrib: { icon: 'moon', color: '#FF6B6B' },
  Isyak: { icon: 'moon', color: '#9C27B0' },
} as const;

// ============================================================================
// HELPER: Check if prayer time has passed
// ============================================================================

function canLogPrayer(prayerTime: string): boolean {
  const [hours, minutes] = prayerTime.split(':').map(Number);
  const prayerDate = new Date();
  prayerDate.setHours(hours, minutes, 0, 0);
  return new Date() >= prayerDate;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PrayersDashboard: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { userId } = useAuth();
  const { userLocation } = useLocationStore();
  const queryClient = useQueryClient();

  // Convert location to API format
  const location = useMemo(() => {
    if (!userLocation?.coords) return null;
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
  }, [userLocation]);

  // Date navigation (with location for prefetching)
  const dateNavigation = usePrayerDateNavigation(location);
  const { selectedDate, goToPrevDay, goToNextDay, canGoNext } = dateNavigation;

  // Modal state
  const [isAuthModalVisible, setIsAuthModalVisible] = React.useState(false);

  // Animations
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Fetch data
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = isSameDate(selectedDate, new Date());

  // Prayer times (for availability checking)
  const { data: todayPrayerData } = useTodayPrayerTimes(location);

  // Prayer log for selected date
  const { data: prayerLog, isLoading: isLoadingLog } = usePrayerLog(userId, dateStr);

  // Weekly logs for streak calculation
  const startDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const { data: weeklyLogs, isLoading: isLoadingWeekly } = useWeeklyPrayerLogs(userId, startDate, endDate);

  const streakInfo = usePrayerStreakManager(weeklyLogs, userId);

  const { mutate: savePrayerLog } = useSavePrayerLog();

  // Prayer availability checker
  const toggablePrayers = useMemo(() => {
    if (!todayPrayerData) return undefined;
    
    return LOGGABLE_PRAYERS.map(prayer => {
      const prayerTime = todayPrayerData[prayer.toLowerCase() as keyof typeof todayPrayerData];
      return {
        prayer,
        isAvailable: isPrayerLoggable(prayerTime, selectedDate),
      };
    });
  }, [todayPrayerData, selectedDate]);

  // Weekly calendar
  const currentDayIndex = getCurrentDayIndex();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const isLogged = useCallback(
    (dayIndex: number, session: LocalPrayerName) => {
      const date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
      const logged = weeklyLogs?.[date]?.[session as keyof PrayerLog['prayers']] ?? false;
      return logged;
    },
    [weekStart, weeklyLogs]
  );

  // Handle prayer toggle
  const handleTogglePrayer = useCallback(
    (prayer: LocalPrayerName) => {
      if (!userId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Authentication Required',
          'Please create an account to log your prayers.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Up', onPress: () => setIsAuthModalVisible(true) },
          ]
        );
        return;
      }

      // Check if prayer time has passed (only for today)
      const prayerAvailability = toggablePrayers?.find((p) => p.prayer === prayer);
      const isAvailable = prayerAvailability?.isAvailable ?? false;

      if (!isAvailable) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeButton(shakeAnimation);
        Toast.show({
          type: 'error',
          text1: `Can't log ${prayer}`,
          text2: isToday ? "It's not time yet." : "Cannot log future prayers",
          position: 'bottom',
        });
        return;
      }

      // ✅ Read CURRENT data from React Query cache
      const queryKey = ['prayerLogs', userId, dateStr];
      const currentLog = queryClient.getQueryData<PrayerLog>(queryKey);
      
      const currentPrayers = currentLog?.prayers || {
        Subuh: false,
        Zohor: false,
        Asar: false,
        Maghrib: false,
        Isyak: false,
      };

      const isCurrentlyLogged = currentPrayers[prayer as keyof PrayerLog['prayers']];

      const updatedPrayers = {
        ...currentPrayers,
        [prayer]: !isCurrentlyLogged,
      };

      console.log(`🔄 Dashboard toggle ${prayer} on ${dateStr}:`, {
        before: isCurrentlyLogged,
        after: !isCurrentlyLogged,
        allPrayers: updatedPrayers,
      });

      // Haptic feedback
      if (!isCurrentlyLogged) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      savePrayerLog(
        {
          userId,
          date: dateStr,
          prayers: updatedPrayers,
        },
        {
          onError: (error) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error('Error saving prayer log:', error);
            Toast.show({
              type: 'error',
              text1: `Couldn't save log for ${prayer}`,
              text2: 'Please try again shortly.',
              position: 'bottom',
            });
          },
        }
      );
    },
    [userId, isToday, toggablePrayers, dateStr, shakeAnimation, savePrayerLog, queryClient]
  );

  // Calculate completion stats
  const completionStats = useMemo(() => {
    if (!prayerLog?.prayers) return { completed: 0, total: 5, percentage: 0 };
    const completed = Object.values(prayerLog.prayers).filter(Boolean).length;
    return {
      completed,
      total: 5,
      percentage: Math.round((completed / 5) * 100),
    };
  }, [prayerLog]);

  // Render loading state
  if (isLoadingLog || isLoadingWeekly) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.section}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="100%" height={80} radius={14} colorMode={isDarkMode ? 'dark' : 'light'} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header Stats */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
          style={styles.headerSection}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.statsCard, { backgroundColor: theme.colors.secondary }]}
          >
            {/* Today's Progress */}
            <View style={styles.statRow}>
              <View style={[styles.statIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6 name="check-circle" size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>
                  Today's Progress
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {completionStats.completed}/{completionStats.total} Prayers
                </Text>
              </View>
              <View
                style={[
                  styles.percentageBadge,
                  { backgroundColor: theme.colors.accent + '15' },
                ]}
              >
                <Text style={[styles.percentageText, { color: theme.colors.accent }]}>
                  {completionStats.percentage}%
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.colors.text.muted + '20' }]} />

            {/* Current Streak */}
            <View style={styles.statRow}>
              <View style={[styles.statIcon, { backgroundColor: '#FF6B6B15' }]}>
                <FontAwesome6 name="fire" size={20} color="#FF6B6B" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>
                  Current Streak
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {streakInfo.current} {streakInfo.current === 1 ? 'Day' : 'Days'}
                </Text>
              </View>
              {streakInfo.longest > 0 && (
                <View style={[styles.longestBadge, { backgroundColor: '#FFD70015' }]}>
                  <FontAwesome6 name="trophy" size={12} color="#FFD700" />
                  <Text style={[styles.longestText, { color: '#FFD700' }]}>
                    Best: {streakInfo.longest}
                  </Text>
                </View>
              )}
            </View>
          </BlurView>
        </MotiView>

        {/* Date Navigation */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(100)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.dateCard, { backgroundColor: theme.colors.secondary }]}
          >
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.colors.accent + '15' }]}
              onPress={goToPrevDay}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="chevron-left" size={16} color={theme.colors.accent} />
            </TouchableOpacity>

            <View style={styles.dateContent}>
              <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </Text>
              <Text style={[styles.dayText, { color: theme.colors.text.secondary }]}>
                {isToday ? 'Today' : format(selectedDate, 'EEEE')}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: canGoNext ? theme.colors.accent + '15' : theme.colors.text.muted + '15' },
              ]}
              onPress={goToNextDay}
              disabled={!canGoNext}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="chevron-right"
                size={16}
                color={canGoNext ? theme.colors.accent : theme.colors.text.muted}
              />
            </TouchableOpacity>
          </BlurView>
        </MotiView>

        {/* Prayer Cards */}
        <View style={styles.prayersSection}>
          {LOGGABLE_PRAYERS.map((prayer, index) => {
            const config = PRAYER_CONFIG[prayer];
            const isLogged = prayerLog?.prayers?.[prayer] ?? false;
            const isLocked = isToday && !toggablePrayers?.find((p) => p.prayer === prayer)?.isAvailable;

            return (
              <MotiView
                key={prayer}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={enter(200 + index * 50)}
              >
                <BlurView
                  intensity={20}
                  tint={isDarkMode ? 'dark' : 'light'}
                  style={[styles.prayerCard, { backgroundColor: theme.colors.secondary }]}
                >
                  <View style={[styles.prayerIcon, { backgroundColor: config.color + '15' }]}>
                    <FontAwesome6 name={config.icon} size={20} color={config.color} />
                  </View>

                  <Text style={[styles.prayerName, { color: theme.colors.text.primary }]}>
                    {prayer}
                  </Text>

                  {isLocked ? (
                    <View style={[styles.lockedBadge, { backgroundColor: theme.colors.text.muted + '15' }]}>
                      <FontAwesome6 name="lock" size={10} color={theme.colors.text.muted} />
                      <Text style={[styles.lockedText, { color: theme.colors.text.muted }]}>
                        Not yet
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        {
                          backgroundColor: isLogged
                            ? theme.colors.accent
                            : theme.colors.text.muted + '15',
                        },
                      ]}
                      onPress={() => handleTogglePrayer(prayer)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome6
                        name={isLogged ? 'check' : 'circle'}
                        size={18}
                        color={isLogged ? '#fff' : theme.colors.text.muted}
                      />
                    </TouchableOpacity>
                  )}
                </BlurView>
              </MotiView>
            );
          })}
        </View>

        {/* Weekly Calendar */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={enter(500)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.calendarCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.calendarHeader}>
              <FontAwesome6 name="calendar-days" size={16} color={theme.colors.accent} />
              <Text style={[styles.calendarTitle, { color: theme.colors.text.primary }]}>
                This Week
              </Text>
            </View>

            {/* Days Header */}
            <View style={styles.calendarRow}>
              <View style={styles.calendarLabelCell} />
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <View
                  key={i}
                  style={[
                    styles.calendarDayCell,
                    i === currentDayIndex && { backgroundColor: theme.colors.accent + '15' },
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      {
                        color: i === currentDayIndex ? theme.colors.accent : theme.colors.text.secondary,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Prayer Rows */}
            {LOGGABLE_PRAYERS.map((session) => (
              <View key={session} style={styles.calendarRow}>
                <View style={styles.calendarLabelCell}>
                  <Text style={[styles.calendarSessionText, { color: theme.colors.text.secondary }]}>
                    {session.slice(0, 3)}
                  </Text>
                </View>
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                  <View key={dayIndex} style={styles.calendarDotCell}>
                    <View
                      style={[
                        styles.calendarDot,
                        {
                          backgroundColor: isLogged(dayIndex, session)
                            ? theme.colors.accent
                            : theme.colors.text.muted + '20',
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            ))}
          </BlurView>
        </MotiView>

        {/* Streak Visualization */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={enter(600)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.streakCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.streakHeader}>
              <FontAwesome6 name="fire" size={16} color="#FF6B6B" />
              <Text style={[styles.streakTitle, { color: theme.colors.text.primary }]}>
                Prayer Streak
              </Text>
            </View>

            {/* Flame Visualization */}
            <View style={styles.flamesContainer}>
              {[...Array(7)].map((_, i) => {
                const isActive = i < streakInfo.current;
                return (
                  <View
                    key={i}
                    style={[
                      styles.flameWrapper,
                      { backgroundColor: isActive ? '#FF6B6B15' : theme.colors.text.muted + '10' },
                    ]}
                  >
                    <FontAwesome6
                      name="fire"
                      size={20}
                      color={isActive ? '#FF6B6B' : theme.colors.text.muted}
                    />
                  </View>
                );
              })}
            </View>

            {/* Streak Info */}
            <View style={styles.streakInfo}>
              <Text style={[styles.streakInfoText, { color: theme.colors.text.secondary }]}>
                Keep going! Complete all 5 prayers daily to maintain your streak
              </Text>
            </View>
          </BlurView>
        </MotiView>
      </ScrollView>

      {/* Auth Modal */}
      <SignInModal visible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    gap: 12,
  },
  headerSection: {
    marginBottom: 16,
  },

  // Stats Card
  statsCard: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  longestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  longestText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  divider: {
    height: 1,
  },

  // Date Card
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContent: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  dayText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },

  // Prayer Cards
  prayersSection: {
    gap: 12,
    marginBottom: 20,
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prayerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lockedText: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Calendar Card
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarLabelCell: {
    width: 50,
    justifyContent: 'center',
  },
  calendarSessionText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  calendarDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  calendarDayText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  calendarDotCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Streak Card
  streakCard: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  flamesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  flameWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  streakInfoText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
});

export default PrayersDashboard;