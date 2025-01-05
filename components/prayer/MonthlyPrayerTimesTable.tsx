import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

// Props type for the monthly prayer times
export type PrayerTime = {
  date: string;
  Subuh: string;
  Syuruk: string;
  Zohor: string;
  Asar: string;
  Maghrib: string;
  Isyak: string;
};

type MonthlyPrayerTimesTableProps = {
  monthlyPrayerTimes: PrayerTime[]; // The array of prayer times for the month
};

const MonthlyPrayerTimesTable: React.FC<MonthlyPrayerTimesTableProps> = ({
  monthlyPrayerTimes,
}) => {
    const todayDate = new Date().getDate().toString().padStart(2, '0');
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
    const isToday = item.date === todayDate;

    return (
    <View style={[styles.tableRow, isToday && styles.todayRow]}>
      <Text style={styles.tableText}>{item.date}</Text>
      <Text style={styles.tableText}>{item.Subuh}</Text>
      <Text style={styles.tableText}>{item.Syuruk}</Text>
      <Text style={styles.tableText}>{item.Zohor}</Text>
      <Text style={styles.tableText}>{item.Asar}</Text>
      <Text style={styles.tableText}>{item.Maghrib}</Text>
      <Text style={styles.tableText}>{item.Isyak}</Text>
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
