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

        console.log("🔍 Fetching logs for:", dateString);

        // ✅ Convert D/M/YYYY → YYYY-MM-DD (Ensuring Leading Zeros)
        const [day, month, year] = dateString.split('/').map(num => num.padStart(2, '0'));
        const formattedDate = `${year}-${month}-${day}`;

        console.log("📌 Corrected formatted date:", formattedDate);

        // Fetch logs from backend
        const result = await dispatch(fetchPrayerLog({ date: formattedDate })).unwrap();

        console.log("✅ Fetched prayer log:", result);

        // ✅ Ensure it's updating correctly
        if (result && result.prayerLog) {
            setTodayLogs(result.prayerLog);
        } else {
            console.warn("⚠️ No prayer logs found, resetting...");
            setTodayLogs({
                Subuh: false,
                Zohor: false,
                Asar: false,
                Maghrib: false,
                Isyak: false,
            });
        }
    } catch (error) {
        console.error("❌ Error fetching prayer logs:", error);
    } finally {
        setLoadingLogs(false);
    }
  };

  // fetch prayer session avalability
  const checkPrayerPassed = async () => {
    try {
      console.log("⏳ Checking prayer availability...");
      
      // 🔍 Fetch Cached Prayer Times for Selected Date
      const prayerSessionTimes = await AsyncStorage.getItem(`prayers_${shortFormattedDate}`);
      if (!prayerSessionTimes) {
        console.log("⚠️ No cached prayer data found.");
        return [];
      }
  
      const prayerSessionTimesData = JSON.parse(prayerSessionTimes);
      console.log("📌 Cached Prayer Data:", prayerSessionTimesData);
  
      const currentTime = new Date();
      console.log("🕰️ Current Time:", currentTime.toLocaleTimeString());
  
      // 🔍 Convert prayer times to Date objects and compare
      return Object.entries(prayerSessionTimesData.prayerTimes).map(([prayer, time]) => {
        console.log(`🔍 Processing: ${prayer} - ${time}`);
        
        if (!time) {
          console.log(`⚠️ Skipping ${prayer}, invalid time.`);
          return { prayer, isAvailable: false };
        }
  
        //@ts-ignore
        const [hour, minute] = time.split(":").map(Number);
        if (isNaN(hour) || isNaN(minute)) {
          console.error(`❌ Invalid time format for ${prayer}:`, time);
          return { prayer, isAvailable: false };
        }
  
        const prayerDate = new Date();
        prayerDate.setHours(hour, minute, 0, 0);
        console.log(`🕰️ Prayer Time: ${prayerDate.toLocaleTimeString()}`);
  
        return { prayer, isAvailable: currentTime >= prayerDate };
      });
    } catch (error) {
      console.error('❌ Error checking prayer availability:', error);
      return [];
    }
  };
  
  const handleTogglePrayer = async (prayer: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
  
    console.log(`📝 Trying to log ${prayer} for ${selectedDate?.dateString}...`);
  
    // Convert selectedDate to a Date object
    const [day, month, year] = (selectedDate?.dateString ?? '').split('/');
    if (!day || !month || !year) {
      console.error('❌ Invalid selectedDate.dateString format:', selectedDate?.dateString);
      return;
    }
  
    const selectedDateObject = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    
    // Normalize to **midnight** for accurate date-only comparison
    selectedDateObject.setHours(0, 0, 0, 0);
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    console.log(`📅 Selected Date: ${selectedDateObject}`);
    console.log(`📅 Today (Normalized): ${today}`);
  
    // 🚨 Prevent logging for future dates
    if (selectedDateObject > today) {
      console.log("🚨 Cannot log prayers for future dates!");
      Toast.show({
        type: 'removed',
        text1: "You can't log prayers for future dates.",
        visibilityTime: 2000,
        autoHide: true,
      });
      return;
    }
  
    // ✅ Check if logging is allowed for **today** or **past dates**
    const isAvailable = toggablePrayers?.find(item => item.prayer === prayer)?.isAvailable;
    console.log(`🔍 Prayer Availability: ${prayer} isAvailable =`, isAvailable);
  
    if (!isAvailable && selectedDateObject.getTime() !== today.getTime()) {
      shakeButton(shakeAnimation);
      Toast.show({
        type: 'removed',
        text1: `Can't log ${prayer} as it's not time yet.`,
        visibilityTime: 2000,
        autoHide: true,
      });
      return;
    }
  
    if (currentUser) {
      const updatedLogs = {
        ...todayLogs,
        //@ts-ignore
        [prayer]: !todayLogs[prayer], // Toggle log state
      };
  
      console.log("✅ Updated Logs:", updatedLogs);
  
      setTodayLogs(updatedLogs);
      
      try {
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log("📅 Formatted Date for Logging:", formattedDate);
  
        await dispatch(
          savePrayerLog({
            userId: currentUser.uid,
            date: formattedDate,
            prayerLog: updatedLogs,
          })
        ).unwrap();
  
        console.log("✅ Successfully logged prayer!");
      } catch (error) {
        console.error('❌ Error saving prayer log:', error);
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