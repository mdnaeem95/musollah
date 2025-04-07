import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { MotiView } from 'moti';

interface Props {
  hoursString: string;
}

const OperatingHours: React.FC<Props> = ({ hoursString }) => {
  const { theme } = useTheme();
  const parsedHours = parseOperatingHours(hoursString);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayEntry = parsedHours.find((entry) => entry.day.includes(today));
  const shopIsOpen = todayEntry ? isOpen(todayEntry.hours, currentMinutes) : false;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      style={styles.container}
    >
      {parsedHours.map((entry, index) => {
        const isToday = entry.day.includes(today);
        return (
          <View
            key={index}
            style={[
              styles.entry,
              isToday && {
                backgroundColor: theme.colors.accent,
                borderRadius: theme.borderRadius.medium,
                padding: theme.spacing.small,
              },
            ]}
          >
            <Text style={[styles.day, isToday && { color: theme.colors.text.primary }]}>
              {entry.day}
            </Text>
            <Text style={[styles.hours, isToday && { color: theme.colors.text.primary }]}>
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
            color={shopIsOpen ? theme.colors.text.success : theme.colors.text.error}
            style={styles.statusIcon}
          />
          <Text
            style={[
              styles.status,
              shopIsOpen ? { color: theme.colors.text.success } : { color: theme.colors.text.error },
            ]}
          >
            {shopIsOpen ? 'Open Now' : 'Closed Now'}
          </Text>
        </View>
      )}
    </MotiView>
  );
};

// --- Utilities ---

const parseOperatingHours = (hoursString: string) => {
  if (!hoursString) return [];

  return hoursString.split(',').map((entry) => {
    const [dayName, ...rest] = entry.split(':');
    return {
      day: dayName.trim(),
      hours: rest.join(':').trim(),
    };
  });
};

const isOpen = (hours: string, currentMinutes: number): boolean => {
  if (!hours || hours.toLowerCase() === 'closed') return false;

  return hours.split('&').some((range) => {
    const [start, end] = range.trim().split('-');
    if (!start || !end) return false;

    const [startHour, startMin = '0'] = start.split(':');
    const [endHour, endMin = '0'] = end.split(':');

    const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
    const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  });
};

// --- Styles ---

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
    fontFamily: 'Outfit_600SemiBold',
  },
  hours: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  statusIcon: {
    marginRight: 8,
  },
  status: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
  },
});

export default OperatingHours;