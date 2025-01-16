import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { setReminderInterval, toggleNotificationForPrayer, toggleTimeFormat } from '../../../../redux/slices/userPreferencesSlice';
import { useTheme } from '../../../../context/ThemeContext';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRAYER_SESSIONS = ['Subuh', 'Syuruk', 'Zohor', 'Asar', 'Maghrib', 'Isyak']

const PrayersSettings = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { timeFormat, reminderInterval, selectedAdhan, mutedNotifications } = useSelector((state: RootState) => state.userPreferences);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState<boolean>(false);

  const handleTimeFormatToggle = () => {
    dispatch(toggleTimeFormat());
  };

  const handleReminderIntervalChange = (value: number) => {
    dispatch(setReminderInterval(value));
    setIsReminderPickerVisible(false);
  };

  const handleToggleNotification = (prayerName: string) => {
    dispatch(toggleNotificationForPrayer(prayerName))
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.settingsContainer}>
        {/* 24-hour format toggle */}
        <View style={styles.settingsField}>
          <Text style={styles.settingsName}>24 Hour Prayer Format</Text>
          <Switch
            value={timeFormat === '24-hour'}
            onValueChange={handleTimeFormatToggle}
            trackColor={{ false: theme.colors.text.muted, true: theme.colors.accent }}
            thumbColor={
              timeFormat === '24-hour'
                ? theme.colors.primary
                : theme.colors.secondary
            }
          />
        </View>

        {/* Pre-prayer reminder */}
        <TouchableOpacity
          style={styles.settingsField}
          onPress={() => setIsReminderPickerVisible(true)}
        >
          <Text style={styles.settingsName}>Pre-Prayer Reminder Interval</Text>
          <Text style={styles.settingsValue}>
            {reminderInterval === 0 ? 'None' : `${reminderInterval} mins`}
          </Text>
        </TouchableOpacity>

        {/* Adhan Selection */}
        <TouchableOpacity style={styles.settingsField} onPress={() => router.push('./prayers/adhanSelection')}>
          <Text style={styles.settingsName}>Adhan Audio</Text>
          <View style={styles.chevronContainer}>
            <Text style={styles.settingsValue}>{selectedAdhan}</Text>
            <FontAwesome6 name="chevron-right" color={theme.colors.text.muted} size={theme.fontSizes.large} />
          </View>
        </TouchableOpacity>
      </View>

        {/* Mute notifications */}
        <Text style={styles.settingsHeader}>Prayer Notifications</Text>
        <View style={styles.settingsContainer}>
          {PRAYER_SESSIONS.map((prayer) => (
            <View style={styles.settingsField} key={prayer}>
              <Text style={styles.settingsName}>{prayer}</Text>
              <Switch 
                value={!mutedNotifications.includes(prayer)}
                onValueChange={() => handleToggleNotification(prayer)}
                trackColor={{ false: theme.colors.text.muted, true: theme.colors.accent }}
                thumbColor={
                  mutedNotifications.includes(prayer)
                    ? theme.colors.primary
                    : theme.colors.secondary
                }
              />
            </View>
          ))}
        </View>

      {/* Reminder Interval Picker Modal */}
      <Modal
        visible={isReminderPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsReminderPickerVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Reminder Interval</Text>
            <Picker
              selectedValue={reminderInterval}
              style={styles.picker}
              onValueChange={(value) => handleReminderIntervalChange(value as number)}
            >
              <Picker.Item label="None" value={0} />
              {[5, 10, 15, 20, 25, 30].map((interval) => (
                <Picker.Item key={interval} label={`${interval} minutes`} value={interval} />
              ))}
            </Picker>
            <TouchableOpacity
              onPress={() => setIsReminderPickerVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    settingsContainer: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.medium,
      gap: theme.spacing.medium,
      ...theme.shadows.default,
    },
    settingsField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.small,
    },
    settingsName: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
    },
    settingsValue: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.muted,
    },
    settingsHeader: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.large,
      color: theme.colors.text.primary,
      marginTop: 16,
      marginBottom: 10
    },
    chevronContainer: {
      flexDirection: 'row',
      alignContent: 'center',
      gap: 10
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.medium,
    },
    picker: {
      width: 200,
      height: 150,
      marginBottom: theme.spacing.medium,
    },
    closeButton: {
      marginTop: theme.spacing.medium,
      padding: theme.spacing.small,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.borderRadius.small,
    },
    closeButtonText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
    },
  });

export default PrayersSettings;
