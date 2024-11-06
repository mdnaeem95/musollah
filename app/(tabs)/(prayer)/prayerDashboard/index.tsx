import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { useFocusEffect } from 'expo-router';
import { fetchPrayerLog, savePrayerLog } from '../../../../redux/slices/userSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { differenceInDays, endOfMonth, startOfMonth, format, subDays, addDays, eachDayOfInterval } from 'date-fns';
import SignInModal from '../../../../components/SignInModal';
import { getAuth } from '@react-native-firebase/auth';

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
  const [todayLogs, setTodayLogs] = useState<PrayerLog>({
    Subuh: false,
    Zohor: false,
    Asar: false,
    Maghrib: false,
    Isyak: false,
  });
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);

  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start, end });

  // Organize days by week
  const weeks = [];
  let currentWeek = [];
  daysInMonth.forEach((day, index) => {
    if (index % 7 === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const prayerSessions = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];

  // useFocusEffect to fetch logs whenever the page is focused
  useFocusEffect(
    useCallback(() => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        fetchLogsForDate(selectedDate); // Fetch logs for the currently selected date
      } else {
        console.log('User not authenticated. Skipping prayer log fetch.');
      }
    }, [selectedDate, dispatch]) // Include selectedDate in the dependency array
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
            <View style={styles.section}>
              <View style={styles.dateContainer}>
                <TouchableOpacity onPress={handlePreviousDay}>
                  <FontAwesome6 name="arrow-left" size={20} color="#A3C0BB" />
                </TouchableOpacity>
                <Text style={styles.dateText}>{format(selectedDate, 'MMMM dd, yyyy')}</Text>
                <TouchableOpacity onPress={handleNextDay}>
                  <FontAwesome6 name="arrow-right" size={20} color="#A3C0BB" />
                </TouchableOpacity>
              </View>

              {/* Display each prayer session in its own container */}
              {prayerSessions.map((prayer) => (
                <View 
                  key={prayer}
                  //@ts-ignore
                  style={[styles.prayerContainer, !todayLogs[prayer] && styles.inactivePrayerContainer]}
                >
                  <Text style={[styles.prayerLabel, !todayLogs[prayer] && styles.inactivePrayerLabel]}>{prayer}</Text>
                  <TouchableOpacity onPress={() => handleTogglePrayer(prayer)}>
                    {todayLogs[prayer] ? (
                      <FontAwesome6 name="check" color="#A3C0BB" size={22} />
                    ) : (
                      <FontAwesome6 name="xmark" color="red" size={22} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.sectionHeader}>Monthly Prayer Log</Text>

              {/* Header for Days of the Week */}
              <View style={styles.headerRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <Text key={index} style={styles.headerCell}>{day}</Text>
                ))}
              </View>

              <ScrollView>
              {/* Prayer Sessions Rows */}
              {prayerSessions.map((session) => (
                <View key={session} style={styles.sessionContainer}>
                  <Text style={styles.sessionLabel}>{session}</Text>

                  {/* Weeks */}
                  {weeks.map((week, weekIndex) => (
                    <View key={`${session}-${weekIndex}`} style={styles.weekRow}>
                      {week.map((day) => (
                        <View key={day.toString()} style={styles.cell}>
                          <Text style={styles.cellText}>o</Text> {/* Placeholder for future data */}
                        </View>
                      ))}
                      {/* Fill empty cells if week has less than 7 days */}
                      {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                        <View key={i} style={styles.emptyCell} />
                      ))}
                    </View>
                  ))}
                </View>
                ))}
              </ScrollView>

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
  dateText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginHorizontal: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A504C',
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#A3C0BB',
  },
  sessionContainer: {
    marginBottom: 20,
  },
  sessionLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 5,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  cell: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3A504C',
    marginHorizontal: 2,
    borderRadius: 5,
  },
  cellText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#D1D5DB',
  },
  emptyCell: {
    width: 30,
    height: 30,
    marginHorizontal: 2,
  },
});

export default PrayersDashboard;
