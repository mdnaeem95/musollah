import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../../../context/ThemeContext';
import { FontAwesome6 } from '@expo/vector-icons';
import { usePrayerSettings } from '../../../../hooks/settings/usePrayerSettings';

const PRAYER_SESSIONS = ['Subuh', 'Syuruk', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
const REMINDER_INTERVALS = [5, 10, 15, 20, 25, 30];

const PrayersSettings = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    timeFormat,
    reminderInterval,
    selectedAdhan,
    mutedNotifications,
    isReminderPickerVisible,
    handleTimeFormatToggle,
    handleReminderIntervalChange,
    handleToggleNotification,
    navigateToAdhanSelection,
    openReminderPicker,
    closeReminderPicker,
  } = usePrayerSettings();

  return (
    <View style={styles.mainContainer}>
      {/* General Settings */}
      <View style={styles.settingsContainer}>
        {/* 24-hour format toggle */}
        <View style={styles.settingsField}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingsName}>24 Hour Prayer Format</Text>
            <Text style={styles.settingDescription}>
              {timeFormat === '24-hour' ? '13:00' : '1:00 PM'}
            </Text>
          </View>
          <Switch
            value={timeFormat === '24-hour'}
            onValueChange={handleTimeFormatToggle}
            trackColor={{
              false: theme.colors.text.muted,
              true: theme.colors.accent,
            }}
            thumbColor={
              timeFormat === '24-hour'
                ? theme.colors.primary
                : theme.colors.secondary
            }
            ios_backgroundColor={theme.colors.text.muted}
          />
        </View>

        {/* Pre-prayer reminder */}
        <TouchableOpacity
          style={styles.settingsField}
          onPress={openReminderPicker}
          activeOpacity={0.7}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingsName}>Pre-Prayer Reminder</Text>
            <Text style={styles.settingDescription}>
              Get notified before prayer time
            </Text>
          </View>
          <View style={styles.chevronContainer}>
            <Text style={styles.settingsValue}>
              {reminderInterval === 0 ? 'None' : `${reminderInterval} mins`}
            </Text>
            <FontAwesome6
              name="chevron-right"
              color={theme.colors.text.muted}
              size={theme.fontSizes.medium}
            />
          </View>
        </TouchableOpacity>

        {/* Adhan Selection */}
        <TouchableOpacity
          style={styles.settingsField}
          onPress={navigateToAdhanSelection}
          activeOpacity={0.7}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingsName}>Adhan Audio</Text>
            <Text style={styles.settingDescription}>
              Choose prayer call sound
            </Text>
          </View>
          <View style={styles.chevronContainer}>
            <Text style={styles.settingsValue}>{selectedAdhan}</Text>
            <FontAwesome6
              name="chevron-right"
              color={theme.colors.text.muted}
              size={theme.fontSizes.medium}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Prayer Notifications */}
      <Text style={styles.sectionHeader}>Prayer Notifications</Text>
      <Text style={styles.sectionDescription}>
        Choose which prayers to receive notifications for
      </Text>
      <View style={styles.settingsContainer}>
        {PRAYER_SESSIONS.map((prayer, index) => (
          <View
            key={prayer}
            style={[
              styles.settingsField,
              index !== PRAYER_SESSIONS.length - 1 && styles.settingsFieldBorder,
            ]}
          >
            <Text style={styles.settingsName}>{prayer}</Text>
            <Switch
              value={!mutedNotifications.includes(prayer)}
              onValueChange={() => handleToggleNotification(prayer)}
              trackColor={{
                false: theme.colors.text.muted,
                true: theme.colors.accent,
              }}
              thumbColor={
                mutedNotifications.includes(prayer)
                  ? theme.colors.secondary
                  : theme.colors.primary
              }
              ios_backgroundColor={theme.colors.text.muted}
            />
          </View>
        ))}
      </View>

      {/* Reminder Interval Picker Modal */}
      <Modal
        visible={isReminderPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeReminderPicker}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={closeReminderPicker}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Select Reminder Interval</Text>
            <Picker
              selectedValue={reminderInterval}
              style={styles.picker}
              onValueChange={(value) => handleReminderIntervalChange(value as number)}
            >
              <Picker.Item label="None" value={0} />
              {REMINDER_INTERVALS.map((interval) => (
                <Picker.Item
                  key={interval}
                  label={`${interval} minutes`}
                  value={interval}
                />
              ))}
            </Picker>
            <TouchableOpacity
              onPress={closeReminderPicker}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
      marginBottom: theme.spacing.medium,
      ...theme.shadows.default,
    },
    settingsField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.small,
    },
    settingsFieldBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.text.muted,
      paddingBottom: theme.spacing.medium,
    },
    settingInfo: {
      flex: 1,
      gap: theme.spacing.xSmall,
    },
    settingsName: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
    },
    settingDescription: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.small,
      color: theme.colors.text.muted,
    },
    settingsValue: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.muted,
    },
    sectionHeader: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: theme.fontSizes.large,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xSmall,
    },
    sectionDescription: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.small,
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.small,
    },
    chevronContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small,
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
      padding: theme.spacing.large,
      alignItems: 'center',
      width: '80%',
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.medium,
    },
    picker: {
      width: '100%',
      height: 150,
    },
    closeButton: {
      marginTop: theme.spacing.medium,
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.large,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.borderRadius.small,
    },
    closeButtonText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
    },
  });

export default PrayersSettings;