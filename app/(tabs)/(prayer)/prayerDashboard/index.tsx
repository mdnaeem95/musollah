import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { format, subDays, addDays, startOfWeek } from 'date-fns';
import { Skeleton } from 'moti/skeleton';
import Toast from 'react-native-toast-message';

// Hooks
import { useTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../stores/useAuthStore';
import { useLocationStore } from '../../../../stores/useLocationStore';
import { useTodayPrayerTimes } from '../../../../api/services/prayer';
import { 
  usePrayerLog,
  useWeeklyPrayerLogs, 
  useSavePrayerLog,
  usePrayerStats 
} from '../../../../api/services/prayer/logs';
import { usePrayerStreakManager } from '../../../../hooks/usePrayerStreakManager';
import { usePrayerDateNavigation } from '../../../../hooks/prayer/usePrayerDateNavigation';

// Components
import SignInModal from '../../../../components/SignInModal';

// Utils
import { shakeButton } from '../../../../utils';
import { getCurrentDayIndex, isSameDate } from '../../../../utils/prayers/dates';
import { getPrayerAvailability } from '../../../../utils/prayers/logging';

// Types
import { PrayerLog } from '../../../../utils/types/prayer.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const PRAYER_SESSIONS = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'] as const;

const prayerColors = {
  Subuh: { light: '#DCEFFB', dark: '#1E2A36' },
  Zohor: { light: '#FFF4D6', dark: '#332B1E' },
  Asar: { light: '#FFE3C8', dark: '#3A2A22' },
  Maghrib: { light: '#F9D0D3', dark: '#3A1F24' },
  Isyak: { light: '#D7D3F9', dark: '#272547' },
};

// Default to SG CBD if no location available (avoids null param type error)
const DEFAULT_COORDS = { latitude: 1.29027, longitude: 103.851959 };

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Prayer Dashboard
 * 
 * Main screen for logging daily prayers and viewing weekly progress.
 * 
 * Improvements over Redux version:
 * - Uses TanStack Query for all data fetching
 * - No manual state management
 * - Optimistic updates for instant UI feedback
 * - Better error handling
 * - Simpler, more maintainable code
 * - Performance optimizations
 */
