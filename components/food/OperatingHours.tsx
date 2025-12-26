/**
 * Operating Hours Component (MODERN REDESIGN)
 * 
 * Beautiful operating hours display with:
 * - Glassmorphism design
 * - Prominent open/closed status
 * - Today's hours highlighted
 * - Smooth animations
 * - Visual day indicators
 * 
 * @version 2.0 - Complete redesign
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { enter } from '../../utils';

interface Props {
  hoursString: string;
}

interface ParsedHour {
  day: string;
  hours: string;
}

const OperatingHours: React.FC<Props> = ({ hoursString }) => {
  const { theme, isDarkMode } = useTheme();
  const parsedHours = parseOperatingHours(hoursString);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayEntry = parsedHours.find((entry) => entry.day.includes(today));
  const shopIsOpen = todayEntry ? isOpen(todayEntry.hours, currentMinutes) : false;

  return (
    <View style={styles.container}>
      {/* Open/Closed Status Badge (Prominent) */}
      {todayEntry && (
        <MotiView
          from={{ opacity: 0, scale: 0.95, translateY: -10 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[
              styles.statusBadge,
              {
                backgroundColor: shopIsOpen 
                  ? theme.colors.accent + '15'
                  : theme.colors.secondary,
              },
            ]}
          >
            <View style={[
              styles.statusDot,
              { backgroundColor: shopIsOpen ? '#4CAF50' : theme.colors.text.muted }
            ]} />
            <Text
              style={[
                styles.statusText,
                {
                  color: shopIsOpen ? '#4CAF50' : theme.colors.text.muted,
                  fontFamily: 'Outfit_700Bold',
                },
              ]}
            >
              {shopIsOpen ? 'Open Now' : 'Closed Now'}
            </Text>
            {shopIsOpen && (
              <FontAwesome6 name="circle-check" size={18} color="#4CAF50" />
            )}
          </BlurView>
        </MotiView>
      )}

      {/* Hours List */}
      <View style={styles.hoursList}>
        {parsedHours.map((entry, index) => {
          const isToday = entry.day.includes(today);
          const isClosed = entry.hours.toLowerCase() === 'closed';

          return (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={enter(0)}
            >
              <BlurView
                intensity={isToday ? 30 : 15}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                  styles.hourRow,
                  {
                    backgroundColor: isToday
                      ? theme.colors.accent + '20'
                      : theme.colors.secondary + '40',
                    borderLeftWidth: isToday ? 3 : 0,
                    borderLeftColor: theme.colors.accent,
                  },
                ]}
              >
                {/* Day Indicator */}
                <View style={styles.daySection}>
                  {isToday && (
                    <View style={[styles.todayDot, { backgroundColor: theme.colors.accent }]} />
                  )}
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isToday
                          ? theme.colors.accent
                          : theme.colors.text.primary,
                        fontFamily: isToday ? 'Outfit_700Bold' : 'Outfit_600SemiBold',
                      },
                    ]}
                  >
                    {entry.day}
                  </Text>
                </View>

                {/* Hours */}
                <View style={styles.hoursSection}>
                  {isClosed ? (
                    <View style={styles.closedBadge}>
                      <FontAwesome6
                        name="moon"
                        size={12}
                        color={theme.colors.text.muted}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.closedText, { color: theme.colors.text.muted }]}>
                        Closed
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.hoursText,
                        {
                          color: isToday
                            ? theme.colors.text.primary
                            : theme.colors.text.secondary,
                          fontFamily: isToday ? 'Outfit_600SemiBold' : 'Outfit_400Regular',
                        },
                      ]}
                    >
                      {entry.hours}
                    </Text>
                  )}
                </View>

                {/* Today Indicator Icon */}
                {isToday && (
                  <FontAwesome6
                    name="location-dot"
                    size={14}
                    color={theme.colors.accent}
                  />
                )}
              </BlurView>
            </MotiView>
          );
        })}
      </View>

      {/* Bottom Info Text */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 600 }}
        style={styles.infoContainer}
      >
        <FontAwesome6
          name="circle-info"
          size={12}
          color={theme.colors.text.muted}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.infoText, { color: theme.colors.text.muted }]}>
          Hours may vary on public holidays
        </Text>
      </MotiView>
    </View>
  );
};

// ============================================================================
// UTILITIES
// ============================================================================

const parseOperatingHours = (hoursString: string): ParsedHour[] => {
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

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Status Badge (Top)
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Hours List
  hoursList: {
    gap: 10,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Day Section
  daySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Hours Section
  hoursSection: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  hoursText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  closedText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },

  // Info Section
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    fontStyle: 'italic',
  },
});

export default OperatingHours;