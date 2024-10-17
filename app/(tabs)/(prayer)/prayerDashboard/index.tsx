import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchMonthlyPrayerLogs, fetchPrayerLog } from '../../../../redux/slices/userSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { ContributionGraph } from 'react-native-chart-kit';
import { differenceInDays, endOfMonth, startOfMonth } from 'date-fns';
import PrayerHeader from '../../../../components/PrayerHeader';
import SignInModal from '../../../../components/SignInModal';
import { getAuth } from '@react-native-firebase/auth';

// Screen Dimensions
const screenWidth = Dimensions.get('window').width;
const auth = getAuth();
const currentUser = auth.currentUser;

const PrayersDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { error, loading } = useSelector((state: RootState) => state.user);

  const [todayLogs, setTodayLogs] = useState<any>(null);
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);
  const [date, setDate] = useState<string>('');
  const [prayersCompleted, setPrayersCompleted] = useState<number>(0);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);

  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const numDaysInMonth = differenceInDays(currentMonthEnd, currentMonthStart) + 1; // Add 1 to include the last day

  // Placeholder for prayer session names
  const prayerSessions = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];

  // Auth Check and fetch today's prayer logs when the screen is focused
  useFocusEffect(
    useCallback(() => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        const fetchData = async () => {
          try {
            const result = await dispatch(fetchPrayerLog()).unwrap();
            if (result.prayerLog) {
              setTodayLogs(result.prayerLog);
            } else {
              setTodayLogs({
                Subuh: false,
                Zohor: false,
                Asar: false,
                Maghrib: false,
                Isyak: false
              })
            }
          } catch (error) {
            console.error('Error fetching today\'s prayer logs', error);
          }
        }
        fetchData();
        console.log(todayLogs)
      } else {
        console.log('User not authenticated. Skipping prayer log fetch. ');
      }
    }, [dispatch, currentUser])
  );

  // Auth Check and fetch monthly prayer logs for the contribution graph
  useFocusEffect(
    useCallback(() => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        const fetchMonthlyData = async () => {
          if (currentUser) {
            try {
              const result = await dispatch(fetchMonthlyPrayerLogs()).unwrap();
              setMonthlyLogs(result);
            } catch (error) {
              console.error('Error fetching monthly prayer logs', error);
            }
          }
        }
        fetchMonthlyData();
      } else {
        console.log('User not authenticated. Skipping monthly prayer logs fetch.');
      }
    }, [dispatch, currentUser])
  );

  // Handle log prayers button click
  const handleLogPrayers = () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      router.push('/prayerDashboard/logger');
    } else {
      Alert.alert(
        'Authentication Required', 
        'Please create an account to log your prayers.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => setIsAuthModalVisible(true) }
        ]
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <PrayerHeader title="Prayer Dashboard" backgroundColor='#4D6561' />

      {/* Scrollable content */}
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Your Prayer Stats for Today</Text>

          {/* Table with two rows */}
          <View style={styles.table}>
            {/* First row: Prayer sessions */}
            <View style={styles.tableRow}>
              {prayerSessions.map((prayer) => (
                <View key={prayer} style={styles.tableCell}>
                  <Text style={styles.tableHeaderText}>{prayer}</Text>
                </View>
              ))}
            </View>

            {/* Second row: Prayer statuses */}
            <View style={styles.tableRow}>
            {prayerSessions.map((prayer) => {
              const status = todayLogs?.status[prayer]; // Directly access the prayer status
              return (
                <View key={prayer} style={styles.tableCell}>
                  {loading ? (
                    <Text style={styles.tableCellText}>...</Text>
                  ) : error ? (
                    <Text style={styles.tableCellText}>Not Logged In</Text>
                  ) : status !== undefined ? (
                    status === true ? (
                      <FontAwesome6 name="check" color="#A3C0BB" size={22} />
                    ) : (
                      <FontAwesome6 name="xmark" color="red" size={22} />
                    )
                  ) : (
                    <Text style={styles.tableCellText}>Not Logged</Text>
                  )}
                </View>
                );
            })}
            </View>
          </View>

          {/* Button to navigate to the detailed logger */}
          <TouchableOpacity 
            style={styles.logButton}
            onPress={handleLogPrayers} // Navigate to the logger page
          >
            <Text style={styles.logButtonText}>Log Your Prayers</Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>Your Prayer Stats for the Month</Text>

          {/* Contribution Graph */}
          <View style={styles.graphContainer}>
            <ContributionGraph
              values={monthlyLogs.map(log => ({
                date: log.date,
                count: log.prayersCompleted,
              }))}
              squareSize={30}
              style={{ left: 30 }}
              horizontal={false}
              showMonthLabels={false}
              endDate={currentMonthEnd}
              numDays={numDaysInMonth}
              width={screenWidth - 32} // Almost full width
              height={220} // Adjust height as needed
              chartConfig={{
                backgroundColor: '#4D6561', // Background matching screen color
                backgroundGradientFrom: '#4D6561',
                backgroundGradientTo: '#4D6561',
                color: (opacity = 1) => `rgba(163, 192, 187, ${opacity})`,
              }}
              tooltipDataAttrs={(value) => ({
                onPress: () => {
                  // @ts-ignore
                  setDate(value.date);
                  // @ts-ignore
                  setPrayersCompleted(value.count)
                }
              })}
            />

            <View style={styles.textContainer}>
              <Text style={styles.statsText}>{`Date: ${date}`}</Text>
              <Text style={styles.statsText}>{`Prayers Completed: ${prayersCompleted}`}</Text>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Sign In Modal */}
      <SignInModal
        isVisible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4D6561',
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
    color: '#FFF'
  },
  table: {
    overflow: 'hidden',
    gap: 10
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
  },
  tableCellText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
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
  graphContainer: {
    justifyContent: 'center',
    alignItems: 'center', // Center the graph horizontally
    marginTop: 10,
  },
  textContainer: {
    marginTop: -40,
    gap: 10,
  },
  statsText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFF'
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    left: 10,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  authModalContainer: {
    backgroundColor: '#4D6561',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '95%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default PrayersDashboard;