const PrayersDashboard: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme);
  const { userId } = useAuth();
  const { userLocation } = useLocationStore();

  // Date navigation
  const {
    selectedDate,
    setDate,
    goToPrevDay,
    goToNextDay,
    canGoNext,
  } = usePrayerDateNavigation();

  // Modal state
  const [isAuthModalVisible, setIsAuthModalVisible] = React.useState(false);

  // Animations
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const toggleScale = useRef(new Animated.Value(1)).current;

  const playToggleAnimation = useCallback(() => {
    toggleScale.setValue(1);
    Animated.sequence([
      Animated.timing(toggleScale, {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(toggleScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [toggleScale]);

  // Fetch data with TanStack Query
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = isSameDate(selectedDate, new Date());

  // Build guaranteed coordinates (typesafe)
  const coords = useMemo(() => {
    if (userLocation?.coords) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };
    }
    return DEFAULT_COORDS;
  }, [userLocation]) as unknown as /* LocationCoordinates */ any;

  // Prayer times for today (for availability check)
  const { data: todayPrayerTimesData } = useTodayPrayerTimes(coords);

  // Helper to normalize the hook result into a "prayers" object
  const todayPrayers = useMemo(() => {
    const src: any = todayPrayerTimesData;
    // Support either { prayers } or { data: { prayers } } or { data }
    return src?.prayers ?? src?.data?.prayers ?? src?.data ?? null;
  }, [todayPrayerTimesData]);

  // Prayer log for selected date
  const { 
    data: prayerLog, 
    isLoading: isLoadingLog 
  } = usePrayerLog(userId, dateStr);

  // Weekly logs (±3 days for streak calculation)
  const startDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const { 
    data: weeklyLogs, 
    isLoading: isLoadingWeekly 
  } = useWeeklyPrayerLogs(userId, startDate, endDate);

  // Prayer stats (for streak display)
  const { data: prayerStats } = usePrayerStats(userId);

  // Calculate streak from weekly logs
  const weeklyAsRecord = weeklyLogs as unknown as Record<string, PrayerLog> | undefined;
  const streakInfo = usePrayerStreakManager(weeklyAsRecord, userId);

  // Save prayer log mutation
  const { mutate: savePrayerLog } = useSavePrayerLog();

  // Calculate prayer availability
  const toggablePrayers = useMemo(() => {
    if (!isToday || !todayPrayers) return undefined;
    return getPrayerAvailability(todayPrayers);
  }, [isToday, todayPrayers]);

  // Current day index for weekly calendar
  const currentDayIndex = getCurrentDayIndex();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Check if prayer is logged for a specific day
  const isLogged = useCallback((dayIndex: number, session: string) => {
    const date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
    return weeklyAsRecord?.[date]?.prayers?.[session as keyof PrayerLog['prayers']] || false;
  }, [weekStart, weeklyAsRecord]);

  // Handle prayer toggle
  const handleTogglePrayer = useCallback((prayer: string) => {
    if (!userId) {
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

    // Check if prayer is available (only for today)
    const isAvailable = !isToday || 
      toggablePrayers?.find(item => item.prayer === prayer)?.isAvailable;

    if (!isAvailable) {
      shakeButton(shakeAnimation);
      Toast.show({
        type: 'error',
        text1: `Can't log ${prayer}`,
        text2: "It's not time yet.",
        position: 'bottom',
      });
      return;
    }

    // Toggle prayer status with fixed shape
    const currentPrayers = prayerLog?.prayers || {
      Subuh: false,
      Zohor: false,
      Asar: false,
      Maghrib: false,
      Isyak: false,
    };

    const updatedPrayers = {
      ...currentPrayers,
      [prayer]: !currentPrayers[prayer as keyof typeof currentPrayers],
    };

    // Animate
    playToggleAnimation();

    // Save with optimistic update
    savePrayerLog(
      {
        userId,
        date: dateStr,
        prayers: updatedPrayers,
      },
      {
        onError: (error) => {
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
  }, [
    userId,
    isToday,
    toggablePrayers,
    prayerLog,
    dateStr,
    playToggleAnimation,
    shakeAnimation,
    savePrayerLog,
  ]);

  // Render flames for streak display
  const renderFlames = useCallback(() => {
    const { current, longest } = streakInfo;
    
    return (
      <View style={styles.flamesContainer}>
        {Array.from({ length: 7 }).map((_, index) => {
          const isActive = index < current;
          const isLongest = index < longest;
          
          return (
            <View key={index} style={styles.flameIcon}>
              <FontAwesome6
                name={isActive ? 'fire-flame-curved' : 'fire-flame-simple'}
                size={24}
                color={isActive ? '#FF6B35' : isLongest ? '#FFA500' : theme.colors.text.muted}
                solid={isActive}
              />
            </View>
          );
        })}
      </View>
    );
  }, [streakInfo, theme.colors.text.muted, styles]);

  // Loading state
  const isLoading = isLoadingLog || isLoadingWeekly;

  return (
    <View style={styles.safeArea}>
      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Date selector skeleton */}
          <Skeleton height={60} radius={12} colorMode={isDarkMode ? 'dark' : 'light'} />

          {/* Prayer toggle rows skeleton */}
          {PRAYER_SESSIONS.map((_, i) => (
            <View key={i} style={{ marginTop: 10 }}>
              <Skeleton 
                height={48} 
                radius={12} 
                colorMode={isDarkMode ? 'dark' : 'light'} 
              />
            </View>
          ))}

          {/* Weekly log header skeleton */}
          <View style={{ marginTop: 20 }}>
            <Skeleton 
              width="50%" 
              height={20} 
              radius="round" 
              colorMode={isDarkMode ? 'dark' : 'light'}
            />
          </View>

          {/* Calendar rows skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={{ marginTop: 10 }}>
              <Skeleton 
                height={20} 
                radius="round" 
                colorMode={isDarkMode ? 'dark' : 'light'}
              />
            </View>
          ))}

          {/* Streak section skeleton */}
          <View style={{ marginTop: 20 }}>
            <Skeleton 
              width="40%" 
              height={20} 
              radius="round" 
              colorMode={isDarkMode ? 'dark' : 'light'}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton 
                key={i} 
                width={30} 
                height={30} 
                radius="round" 
                colorMode={isDarkMode ? 'dark' : 'light'} 
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            {/* Date Navigation */}
            <View style={styles.dateContainer}>
              <TouchableOpacity onPress={goToPrevDay} style={{ paddingHorizontal: 20 }}>
                <FontAwesome6 name="arrow-left" size={24} color={theme.colors.text.muted} />
              </TouchableOpacity>
              <View style={styles.dateInnerContainer}>
                <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                  {format(selectedDate, 'MMMM dd, yyyy')}
                </Text>
                <Text style={[styles.dayText, { color: theme.colors.text.secondary }]}>
                  {format(selectedDate, 'EEEE')}
                </Text>
              </View>
              {canGoNext ? (
                <TouchableOpacity onPress={goToNextDay} style={styles.chevronContainer}>
                  <FontAwesome6 name="arrow-right" size={24} color={theme.colors.text.muted} />
                </TouchableOpacity>
              ) : (
                <View style={styles.chevronContainer} />
              )}
            </View>

            {/* Prayer Toggle Rows */}
            {PRAYER_SESSIONS.map((prayer) => {
              const bgColor = prayerColors[prayer][isDarkMode ? 'dark' : 'light'];
              const isAvailable = toggablePrayers?.find(p => p.prayer === prayer)?.isAvailable;
              const isLoggedPrayer = prayerLog?.prayers[prayer] || false;

              return (
                <View
                  key={prayer}
                  style={[
                    styles.prayerContainer,
                    { backgroundColor: isAvailable ? bgColor : `${bgColor}99` },
                    !isLoggedPrayer && styles.inactivePrayerContainer,
                  ]}
                >
                  <Text
                    style={[
                      styles.prayerLabel,
                      { color: theme.colors.text.primary },
                      !isLoggedPrayer && styles.inactivePrayerLabel,
                    ]}
                  >
                    {prayer}
                  </Text>
                  <Animated.View style={{ transform: [{ scale: toggleScale }, { translateX: shakeAnimation }] }}>
                    <TouchableOpacity onPress={() => handleTogglePrayer(prayer)}>
                      <FontAwesome6
                        name={isLoggedPrayer ? 'check' : 'xmark'}
                        color={isLoggedPrayer ? '#A3C0BB' : 'red'}
                        size={22}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              );
            })}

            {/* Weekly Prayer Log */}
            <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>
              Weekly Prayer Log
            </Text>

            <View style={styles.calendarContainer}>
              {/* Day headers */}
              <View style={styles.row}>
                <Text style={styles.sessionHeaderCell} />
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.dayHeaderCell,
                      index === currentDayIndex && styles.currentDayHeaderCell,
                    ]}
                  >
                    {day}
                  </Text>
                ))}
              </View>

              {/* Prayer sessions as rows */}
              {PRAYER_SESSIONS.map((session) => (
                <View key={session} style={styles.row}>
                  <Text style={[styles.sessionLabel, { color: theme.colors.text.primary }]}>
                    {session}
                  </Text>
                  {Array.from({ length: 7 }).map((_, dayIndex) => (
                    <View key={dayIndex} style={styles.cell}>
                      <FontAwesome6
                        name="circle"
                        size={12}
                        color={
                          isLogged(dayIndex, session)
                            ? theme.colors.text.primary
                            : theme.colors.text.muted
                        }
                        solid={isLogged(dayIndex, session)}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Prayer Streak */}
          <View style={[styles.streakContainer, { backgroundColor: theme.colors.secondary }]}>
            <Text style={[styles.streakText, { color: theme.colors.text.primary }]}>
              Prayer Streak: {streakInfo.current} days
            </Text>
            {renderFlames()}
          </View>
        </ScrollView>
      )}

      {/* Auth Modal */}
      <SignInModal 
        isVisible={isAuthModalVisible} 
        onClose={() => setIsAuthModalVisible(false)} 
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const createStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.primary,
    },
    section: {
      marginBottom: 20,
    },
    sectionHeader: {
      fontSize: 18,
      fontFamily: 'Outfit_600SemiBold',
      marginTop: 10,
      marginBottom: 20,
    },
    prayerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
    },
    prayerLabel: {
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
    },
    inactivePrayerContainer: {
      opacity: 0.6,
    },
    inactivePrayerLabel: {
      textDecorationLine: 'line-through',
      opacity: 0.7,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    dateInnerContainer: {
      alignItems: 'center',
    },
    dateText: {
      fontSize: 18,
      fontFamily: 'Outfit_600SemiBold',
      marginHorizontal: 10,
    },
    chevronContainer: {
      width: 40,
      alignItems: 'center',
    },
    dayText: {
      fontSize: 14,
      fontFamily: 'Outfit_400Regular',
      marginTop: 4,
    },
    calendarContainer: {
      marginTop: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    sessionHeaderCell: {
      width: 60,
    },
    dayHeaderCell: {
      flex: 1,
      textAlign: 'center',
      fontSize: 12,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
    },
    sessionLabel: {
      width: 60,
      fontSize: 14,
      fontFamily: 'Outfit_600SemiBold',
      textAlign: 'center',
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    currentDayHeaderCell: {
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.secondary,
      borderRadius: 4,
      paddingVertical: 2,
    },
    streakContainer: {
      alignItems: 'center',
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
      gap: 15,
    },
    streakText: {
      alignSelf: 'flex-start',
      fontSize: 16,
      fontFamily: 'Outfit_600SemiBold',
    },
    flameIcon: {
      marginHorizontal: 10,
    },
    flamesContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
  });

export default PrayersDashboard;
