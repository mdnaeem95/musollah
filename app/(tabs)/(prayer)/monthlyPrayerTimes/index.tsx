import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useMonthlyPrayerTimes } from '../../../../api/services/prayer';
import MonthlyPrayerTimesTable from '../../../../components/prayer/MonthlyPrayerTimesTable';

const MonthlyPrayerTimesPage: React.FC = () => {
  const { theme, isDarkMode } = useTheme();

  const { year, month } = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  const { data: monthlyPrayerTimes, isLoading, isError, error, refetch } = useMonthlyPrayerTimes(year, month);

  const gradientColors = isDarkMode
    ? (['#060B18', '#0C1428', '#080F1E'] as const)
    : (['#EEF2FF', '#F0F4FF', '#E8EFFF'] as const);

  const textPrimary = isDarkMode ? 'rgba(255,255,255,0.88)' : theme.colors.text.primary;
  const textSecondary = isDarkMode ? 'rgba(255,255,255,0.50)' : theme.colors.text.secondary;

  if (isLoading) {
    return (
      <LinearGradient colors={gradientColors} style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Loading prayer times for {month}/{year}...
        </Text>
      </LinearGradient>
    );
  }

  if (isError) {
    return (
      <LinearGradient colors={gradientColors} style={styles.centered}>
        <View style={[styles.stateIcon, { backgroundColor: '#ff6b6b20' }]}>
          <FontAwesome6 name="triangle-exclamation" size={40} color="#ff6b6b" />
        </View>
        <Text style={[styles.errorText, { color: '#ff6b6b' }]}>
          {error instanceof Error ? error.message : 'Failed to load monthly prayer times'}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
        >
          <FontAwesome6 name="rotate-right" size={14} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (!monthlyPrayerTimes || monthlyPrayerTimes.length === 0) {
    return (
      <LinearGradient colors={gradientColors} style={styles.centered}>
        <Text style={[styles.emptyText, { color: textSecondary }]}>
          No prayer times available for {month}/{year}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <MonthlyPrayerTimesTable monthlyPrayerTimes={monthlyPrayerTimes} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  stateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
});

export default MonthlyPrayerTimesPage;
