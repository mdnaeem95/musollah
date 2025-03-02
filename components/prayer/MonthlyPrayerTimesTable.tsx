import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { PrayerTimes2025 } from '../../utils/types';

// Props type for the monthly prayer times
export type PrayerTime = {
  date: string;
  subuh: string;
  syuruk: string;
  zohor: string;
  asar: string;
  maghrib: string;
  isyak: string;
};

type MonthlyPrayerTimesTableProps = {
  monthlyPrayerTimes: PrayerTime[]; // The array of prayer times for the month
};

const MonthlyPrayerTimesTable: React.FC<MonthlyPrayerTimesTableProps> = ({
  monthlyPrayerTimes,
}) => {
    const today = new Date();
    const todayDate = today.getDate().toString(); 

  // Define the table header
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

  // Define the table row component
  const TableRow = ({ item }: { item: PrayerTime }) => {
    const isToday = item.date.toString() === todayDate;

    return (
    <View style={[styles.tableRow, isToday && styles.todayRow]}>
      <Text style={styles.tableText}>{item.date}</Text>
      <Text style={styles.tableText}>{item.subuh}</Text>
      <Text style={styles.tableText}>{item.syuruk}</Text>
      <Text style={styles.tableText}>{item.zohor}</Text>
      <Text style={styles.tableText}>{item.asar}</Text>
      <Text style={styles.tableText}>{item.maghrib}</Text>
      <Text style={styles.tableText}>{item.isyak}</Text>
    </View>
    )
  };

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={<TableHeader />}
        data={monthlyPrayerTimes}
        renderItem={({ item }) => <TableRow item={item} />}
        keyExtractor={(item) => item.date}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 10,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    flex: 1,
  },
  tableHeaderText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
    flex: 1,
  },
  todayRow: {
    backgroundColor: '#CDEFFA'
  }
});

export default MonthlyPrayerTimesTable;
