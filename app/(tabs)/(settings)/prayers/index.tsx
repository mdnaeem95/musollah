import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { setReminderInterval, toggleTimeFormat } from '../../../../redux/slices/userPreferencesSlice';

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
    <View style={styles.mainContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#2E3D3A',
    padding: 16,
  },
  settingsContainer: {
    backgroundColor: '#3D4F4C',
    borderRadius: 15,
    padding: 16,
    gap: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#ECDFCC',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#3A504C',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
  },
  picker: {
    marginBottom: 30,
    width: 200,
    height: 150,
  },
  closeButton: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#A3C0BB',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#2E3D3A',
    fontSize: 16,
  },
});

export default PrayersSettings;
