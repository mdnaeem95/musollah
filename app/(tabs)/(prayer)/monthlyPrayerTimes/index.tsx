import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchMonthlyPrayerTimesFromFirebase } from '../../../../api/prayers';
import MonthlyPrayerTimesTable, { PrayerTime } from '../../../../components/prayer/MonthlyPrayerTimesTable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../../context/ThemeContext';

// Constants for year and month
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTHLY_PRAYER_TIMES_KEY = `monthly_prayer_times_${currentYear}_${currentMonth}`;

const saveToStorage = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to AsyncStorage:', error);
  }
};

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

const MonthlyPrayerTimesPage = () => {
  const { theme } = useTheme()

  const [monthlyPrayerTimes, setMonthlyPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        console.log(`📅 Fetching monthly prayer times for ${currentMonth}/${currentYear}`);

        // Step 1: Check cache
        // const cachedData = await loadFromStorage(MONTHLY_PRAYER_TIMES_KEY);
        // if (cachedData) {
        //   console.log(`✅ Using cached data for ${currentMonth}/${currentYear}`);
        //   setMonthlyPrayerTimes(cachedData);
        //   setLoading(false);
        //   return;
        // }

        // Step 2: Fetch from Firebase
        const firebaseData = await fetchMonthlyPrayerTimesFromFirebase(currentYear, currentMonth);
        if (firebaseData.length > 0) {
          console.log(`🔥 Fetched ${firebaseData.length} records from Firebase`);
          //@ts-ignore
          setMonthlyPrayerTimes(firebaseData);
          await saveToStorage(MONTHLY_PRAYER_TIMES_KEY, firebaseData);
        } else {
          console.warn(`⚠️ No prayer times found for ${currentMonth}/${currentYear}`);
        }
      } catch (error) {
        console.error('❌ Failed to fetch monthly prayer times:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.text.muted}
          style={{ justifyContent: 'center', alignItems: 'center' }}
        />
      ) : (
        <View style={[styles.prayerTimesTable, { backgroundColor: theme.colors.secondary }]}>
          <MonthlyPrayerTimesTable monthlyPrayerTimes={monthlyPrayerTimes} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
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
