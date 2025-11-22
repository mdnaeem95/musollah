import { useState } from 'react';
import { useRouter } from 'expo-router';
import { usePreferencesStore } from '../../stores/userPreferencesStore';

export function usePrayerSettings() {
  const router = useRouter();
  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState(false);

  const {
    timeFormat,
    reminderInterval,
    selectedAdhan,
    mutedNotifications,
    toggleTimeFormat,
    setReminderInterval,
    toggleNotificationForPrayer,
  } = usePreferencesStore();

  const handleTimeFormatToggle = () => {
    toggleTimeFormat();
  };

  const handleReminderIntervalChange = (value: number) => {
    setReminderInterval(value);
    setIsReminderPickerVisible(false);
  };

  const handleToggleNotification = (prayerName: string) => {
    toggleNotificationForPrayer(prayerName);
  };

  const navigateToAdhanSelection = () => {
    router.push('./prayers/adhanSelection');
  };

  const openReminderPicker = () => {
    setIsReminderPickerVisible(true);
  };

  const closeReminderPicker = () => {
    setIsReminderPickerVisible(false);
  };

  return {
    // State
    timeFormat,
    reminderInterval,
    selectedAdhan,
    mutedNotifications,
    isReminderPickerVisible,

    // Actions
    handleTimeFormatToggle,
    handleReminderIntervalChange,
    handleToggleNotification,
    navigateToAdhanSelection,
    openReminderPicker,
    closeReminderPicker,
  };
}