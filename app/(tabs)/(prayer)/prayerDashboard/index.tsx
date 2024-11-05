import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { useFocusEffect } from 'expo-router';
import { fetchPrayerLog, savePrayerLog } from '../../../../redux/slices/userSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { differenceInDays, endOfMonth, startOfMonth } from 'date-fns';
import SignInModal from '../../../../components/SignInModal';
import { getAuth } from '@react-native-firebase/auth';

type PrayerLog = {
  Subuh: boolean;
  Zohor: boolean;
  Asar: boolean;
  Maghrib: boolean;
  Isyak: boolean;
};

const screenWidth = Dimensions.get('window').width;

const PrayersDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { error } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);
  const [todayLogs, setTodayLogs] = useState<PrayerLog>({
    Subuh: false,
    Zohor: false,
    Asar: false,
    Maghrib: false,
    Isyak: false,
  });
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);
  const [date, setDate] = useState<string>('');
  const [prayersCompleted, setPrayersCompleted] = useState<number>(0);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);

  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const numDaysInMonth = differenceInDays(currentMonthEnd, currentMonthStart) + 1;

  const prayerSessions = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];

  useFocusEffect(
    useCallback(() => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        const fetchData = async () => {
          try {
            const result = await dispatch(fetchPrayerLog()).unwrap();
            setTodayLogs(result.prayerLog);
          } catch (error) {
            console.error('Error fetching today\'s prayer logs:', error);
          }
        };

        fetchData();
      } else {
        console.log('User not authenticated. Skipping prayer log fetch.');
      }
    }, [dispatch])
  );

  const handleTogglePrayer = async (prayer: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const updatedLogs = {
        ...todayLogs,
        [prayer]: !todayLogs[prayer],
      };

      setTodayLogs(updatedLogs);
      try {
        await dispatch(
          savePrayerLog({
            userId: currentUser.uid,
            date: new Date().toISOString().split('T')[0],
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

  return (
    <View style={styles.safeArea}>
      {loading ? (
        <ActivityIndicator size="large" color="#CCC" style={{ justifyContent: 'center', alignItems: 'center' }} />
      ) : (
        <>
          <ScrollView>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Your Prayer Stats for Today</Text>

            {/* Display each prayer session in its own container */}
            {prayerSessions.map((prayer) => (
              <View key={prayer} style={styles.prayerContainer}>
                <Text style={styles.prayerLabel}>{prayer}</Text>
                <TouchableOpacity onPress={() => handleTogglePrayer(prayer)}>
                  {todayLogs[prayer] ? (
                    <FontAwesome6 name="check" color="#A3C0BB" size={22} />
                  ) : (
                    <FontAwesome6 name="xmark" color="red" size={22} />
                  )}
                </TouchableOpacity>
              </View>
            ))}

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
    marginBottom: 10,
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
});

export default PrayersDashboard;
