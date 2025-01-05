import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchMonthlyPrayerTimes } from '../../../../api/prayers';
import MonthlyPrayerTimesTable, { PrayerTime } from '../../../../components/prayer/MonthlyPrayerTimesTable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../../context/ThemeContext';

// Constants for year and month
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTHLY_PRAYER_TIMES_KEY = 'monthly_prayer_times';

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
      const cacheKey = `${MONTHLY_PRAYER_TIMES_KEY}_${currentYear}_${currentMonth}`;

      const cachedData = await loadFromStorage(cacheKey);

      if (cachedData) {
        console.log(`Using cached data for ${cacheKey}`);
        setMonthlyPrayerTimes(cachedData);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchMonthlyPrayerTimes(currentYear, currentMonth);
        if (data) {
          setMonthlyPrayerTimes(data);
          await saveToStorage(cacheKey, data);
        }
      } catch (error) {
        console.log('Failed to fetch monthly times.');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [currentYear, currentMonth]);

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
