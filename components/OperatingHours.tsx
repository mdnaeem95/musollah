import { FontAwesome6 } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

const OperatingHours = ({ hoursString }: { hoursString: string }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const parsedHours = parseOperatingHours(hoursString);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isOpen = (hours: string) => {
    if (hours.toLowerCase() === "closed") return false;

    const timeRanges = hours.split("&").map((range) => range.trim());

    return timeRanges.some((range) => {
      const [start, end] = range.split("-").map((time) => {
        const [hour, minute] = time.split(":").map(Number);
        return hour * 60 + (minute || 0);
      });

      return currentMinutes >= start && currentMinutes < end;
    });
  };

  const todayEntry = parsedHours.find((entry) => entry.day.includes(today));
  const shopIsOpen = todayEntry ? isOpen(todayEntry.hours) : false;

  return (
    <View style={styles.container}>
      {parsedHours.map((entry, index) => {
        const isToday = entry.day.includes(today);
        return (
          <View
            key={index}
            style={[
              styles.entry,
              isToday && { backgroundColor: activeTheme.colors.accent, borderRadius: activeTheme.borderRadius.medium, padding: activeTheme.spacing.small },
            ]}
          >
            <Text style={[styles.day, isToday && { color: activeTheme.colors.text.primary }]}>
              {entry.day}
            </Text>
            <Text style={[styles.hours, isToday && { color: activeTheme.colors.text.primary }]}>
              {entry.hours}
            </Text>
          </View>
        );
      })}

      {todayEntry && (
        <View style={styles.statusContainer}>
          <FontAwesome6 
            name={shopIsOpen ? 'check-circle' : 'times-circle'} 
            size={16}
            color={shopIsOpen ? activeTheme.colors.text.success : activeTheme.colors.text.error}
            style={styles.statusIcon}
          />
          <Text
            style={[
              styles.status,
              shopIsOpen ? { color: activeTheme.colors.text.success } : { color: activeTheme.colors.text.error },
            ]}
          >
            {shopIsOpen ? 'Open Now' : 'Closed Now'}
          </Text>
        </View>
      )}
    </View>
  );
};

const parseOperatingHours = (hoursString: string) => {
  const days = hoursString.split(',');

  return days.map((day) => {
    const [dayName, ...hoursParts] = day.split(':');
    return {
      day: dayName.trim(),
      hours: hoursParts.join(':').trim(),
    };
  });
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 4,
  },
  day: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
  },
  hours: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusIcon: {
    marginRight: 8,
  },
  status: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 10,
  },
});

export default OperatingHours;
