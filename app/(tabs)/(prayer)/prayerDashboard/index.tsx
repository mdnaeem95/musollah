import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../../redux/store/store';
import { useFocusEffect } from 'expo-router';
import { fetchPrayerLog, fetchWeeklyPrayerLogs, savePrayerLog } from '../../../../redux/slices/userSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { startOfWeek, format, subDays, addDays } from 'date-fns';
import SignInModal from '../../../../components/SignInModal';
import { getAuth } from '@react-native-firebase/auth';
import { shakeButton } from '../../../../utils';
import { usePrayerStreakManager } from '../../../../hooks/usePrayerStreakManager'
import { Skeleton } from 'moti/skeleton';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../context/ThemeContext';
import { getCurrentDayIndex, goToPreviousDay, goToNextDay, isToday, isSameDate } from '../../../../utils/prayers/dates';
import { getPrayerAvailability } from '../../../../utils/prayers/logging';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';

export type PrayerLog = {
  Subuh: boolean;
  Zohor: boolean;
  Asar: boolean;
  Maghrib: boolean;
  Isyak: boolean;
};

const prayerColors = {
  Subuh: {
    light: '#DCEFFB',
    dark: '#1E2A36', // dark navy blue
  },
  Zohor: {
    light: '#FFF4D6',
    dark: '#332B1E', // earthy brown
  },
  Asar: {
    light: '#FFE3C8',
    dark: '#3A2A22', // warm amber-brown
  },
  Maghrib: {
    light: '#F9D0D3',
    dark: '#3A1F24', // dusky rose
  },
  Isyak: {
    light: '#D7D3F9',
    dark: '#272547', // deep indigo
  },
};


