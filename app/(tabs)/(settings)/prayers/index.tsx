/**
 * Prayer Settings - Modern Design (FIXED SCROLLING)
 * 
 * Configure prayer times, notifications, and adhan
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { usePrayerSettings } from '../../../../hooks/settings/usePrayerSettings';
import { calculateContrastColor, enter } from '../../../../utils';

const PRAYER_SESSIONS = ['Subuh', 'Syuruk', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
const REMINDER_INTERVALS = [5, 10, 15, 20, 25, 30];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PrayersSettings = () => {
  const { theme, isDarkMode } = useTheme();

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

  const handleSwitchToggle = (handler: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handler();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General Settings */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <SectionHeader icon="gear" label="General" theme={theme} />

          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.settingsCard, { backgroundColor: theme.colors.secondary }]}
          >
            {/* 24-hour format */}
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6 name="clock" size={18} color={theme.colors.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  24 Hour Format
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                  {timeFormat === '24-hour' ? '13:00' : '1:00 PM'}
                </Text>
              </View>
              <Switch
                value={timeFormat === '24-hour'}
                onValueChange={() => handleSwitchToggle(handleTimeFormatToggle)}
                trackColor={{
                  false: theme.colors.muted,
                  true: theme.colors.accent + '80',
                }}
                thumbColor={theme.colors.primary}
                ios_backgroundColor={theme.colors.muted}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.muted }]} />

            {/* Pre-prayer reminder */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                openReminderPicker();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6 name="bell" size={18} color={theme.colors.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  Pre-Prayer Reminder
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                  Get notified before prayer time
                </Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={[styles.settingValue, { color: theme.colors.accent }]}>
                  {reminderInterval === 0 ? 'None' : `${reminderInterval} mins`}
                </Text>
                <FontAwesome6
                  name="chevron-right"
                  size={16}
                  color={theme.colors.text.muted}
                />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.muted }]} />

            {/* Adhan Selection */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigateToAdhanSelection();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6 name="volume-high" size={18} color={theme.colors.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  Adhan Audio
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                  Choose prayer call sound
                </Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={[styles.settingValue, { color: theme.colors.accent }]}>
                  {selectedAdhan}
                </Text>
                <FontAwesome6
                  name="chevron-right"
                  size={16}
                  color={theme.colors.text.muted}
                />
              </View>
            </TouchableOpacity>
          </BlurView>
        </MotiView>

        {/* Prayer Notifications */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <SectionHeader icon="bell" label="Prayer Notifications" theme={theme} />
          <Text style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
            Choose which prayers to receive notifications for
          </Text>

          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.settingsCard, { backgroundColor: theme.colors.secondary }]}
          >
            {PRAYER_SESSIONS.map((prayer, index) => (
              <React.Fragment key={prayer}>
                <MotiView
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={enter(0)}
                >
                  <View style={styles.prayerRow}>
                    <View style={[styles.prayerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                      <FontAwesome6
                        name="mosque"
                        size={16}
                        color={theme.colors.accent}
                      />
                    </View>
                    <Text style={[styles.prayerLabel, { color: theme.colors.text.primary }]}>
                      {prayer}
                    </Text>
                    <Switch
                      value={!mutedNotifications.includes(prayer)}
                      onValueChange={() => handleSwitchToggle(() => handleToggleNotification(prayer))}
                      trackColor={{
                        false: theme.colors.muted,
                        true: theme.colors.accent + '80',
                      }}
                      thumbColor={theme.colors.primary}
                      ios_backgroundColor={theme.colors.muted}
                    />
                  </View>
                </MotiView>
                {index < PRAYER_SESSIONS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.colors.muted }]} />
                )}
              </React.Fragment>
            ))}
          </BlurView>
        </MotiView>
      </ScrollView>

      {/* Reminder Interval Picker Modal */}
      <Modal
        visible={isReminderPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          closeReminderPicker();
        }}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeReminderPicker();
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <BlurView
              intensity={30}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.modalContainer, { backgroundColor: theme.colors.secondary }]}
            >
              {/* Icon */}
              <View style={[styles.modalIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6 name="bell" size={32} color={theme.colors.accent} />
              </View>

              {/* Title */}
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                Select Reminder Interval
              </Text>

              {/* Picker */}
              <Picker
                selectedValue={reminderInterval}
                style={[styles.picker, { color: theme.colors.text.primary }]}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleReminderIntervalChange(value as number);
                }}
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

              {/* Done Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  closeReminderPicker();
                }}
                style={[styles.doneButton, { backgroundColor: theme.colors.accent }]}
                activeOpacity={0.8}
              >
                <FontAwesome6
                  name="check"
                  size={16}
                  color={calculateContrastColor(theme.colors.accent)}
                />
                <Text style={[styles.doneButtonText, { color: calculateContrastColor(theme.colors.accent) }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

const SectionHeader = ({
  icon,
  label,
  theme,
}: {
  icon: string;
  label: string;
  theme: any;
}) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
      <FontAwesome6 name={icon} size={14} color={theme.colors.accent} />
    </View>
    <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
      {label}
    </Text>
  </View>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Extra space at bottom
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 12,
    lineHeight: 20,
  },

  // Settings Card
  settingsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Prayer Row
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  prayerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: 12,
    marginLeft: 58, // Align with text after icon
  },

  // Modal
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: 320,
    maxWidth: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  picker: {
    width: '100%',
    height: 150,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default PrayersSettings;