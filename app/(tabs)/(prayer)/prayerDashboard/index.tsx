import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import BackArrow from '../../../../components/BackArrow';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchMonthlyPrayerLogs, fetchPrayerLog } from '../../../../redux/slices/userSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { ContributionGraph } from 'react-native-chart-kit';

// Screen Dimensions
const screenWidth = Dimensions.get('window').width;

const PrayersDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, loading, error } = useSelector((state: RootState) => state.user);
  const [todayLogs, setTodayLogs] = useState<any>(null);
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);
  const [date, setDate] = useState<string>('');
  const [prayersCompleted, setPrayersCompleted] = useState<number>(0);

  // Placeholder for prayer session names
  const prayerSessions = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  // Fetch today's prayer logs when the screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const result = await dispatch(fetchPrayerLog()).unwrap();
        setTodayLogs(result.prayerLog);
      };
      fetchData();
    }, [dispatch])
  );

  // Fetch monthly prayer logs for the contribution graph
  useEffect(() => {
    const fetchMonthlyData = async () => {
      const result = await dispatch(fetchMonthlyPrayerLogs()).unwrap();
      setMonthlyLogs(result);
    };
    fetchMonthlyData();
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <BackArrow />
        <Text style={styles.title}>Prayer Dashboard</Text>
        <View />
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.container}>
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
              const status = todayLogs?.status?.[prayer]; // Safely access the prayer status
              return (
                <View key={prayer} style={styles.tableCell}>
                  <Text style={styles.tableCellText}>
                    {loading
                      ? '...'
                      : error
                      ? 'Error'
                      : status !== undefined
                      ? status === true
                        ? <FontAwesome6 name="check" color="green" size={22} />
                        : <FontAwesome6 name="xmark" color="red" size={22} />
                      : 'Not Logged'}
                  </Text>
                </View>
              );
            })}
            </View>
          </View>

          {/* Button to navigate to the detailed logger */}
          <TouchableOpacity 
            style={styles.logButton}
            onPress={() => router.push('/prayerDashboard/logger')} // Navigate to the logger page
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
              endDate={new Date()}
              numDays={30}
              width={screenWidth - 32} // Almost full width
              height={220} // Adjust height as needed
              chartConfig={{
                backgroundColor: '#A3C0BB', // Background matching screen color
                backgroundGradientFrom: '#A3C0BB',
                backgroundGradientTo: '#A3C0BB',
                color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#A3C0BB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#A3C0BB',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
  },
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
  },
  table: {
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#333',
  },
  tableCellText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#555',
  },
  logButton: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#314340',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Outfit_600SemiBold',
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
    fontSize: 16
  }
});

export default PrayersDashboard;
