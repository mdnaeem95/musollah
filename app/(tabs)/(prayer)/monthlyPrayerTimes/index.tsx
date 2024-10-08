import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { fetchMonthlyPrayerTimes } from '../../../../api/prayers';
import MonthlyPrayerTimesTable, { PrayerTime } from '../../../../components/MonthlyPrayerTimesTable';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrayerHeader from '../../../../components/PrayerHeader';

// Constants for year and month
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTHLY_PRAYER_TIMES_KEY = 'monthly_prayer_times';

const saveToStorage = async (key: string, data: any) => {
    try {
        AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save data to AsyncStorage:', error);
    }
}

// Load prayer times from AsyncStorage
const loadFromStorage = async (key: string) => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Failed to load data from AsyncStorage:', error);
        return null;
    }
};

// Function to get current month and year as a string, e.g., 'October 2024'
    const getCurrentMonthYear = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' }); // Convert month to full name, e.g., 'October'
    return `${month} ${year}`;
};

const MonthlyPrayerTimesPage = () => {
  const [monthlyPrayerTimes, setMonthlyPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMonthlyData = async () => {
        const cacheKey = `${MONTHLY_PRAYER_TIMES_KEY}_${currentYear}_${currentMonth}`;

        const cachedData = await loadFromStorage(cacheKey);

        if (cachedData) {
            console.log(`Using cached data for ${cacheKey}`);
            setMonthlyPrayerTimes(cachedData);
            return;
        }

        try {
            setLoading(true)
            const data = await fetchMonthlyPrayerTimes(currentYear, currentMonth)
            if (data) {
                setMonthlyPrayerTimes(data);
                await saveToStorage(cacheKey, data);
            }
        } catch (error) {
            console.log('Failed to fetch monthly times.');
        } finally {
            setLoading(false)
        }
    }

    fetchMonthlyData();
  }, [currentYear, currentMonth])

  return (
    <SafeAreaView style={styles.container}>
      <PrayerHeader title={getCurrentMonthYear()} backgroundColor='#4D6561' />

      <View style={styles.prayerTimesTable}>
        <MonthlyPrayerTimesTable monthlyPrayerTimes={monthlyPrayerTimes} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4D6561',
    alignContent: 'center',
    justifyContent: 'center'
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: '#007BFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: ''
  },
  prayerTimesTable: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 0,
    alignContent: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});

export default MonthlyPrayerTimesPage;
