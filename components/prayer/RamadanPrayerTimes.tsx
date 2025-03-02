import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getShortFormattedDate, scaleSize, shakeButton } from '../../utils';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store/store';
import { fetchPrayerTimesFromFirebase } from '../../redux/slices/prayerSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { getAuth } from '@react-native-firebase/auth';
import { fetchPrayerLog, savePrayerLog } from '../../redux/slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from 'expo-router';
import { PrayerLog } from '../../app/(tabs)/(prayer)/prayerDashboard';
import { format } from 'date-fns';
import SignInModal from '../SignInModal';

// Function to generate dates dynamically
const generateDates = () => {
  const today = new Date();
  const dates = [];

  for (let i = -5; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({ 
      day: date.getDate(),
      month: date.toLocaleString('en-US', { month: 'long' }),
      year: date.getFullYear(),
      isToday: i === 0,
      dateString: format(date, 'd/M/yyyy'), // Ensure no leading zeros!
  });
  }

  return dates;
};

const RamadanPrayerTimes = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const dates = generateDates();
  const styles = createStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const { prayerTimes, islamicDate, isLoading } = useSelector((state: RootState) => state.prayer);
  const [selectedDate, setSelectedDate] = useState(dates.find(date => date.isToday));
  const [todayLogs, setTodayLogs] = useState<PrayerLog>({
    Subuh: false,
    Zohor: false,
    Asar: false,
    Maghrib: false,
    Isyak: false,
  });
  const [toggablePrayers, setToggablePrayers] = useState<{isAvailable: boolean, prayer: string}[]>();
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current
  
  // Scroll to center today's date on mount
  useEffect(() => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: scaleSize(80) * 4, // Scroll to today's position
          animated: true,
        });
      }
    }, 100);
  }, []);

  useEffect(() => {
    checkPrayerPassed().then(setToggablePrayers);
  }, []);

  const currentDate = new Date();
  const shortFormattedDate = getShortFormattedDate(currentDate);
  
  // Feth logged prayers for selected date
  const fetchLogsForDate = async (dateString: string) => {
    try {
        setLoadingLogs(true);

        // Debugging log: Check what dateString is
        console.log("Fetching logs for dateString:", dateString);

        // ✅ Convert M/D/YYYY to YYYY-MM-DD (ensuring leading zeros)
        const [month, day, year] = dateString.split('/').map(num => num.padStart(2, '0')); 
        const formattedDate = `${year}-${month}-${day}`;
        
        console.log("Formatted date for fetching logs:", formattedDate);

        const result = await dispatch(fetchPrayerLog({ date: formattedDate })).unwrap();
        setTodayLogs(result.prayerLog || {});
    } catch (error) {
        console.error('Error fetching prayer logs: ', error);
    } finally {
        setLoadingLogs(false);
    }
  }

  // fetch prayer session avalability
  const checkPrayerPassed = async () => {
    try {
      const prayerSessionTimes = await AsyncStorage.getItem(`prayers_${shortFormattedDate}`);
      const prayerSessionTimesData = JSON.parse(prayerSessionTimes!);
      
      if (!prayerSessionTimesData) return;
      
      const currentTime = new Date();  
      // Convert prayer times to comparable Date objects
      return Object.entries(prayerSessionTimesData.prayerTimes).map(([prayer, time]) => {
        //@ts-ignore
        const [hour, minute] = time.split(":").map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(hour, minute, 0, 0);
        return { prayer, isAvailable: currentTime >= prayerDate };
      });
    } catch (error) {
      console.error('Error checking prayer availability: ', error);
      return [];
    }
  };

  const handleTogglePrayer = async (prayer: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const isAvailable = toggablePrayers?.find(item => item.prayer === prayer)?.isAvailable;
    if (!isAvailable) {
        shakeButton(shakeAnimation);
        Toast.show({
            type: 'removed',
            text1: `Can't log ${prayer} as it's not time yet.`,
            visibilityTime: 2000,
            autoHide: true,
        });
        return
    }

    if (currentUser) {
        const updatedLogs = {
          ...todayLogs,
          //@ts-ignore
          [prayer]: !todayLogs[prayer],
        };
    
        setTodayLogs(updatedLogs);
        try {
          const [day, month, year] = (selectedDate?.dateString ?? '').split('/');
          if (!day || !month || !year) throw new Error('Invalid selectedDate.dateString format');

          const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

          await dispatch(
            savePrayerLog({
              userId: currentUser.uid,
              //@ts-ignore
              date: formattedDate,
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
  }

  // useFocusEffect to fetch logs whenever the page is focused
  useFocusEffect(
    useCallback(() => {
      if (!selectedDate) return;
  
      const fetchPrayerData = async () => {
        try {
          console.log("📅 Fetching prayer times for:", selectedDate.dateString);
  
          // Dispatch Redux action with properly formatted date
          await dispatch(fetchPrayerTimesFromFirebase({ inputDate: selectedDate.dateString })).unwrap();
  
          // Fetch logs if user is authenticated
          if (currentUser) {
            fetchLogsForDate(selectedDate.dateString);
          } else {
            console.log("User not authenticated. Skipping prayer log fetch.");
          }
        } catch (error) {
          console.error("❌ Error fetching prayer times:", error);
        }
      };
  
      fetchPrayerData();
    }, [selectedDate, dispatch, currentUser])
  );  
  
  return (
    <View style={styles.container}>
      {/* Top Section: Date Scroller */}
      <Text style={styles.header}>Prayer Times & Logger</Text>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={scrollViewRef}>
          {dates.map((dateItem, index) => (
            <TouchableOpacity key={index} style={styles.dateWrapper} onPress={() => setSelectedDate(dateItem)}>
                <View style={[styles.dateItem, dateItem.dateString === selectedDate?.dateString && styles.todayHighlight]}>
                    <Text style={[styles.dateDay, dateItem.dateString === selectedDate?.dateString && styles.todayText]}>{dateItem.day}</Text>
                </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Display Selected Date Information */}
      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedMonth}>{selectedDate?.month}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.text.secondary} />
        ) : (
          <Text style={styles.hijriDate}>{islamicDate || 'Loading...'}</Text>
        )}
      </View>

      {/* Prayer Times Table */}
      <View style={styles.prayerTimesContainer}>
        {isLoading || loadingLogs ? (
          <ActivityIndicator size="large" color={theme.colors.text.primary} />
        ) : prayerTimes ? (
          Object.entries(prayerTimes)
          .map(([session, time], index) => (
            <View key={index} style={styles.prayerRow}>
              <View style={styles.column}>
                <Text style={styles.prayerSessionText}>{session}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.prayerTimeText}>{time}</Text>
              </View>
              <View style={styles.column}>
                {session !== "Syuruk" && (
                    <TouchableOpacity onPress={() => handleTogglePrayer(session)}>
                        <FontAwesome6
                            //@ts-ignore
                            name={todayLogs[session] ? "check": "xmark"} 
                            size={18} 
                            color={theme.colors.text.primary} 
                        />
                    </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>Prayer times not available.</Text>
        )}
      </View>

      <SignInModal isVisible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: theme.spacing.medium,
      gap: 20
    },
    header: {
      fontSize: scaleSize(18),
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
    },
    dateWrapper: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    dateItem: {
      width: scaleSize(40),
      height: scaleSize(40),
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.medium,
      marginRight: theme.spacing.small,
      justifyContent: 'center',
      alignItems: 'center',
    },
    todayHighlight: {
        backgroundColor: theme.colors.muted,
        borderRadius: scaleSize(20),
        borderWidth: 2,
        borderColor: theme.colors.text.primary
    },
    dateDay: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: scaleSize(18),
      color: theme.colors.text.primary,
    },
    todayText: {
        fontSize: scaleSize(26),
        fontFamily: 'Outfit_700Bold',
        color: theme.colors.accent
    },
    dateMonth: {
      fontFamily: 'Outfit_400Regular',
      fontSize: scaleSize(14),
      color: theme.colors.text.secondary,
    },
    dateHijri: {
      fontFamily: 'Outfit_400Regular',
      fontSize: scaleSize(12),
      color: theme.colors.text.muted,
    },
    // Bottom Section: Prayer Times Table styles
    prayerTimesContainer: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      ...theme.shadows.default,
    },
    prayerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.small,
    },
    column: {
      flex: 1,
      alignItems: 'center',
    },
    prayerSessionText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: scaleSize(16),
      color: theme.colors.text.primary,
    },
    prayerTimeText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: scaleSize(16),
      color: theme.colors.text.primary,
    },
    crossText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: scaleSize(16),
      color: theme.colors.text.primary,
    },
    selectedDateContainer: {
        alignItems: 'center',
      },
      selectedMonth: {
        fontFamily: 'Outfit_400Regular',
        fontSize: scaleSize(16),
        color: theme.colors.text.secondary,
      },
      hijriDate: {
        fontFamily: 'Outfit_400Regular',
        fontSize: scaleSize(14),
        color: theme.colors.text.muted,
        marginTop: 5,
      },
      noDataText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: scaleSize(16),
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginTop: 10,
      },
});

export default RamadanPrayerTimes;