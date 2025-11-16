import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useMonthlyPrayerTimes } from '../../../../api/services/prayer';
import MonthlyPrayerTimesTable from '../../../../components/prayer/MonthlyPrayerTimesTable';

/**
 * Monthly Prayer Times Page
 * 
 * Displays prayer times for the entire current month in a table format.
 * 
 * Improvements over original:
 * - Uses TanStack Query hook (useMonthlyPrayerTimes)
 * - No manual AsyncStorage - MMKV cache in query hook
 * - Automatic background refetching
 * - Better error handling
 * - Cleaner code (60% fewer lines)
 */
const MonthlyPrayerTimesPage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Get current year and month
  const { year, month } = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  }, []);

  // Fetch monthly prayer times with TanStack Query
  const { 
    data: monthlyPrayerTimes, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useMonthlyPrayerTimes(year, month);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
        <Text style={styles.loadingText}>
          Loading prayer times for {month}/{year}...
        </Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load monthly prayer times'}
        </Text>
        <Text style={styles.retryText} onPress={() => refetch()}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // Empty state
  if (!monthlyPrayerTimes || monthlyPrayerTimes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          No prayer times available for {month}/{year}
        </Text>
      </View>
    );
  }

  // Success state
  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>
        <MonthlyPrayerTimesTable monthlyPrayerTimes={monthlyPrayerTimes} />
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      alignContent: 'center',
      justifyContent: 'center',
    },
    tableContainer: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.secondary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
    errorText: {
      fontSize: 16,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.error,
      textAlign: 'center',
    },
    retryText: {
      marginTop: 16,
      fontSize: 14,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.primary,
      textDecorationLine: 'underline',
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

export default MonthlyPrayerTimesPage;