const PrayersDashboard = () => {
  const { prayerTimes } = useSelector((state: RootState) => state.prayer);
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme);

  // State and Redux
  const dispatch = useDispatch<AppDispatch>();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  //State
  const [todayLogs, setTodayLogs] = useState<PrayerLog>({
    Subuh: false,
    Zohor: false,
    Asar: false,
    Maghrib: false,
    Isyak: false,
  });
  const [weeklyLogs, setWeeklyLogs] = useState<{ [date: string]: PrayerLog }>({});
  const [toggablePrayers, setToggablePrayers] = useState<{isAvailable: boolean, prayer: string}[]>();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // animations
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const toggleScale = useRef(new Animated.Value(1)).current;

  const playToggleAnimation = () => {
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
  };  

  // constants
  const prayerSessions = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  // streak hook
  const streakInfo = usePrayerStreakManager(weeklyLogs, currentUser?.uid!);

  // check if prayer is logged for a specific day and session
  const isLogged = (dayIndex: number, session: string) => {
    const date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
    //@ts-ignore
    return weeklyLogs[date]?.[session] || false;
  };

  const currentDayIndex = getCurrentDayIndex();
  console.log(selectedDate, new Date())

  useEffect(() => {
    if (prayerTimes && isSameDate(selectedDate, new Date())) {
      const availability = getPrayerAvailability(prayerTimes);
      setToggablePrayers(availability);
    } else {
      // 🧼 Clear it out to avoid stale toggles affecting other days
      setToggablePrayers(undefined);
    }
  }, [prayerTimes, selectedDate]);
   
  
  // useFocusEffect to fetch logs whenever the page is focused
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchLogsForDate(selectedDate);
        // dispatch(fetchGamificationState(currentUser.uid))
      } else {
        console.log('User not authenticated. Skipping prayer log fetch.');
      }
    }, [selectedDate, dispatch]) // Include selectedDate in the dependency array
  );

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        const startDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
        const endDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');
        dispatch(fetchWeeklyPrayerLogs({ startDate, endDate }))
          .unwrap()
          .then(setWeeklyLogs)
          .catch((error) => {
            console.error('Error fetching weekly prayer logs:', error)
            Toast.show({
              type: 'error',
              text1: 'Failed to fetch weekly prayer logs.',
              text2: 'Please check your connection or try again later.',
            });
          })
      }
    }, [dispatch])
  );

  // Update this function to fetch logs for a specific date
  const fetchLogsForDate = async (date: Date) => {
    try {
      const result = await dispatch(fetchPrayerLog({ date: format(date, 'yyyy-MM-dd') })).unwrap();
      setTodayLogs(result.prayerLog || {})
    } catch (error) {
      console.error('Error fetching prayer logs for selected date:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load logs for this date.',
      });
    }
  };

  const handleTogglePrayer = async (prayer: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const isTodaySelected = isSameDate(selectedDate, new Date());

    // Check if prayer is available
    const isAvailable = !isTodaySelected || toggablePrayers?.find((item) => item.prayer === prayer)?.isAvailable;
    if (!isAvailable) { 
      shakeButton(shakeAnimation);

      // Show toast message
      Toast.show({
        type: 'removed',
        text1: `Can't log for ${prayer} as it's not time yet.`,
        visibilityTime: 2000,
        autoHide: true
      });
  
      return; // Prevent further processing
    }

    if (currentUser) {
      const updatedLogs = {
        ...todayLogs,
        //@ts-ignore
        [prayer]: !todayLogs[prayer],
      };

      // Update weeklyLogs for the selected date
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      setWeeklyLogs((prevLogs) => ({
        ...prevLogs,
        [formattedDate]: updatedLogs,
      }));

      playToggleAnimation();
      setTodayLogs(updatedLogs);
      try {
        await dispatch(
          savePrayerLog({
            userId: currentUser.uid,
            date: format(selectedDate, 'yyyy-MM-dd'),
            prayerLog: updatedLogs,
          })
        ).unwrap();
      } catch (error) {
        console.error('Error saving prayer log:', error);
        Toast.show({
          type: 'error',
          text1: `Couldn’t save log for ${prayer}`,
          text2: 'Please try again shortly.',
        });
      }
    } else {
      Alert.alert(
        'Authentication Required',
        'Please create an account to log your prayers.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => setIsAuthModalVisible(true) },
        ]
      );
    }
  };

  const handlePreviousDay = () => {
    const newDate = goToPreviousDay(selectedDate);
    setSelectedDate(newDate);
    fetchLogsForDate(newDate);
  };
  
  const handleNextDay = () => {
    if (isToday(selectedDate)) return;
    const newDate = goToNextDay(selectedDate);
    setSelectedDate(newDate);
    fetchLogsForDate(newDate);
  };  

  const renderFlames = () => {
    const { current } = streakInfo;
    // console.log('Current streak: ', current);
    const flames = Array.from({ length: 7 }, (_, index) => (
      <FontAwesome6
        key={index}
        name="person-praying"
        size={24}
        color={index < current ? '#FFA500' : '#A3C0BB'}
        solid={index < current}
        style={styles.flameIcon}
      />
    ))
    return flames;
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.colors.primary }]}>
      {loading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 24 }}>
        {/* Date skeletons */}
        <Skeleton width="60%" height={24} radius="round" colorMode={isDarkMode ? 'dark' : 'light'} />
        <Skeleton width="40%" height={18} radius="round" colorMode={isDarkMode ? 'dark' : 'light'} />

        {/* Prayer toggle rows */}
        {['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'].map((_, i) => (
          <Skeleton key={i} height={48} radius={12} colorMode={isDarkMode ? 'dark' : 'light'} />
        ))}

        {/* Weekly Log header */}
        <Skeleton width="50%" height={20} radius="round" colorMode={isDarkMode ? 'dark' : 'light'} />

        {/* Calendar rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={20} radius="round" colorMode={isDarkMode ? 'dark' : 'light'} />
        ))}

        {/* Streak section */}
        <Skeleton width="40%" height={20} radius="round" colorMode={isDarkMode ? 'dark' : 'light'} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} width={30} height={30} radius="round" colorMode={isDarkMode ? 'dark' : 'light'} />
          ))}
        </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <View style={styles.dateContainer}>
                <TouchableOpacity onPress={handlePreviousDay} style={{ paddingHorizontal: 20 }}>
                  <FontAwesome6 name="arrow-left" size={24} color={theme.colors.text.muted} />
                </TouchableOpacity>
                <View style={styles.dateInnerContainer}>
                  <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>{format(selectedDate, 'MMMM dd, yyyy')}</Text>
                  <Text style={[styles.dayText, { color: theme.colors.text.secondary }]}>{format(selectedDate, 'EEEE')}</Text>
                </View>
                {/* Right chevron or placeholder */}
                {selectedDate.toDateString() !== new Date().toDateString() ? (
                  <TouchableOpacity onPress={handleNextDay} style={styles.chevronContainer}>
                    <FontAwesome6 name="arrow-right" size={24} color={theme.colors.text.muted} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.chevronContainer} />
                )}
              </View>

              {/* Display each prayer session in its own container */}
              {prayerSessions.map((prayer) => {
                //@ts-ignore
                const bgColor = prayerColors[prayer][isDarkMode ? 'dark' : 'light'];
                const isAvailable = toggablePrayers?.find(p => p.prayer === prayer)?.isAvailable;
                return (
                  <View 
                    key={prayer}
                    style={[
                      styles.prayerContainer,
                      {backgroundColor: isAvailable ? bgColor : `${bgColor}99` },
                      //@ts-ignore
                      !todayLogs[prayer] && styles.inactivePrayerContainer,
                    ]}                    
                  >
                    <Text
                      //@ts-ignore
                      style={[styles.prayerLabel, { color: theme.colors.text.primary }, !todayLogs[prayer] && styles.inactivePrayerLabel]}
                    >
                      {prayer}
                    </Text>
                    <Animated.View style={{ transform: [{ scale: toggleScale }, { translateX: shakeAnimation }] }}>
                      <TouchableOpacity onPress={() => handleTogglePrayer(prayer)}>
                        {todayLogs[prayer] ? (
                          <FontAwesome6 name="check" color="#A3C0BB" size={22} />
                        ) : (
                          <FontAwesome6 name="xmark" color="red" size={22} />
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  </View> 
                )
              })}

              <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>Weekly Prayer Log</Text>

              <View style={styles.calendarContainer}>
                <View style={styles.row}>
                  <Text style={styles.sessionHeaderCell} ></Text>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <Text 
                      key={index} 
                      style={[styles.dayHeaderCell, index === currentDayIndex && styles.currentDayHeaderCell]}
                    >
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Prayer Sessions as rows */}
                {prayerSessions.map((session) => (
                  <View key={session} style={styles.row}>
                    <Text style={[styles.sessionLabel, { color: theme.colors.text.primary }]}>{session}</Text>
                    {Array.from({ length: 7 }).map((_, dayIndex) => (
                      <View key={dayIndex} style={styles.cell}>
                        <FontAwesome6 
                          name="circle" 
                          size={12} 
                          color={isLogged(dayIndex, session) ? theme.colors.text.primary : theme.colors.text.muted } 
                          solid={isLogged(dayIndex, session)} 
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.streakContainer, { backgroundColor: theme.colors.secondary }]}>
              <Text style={[styles.streakText, { color: theme.colors.text.primary }]}>Prayer Streak</Text>
              <View style={styles.flamesContainer}>{renderFlames()}</View>
            </View>
          </ScrollView>
        </>
      )}
      <SignInModal isVisible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} />
    </View>
  );
};

const createStyles = (theme: any) =>  
  StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 10,
    marginBottom: 20,
    color: '#ECDFCC'
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
    backgroundColor: '#757575', // Greyed-out background for false state
  },
  inactivePrayerLabel: {
    textDecorationLine: 'line-through', // Strikethrough text for false state
    color: '#B0B0B0', // Light grey color for text when false
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dateInnerContainer: {
    alignItems: 'center'
  },
  dateText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginHorizontal: 10,
  },
  chevronContainer: {
    width: 40, // Ensure chevrons and placeholders take equal space
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4
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
    color: '#A3C0BB',
  },
  sessionLabel: {
    width: 60, // Fixed width for alignment with daily columns
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDayHeaderCell: {
    color: theme.colors.text.primary, // Brighter text for the current day
    backgroundColor: theme.colors.secondary
  },
  streakContainer: {
    alignItems: 'center',
    backgroundColor: '#3A504C',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    gap: 15
  },
  streakText: {
    alignSelf: 'flex-start',
    color: '#ECDFCC',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold'
  },
  flameIcon: {
    marginHorizontal: 10
  },
  flamesContainer: {
    flexDirection: 'row',
    justifyContent: "center"
  }
});

export default PrayersDashboard;
