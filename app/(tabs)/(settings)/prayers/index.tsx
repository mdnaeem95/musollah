import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { setReminderInterval, toggleTimeFormat } from '../../../../redux/slices/userPreferencesSlice';
import PrayerHeader from '../../../../components/PrayerHeader';

const PrayersSettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { timeFormat, reminderInterval } = useSelector((state: RootState) => state.userPreferences);

  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState<boolean>(false);

  const handleTimeFormatToggle = () => {
    dispatch(toggleTimeFormat());
  };

  const handleReminderIntervalChange = (value: number) => {
    dispatch(setReminderInterval(value));
    setIsReminderPickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
        <PrayerHeader title="Prayer Settings" backgroundColor='#4D6561' />

      <View style={styles.settingsContainer}>
        {/* 24-hour format toggle */}
        <View style={styles.settingsField}>
          <View style={styles.settingsLeftField}>
            <Text style={styles.settingsName}>24 Hour Prayer Format</Text>
          </View>
          <Switch
            value={timeFormat === '24-hour'}
            onValueChange={handleTimeFormatToggle}
          />
        </View>

        {/* Pre-prayer reminder */}
        <TouchableOpacity style={styles.settingsField} onPress={() => setIsReminderPickerVisible(true)}>
          <View style={styles.settingsLeftField}>
            <Text style={styles.settingsName}>Pre-Prayer Reminder Interval</Text>
          </View>
          <Text style={styles.settingsName}>
            {reminderInterval === 0 ? 'None' : `${reminderInterval} mins`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reminder Interval Picker Modal */}
      <Modal
        visible={isReminderPickerVisible}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setIsReminderPickerVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Reminder Interval</Text>
            <Picker
              selectedValue={reminderInterval}
              style={styles.picker}
              onValueChange={(itemValue) => handleReminderIntervalChange(itemValue as number)}
            >
              <Picker.Item label='None' value={0} />
              {[5, 10, 15, 20, 25, 30].map((interval) => (
                <Picker.Item key={interval} label={`${interval} minutes`} value={interval} />
              ))}
            </Picker>
            <TouchableOpacity onPress={() => setIsReminderPickerVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#4D6561',
    padding: 16,
  },
  settingsContainer: {
    backgroundColor: '#314441',
    borderRadius: 15,
    padding: 16,
    gap: 15,
  },
  settingsField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingsLeftField: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsName: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  picker: {
    marginBottom: 30,
    width: 200,
    height: 150,
  },
  closeButton: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#314340',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PrayersSettings;
