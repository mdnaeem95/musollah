import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Switch, Alert } from 'react-native';
import { format, subDays, isAfter } from 'date-fns';
import BackArrow from '../../../../../components/BackArrow';
import { getAuth } from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { savePrayerLog } from '../../../../../redux/slices/userSlice';
import { AppDispatch } from '../../../../../redux/store/store';

const PrayerLogger = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [prayerStatus, setPrayerStatus] = useState({
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  });

  const dispatch = useDispatch<AppDispatch>();

  // Generate the past 14 days for scrolling
  const days = Array.from({ length: 14 }, (_, i) => subDays(today, i)).reverse();

  const handleDateSelect = (date: Date) => {
    if (!isAfter(date, today)) {
      setSelectedDate(date);
      // Optionally, fetch and set prayerStatus for the selected date if saved before.
    }
  };

  const renderDateItem = ({ item: date }: { item: Date }) => {
    const formattedDate = format(date, 'dd MMM');
    const isDisabled = isAfter(date, today);
    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.selectedDate, isDisabled && styles.disabledDate]}
        onPress={() => handleDateSelect(date)}
        disabled={isDisabled}
      >
        <Text style={[styles.dateText, isDisabled && styles.disabledText]}>{formattedDate}</Text>
      </TouchableOpacity>
    );
  };

  const handleToggle = (prayer: keyof typeof prayerStatus) => {
    setPrayerStatus((prevState) => ({
      ...prevState,
      [prayer]: !prevState[prayer],
    }));
  };

  const handleLogPrayers = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const prayerLog = {
        status: prayerStatus,
      };

      const date = format(selectedDate, 'yyyy-MM-dd');

      await dispatch(savePrayerLog({ userId: user.uid, date, prayerLog }));
      Alert.alert('Success', 'Prayer log saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to log prayers');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <BackArrow />
        <Text style={styles.title}>Log Your Prayers</Text>
        <View />
      </View>

      {/* Horizontal Scrolling Calendar */}
      <View style={styles.calendarContainer}>
        <FlatList
          data={days}
          horizontal
          initialScrollIndex={days.length - 1}
          getItemLayout={(data, index) => ({ length: 80, offset: 90 * index, index })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => format(item, 'yyyy-MM-dd')}
          renderItem={renderDateItem}
          contentContainerStyle={styles.dateList}
        />
      </View>

      {/* Prayer Log Section */}
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Prayer Sessions for {format(selectedDate, 'dd MMM yyyy')}</Text>

        {Object.keys(prayerStatus).map((prayer) => (
          <View key={prayer} style={styles.prayerRow}>
            <Text style={styles.prayerName}>{prayer}</Text>
            <Switch
              value={prayerStatus[prayer as keyof typeof prayerStatus]}
              onValueChange={() => handleToggle(prayer as keyof typeof prayerStatus)}
            />
          </View>
        ))}

        {/* Log Prayers Button */}
        <TouchableOpacity style={styles.logButton} onPress={handleLogPrayers}>
          <Text style={styles.logButtonText}>Log Prayers</Text>
        </TouchableOpacity>
      </View>
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
  calendarContainer: {
    paddingVertical: 16,
    backgroundColor: '#A3C0BB',
  },
  dateList: {
    paddingHorizontal: 16,
  },
  dateItem: {
    padding: 10,
    marginHorizontal: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  selectedDate: {
    backgroundColor: '#728A87',
  },
  disabledDate: {
    backgroundColor: '#BDBDBD',
  },
  dateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#000',
  },
  disabledText: {
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  prayerName: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  logButton: {
    backgroundColor: '#728A87',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default PrayerLogger;
