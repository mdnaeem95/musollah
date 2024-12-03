import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { useFocusEffect } from 'expo-router';
import { fetchPrayerLog, fetchWeeklyPrayerLogs, savePrayerLog } from '../../../../redux/slices/userSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { startOfWeek, format, subDays, addDays, eachDayOfInterval } from 'date-fns';
import SignInModal from '../../../../components/SignInModal';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { addXP, completeChallenge, updateStreak } from '../../../../redux/slices/gamificationSlice';

type PrayerLog = {
  Subuh: boolean;
  Zohor: boolean;
  Asar: boolean;
  Maghrib: boolean;
  Isyak: boolean;
};

const PrayersDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { error } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const [weeklyLogs, setWeeklyLogs] = useState<{ [date: string]: PrayerLog }>({});
  const [todayLogs, setTodayLogs] = useState<PrayerLog>({
    Subuh: false,
    Zohor: false,
    Asar: false,
    Maghrib: false,
    Isyak: false,
  });
  const gamification = useSelector((state: RootState) => state.gamification)

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const firestore = getFirestore();

  const prayerSessions = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const isLogged = (dayIndex: number, session: string) => {
    const date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
    //@ts-ignore
    return weeklyLogs[date]?.[session] || false;
  };

  const getCurrentDayIndex = () => {
    const today = new Date();
    const dayIndex = today.getDay() - 1; // Adjust so that 0 = Monday
    return dayIndex < 0 ? 6 : dayIndex; // Wrap around for Sunday as the last index
  };
  
  const currentDayIndex = getCurrentDayIndex();

  // useFocusEffect to fetch logs whenever the page is focused
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchLogsForDate(selectedDate); // Fetch logs for the currently selected date
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
          .catch((error) => console.error('Error fetching weekly prayer logs:', error));
      }
    }, [dispatch])
  );

  const handleTogglePrayer = async (prayer: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

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

      setTodayLogs(updatedLogs);
      try {
        await dispatch(
          savePrayerLog({
            userId: currentUser.uid,
            date: format(selectedDate, 'yyyy-MM-dd'),
            prayerLog: updatedLogs,
          })
        ).unwrap();

        dispatch(addXP(10));

        // Check if all prayers logged for the day
        const allPrayersCompleted = Object.values(updatedLogs).every((logged) => logged);
        if (allPrayersCompleted) {
          dispatch(updateStreak(1));
          dispatch(completeChallenge('daily'));
        } 
      } catch (error) {
        console.error('Error saving prayer log:', error);
        Alert.alert('Error', 'Failed to save prayer log. Please try again.');
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

  // Function to navigate to the previous day
  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    fetchLogsForDate(newDate);
  };

  // Function to navigate to the next day
  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    fetchLogsForDate(newDate);
  };

  // Update this function to fetch logs for a specific date
  const fetchLogsForDate = async (date: Date) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const result = await dispatch(fetchPrayerLog({ date: formattedDate })).unwrap();
      setTodayLogs(result.prayerLog || {}); // Update logs for the selected date
    } catch (error) {
      console.error('Error fetching prayer logs for selected date:', error);
    }
  };

  return (
    <View style={styles.safeArea}>
      {loading ? (
        <ActivityIndicator size="large" color="#CCC" style={{ justifyContent: 'center', alignItems: 'center' }} />
      ) : (
        <>
          <ScrollView>
            {/* GAMIFICATION PROGRESS SECTION */}
            <View>
              <Text>Level: {gamification.level}</Text>
              <Text>XP: {gamification.xp}</Text>
              <Text>Streak: {gamification.streak}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.dateContainer}>
                <TouchableOpacity onPress={handlePreviousDay} style={{ paddingHorizontal: 20 }}>
                  <FontAwesome6 name="arrow-left" size={24} color="#A3C0BB" />
                </TouchableOpacity>
                <View style={styles.dateInnerContainer}>
                  <Text style={styles.dateText}>{format(selectedDate, 'MMMM dd, yyyy')}</Text>
                  <Text style={styles.dayText}>{format(selectedDate, 'EEEE')}</Text>
                </View>
                <TouchableOpacity onPress={handleNextDay} style={{ paddingHorizontal: 20 }}>
                  <FontAwesome6 name="arrow-right" size={24} color="#A3C0BB" />
                </TouchableOpacity>
              </View>

              {/* Display each prayer session in its own container */}
              {prayerSessions.map((prayer) => (
                <View 
                  key={prayer}
                  //@ts-ignore
                  style={[styles.prayerContainer, !todayLogs[prayer] && styles.inactivePrayerContainer]}
                >
                  <Text
                    //@ts-ignore
                    style={[styles.prayerLabel, !todayLogs[prayer] && styles.inactivePrayerLabel]}
                  >
                    {prayer}
                  </Text>
                  <TouchableOpacity onPress={() => handleTogglePrayer(prayer)}>
                    {todayLogs[prayer] ? (
                      <FontAwesome6 name="check" color="#A3C0BB" size={22} />
                    ) : (
                      <FontAwesome6 name="xmark" color="red" size={22} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.sectionHeader}>Weekly Prayer Log</Text>

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
                {prayerSessions.map((session, sessionIndex) => (
                  <View key={session} style={styles.row}>
                    <Text style={styles.sessionLabel}>{session}</Text>
                    {Array.from({ length: 7 }).map((_, dayIndex) => (
                      <View key={dayIndex} style={styles.cell}>
                        <FontAwesome6 
                          name="circle" 
                          size={12} 
                          color={isLogged(dayIndex, session) ? '#A3C0BB' : '#4D6561'} 
                          solid={isLogged(dayIndex, session)} 
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </>
      )}
      <SignInModal isVisible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2E3D3A',
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
    backgroundColor: '#3A504C',
    borderRadius: 10,
    marginBottom: 10,
  },
  prayerLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
  },
  logButton: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular'
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
    color: '#ECDFCC',
    marginHorizontal: 10,
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
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
    color: '#ECDFCC',
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDayHeaderCell: {
    color: '#ECDFCC', // Brighter text for the current day
    backgroundColor: '#4D6561',// Underline for emphasis (optional)
  },
});

export default PrayersDashboard;
