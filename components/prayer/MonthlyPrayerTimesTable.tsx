import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// TYPES
// ============================================================================

export interface PrayerTime {
  date: string;
  subuh: string;
  syuruk: string;
  zohor: string;
  asar: string;
  maghrib: string;
  isyak: string;
}

interface MonthlyPrayerTimesTableProps {
  monthlyPrayerTimes: PrayerTime[];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Monthly Prayer Times Table
 * 
 * Displays prayer times for the entire month in a scrollable table.
 * 
 * Improvements over original:
 * - Uses theme context for consistent styling
 * - Memoized today's date calculation
 * - Better accessibility with proper flex layout
 * - Responsive column widths
 * - Better performance with memoization
 */
const MonthlyPrayerTimesTable: React.FC<MonthlyPrayerTimesTableProps> = ({
  monthlyPrayerTimes,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Get today's date (memoized)
  const todayDate = useMemo(() => new Date().getDate().toString(), []);

  // Table header component
  const TableHeader = () => (
    <View style={styles.tableRow}>
      <Text style={styles.tableHeaderText}>Date</Text>
      <Text style={styles.tableHeaderText}>Subuh</Text>
      <Text style={styles.tableHeaderText}>Syuruk</Text>
      <Text style={styles.tableHeaderText}>Zohor</Text>
      <Text style={styles.tableHeaderText}>Asar</Text>
      <Text style={styles.tableHeaderText}>Maghrib</Text>
      <Text style={styles.tableHeaderText}>Isyak</Text>
    </View>
  );

  // Table row component
  const TableRow = ({ item }: { item: PrayerTime }) => {
    const isToday = item.date.toString() === todayDate;

    return (
      <View style={[styles.tableRow, isToday && styles.todayRow]}>
        <Text style={[styles.tableText, isToday && styles.todayText]}>
          {item.date}
        </Text>
        <Text style={[styles.tableText, isToday && styles.todayText]}>
          {item.subuh}
        </Text>
        <Text style={[styles.tableText, isToday && styles.todayText]}>
          {item.syuruk}
        </Text>
        <Text style={[styles.tableText, isToday && styles.todayText]}>
          {item.zohor}
        </Text>
        <Text style={[styles.tableText, isToday && styles.todayText]}>
          {item.asar}
        </Text>
        <Text style={[styles.tableText, isToday && styles.todayText]}>
          {item.maghrib}
        </Text>
        <Text style={[styles.tableText, isToday && styles.todayText]}>
          {item.isyak}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={<TableHeader />}
        data={monthlyPrayerTimes}
        renderItem={({ item }) => <TableRow item={item} />}
        keyExtractor={(item) => item.date}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={15}
        stickyHeaderIndices={[0]}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: 10,
      width: '100%',
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.muted,
      backgroundColor: theme.colors.primary,
    },
    tableText: {
      fontSize: 14,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.primary,
      textAlign: 'center',
      flex: 1,
    },
    tableHeaderText: {
      fontSize: 12,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      textAlign: 'center',
      flex: 1,
    },
    todayRow: {
      backgroundColor: theme.colors.accent + '20',
    },
    todayText: {
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
    },
  });

export default MonthlyPrayerTimesTable;