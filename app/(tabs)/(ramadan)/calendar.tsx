/**
 * Ramadan Calendar Screen
 *
 * Full Hijri month view with Gregorian date mapping.
 * Shows fasting + tarawih status per day, highlights special nights.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../../context/ThemeContext';
import {
  useRamadanStore,
  useFastingLogs,
  useTarawihLogs,
} from '../../../stores/useRamadanStore';
import { useRamadanDetection } from '../../../hooks/ramadan/useRamadanDetection';
import {
  LAYLATUL_QADR_NIGHTS,
  LAST_TEN_NIGHTS_START,
} from '../../../api/services/ramadan/types/constants';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RamadanCalendar = () => {
  const { theme } = useTheme();
  const tracker = useRamadanStore((s) => s.tracker);
  const fastingLogs = useFastingLogs();
  const tarawihLogs = useTarawihLogs();
  const { data: detection } = useRamadanDetection();

  const currentDay = detection?.currentDay ?? 0;
  const totalDays = tracker?.totalDays ?? 30;
  const startDate = tracker?.ramadanStartGregorian ?? '';

  // Build calendar data with Gregorian dates and weekday offsets
  const calendarData = useMemo(() => {
    if (!startDate) return { offset: 0, days: [] };

    const start = new Date(startDate);
    const offset = start.getDay(); // 0 = Sunday

    const days = Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const gregorian = date.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
      });

      return {
        day,
        gregorian,
        weekday: (offset + i) % 7,
        isToday: day === currentDay,
        isFuture: day > currentDay,
        isLastTen: day >= LAST_TEN_NIGHTS_START,
        isSpecialNight: (LAYLATUL_QADR_NIGHTS as readonly number[]).includes(day),
        fasting: fastingLogs[day],
        tarawih: tarawihLogs[day],
      };
    });

    return { offset, days };
  }, [startDate, totalDays, currentDay, fastingLogs, tarawihLogs]);

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Month Header */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={styles.monthHeader}>
          <FontAwesome6 name="moon" size={18} color="#FFD700" solid />
          <Text style={styles.monthTitle}>
            Ramadan {tracker?.ramadanYear ?? ''}
          </Text>
        </View>
      </MotiView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <FontAwesome6 name="check" size={10} color="#10B981" />
          <Text style={styles.legendText}>Fasted</Text>
        </View>
        <View style={styles.legendItem}>
          <FontAwesome6 name="xmark" size={10} color="#EF4444" />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <FontAwesome6 name="person-praying" size={10} color="#3B82F6" />
          <Text style={styles.legendText}>Tarawih</Text>
        </View>
        <View style={styles.legendItem}>
          <FontAwesome6 name="star" size={10} color="#FFD700" solid />
          <Text style={styles.legendText}>Qadr</Text>
        </View>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {/* Empty cells for offset */}
        {Array.from({ length: calendarData.offset }, (_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}

        {/* Day cells */}
        {calendarData.days.map(
          ({
            day,
            gregorian,
            isToday,
            isFuture,
            isLastTen,
            isSpecialNight,
            fasting,
            tarawih,
          }) => (
            <MotiView
              key={day}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 200, delay: day * 15 }}
              style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
                isLastTen && styles.dayCellLastTen,
                isFuture && styles.dayCellFuture,
              ]}
            >
              {/* Day number */}
              <Text style={[styles.dayNumber, isFuture && styles.dayNumberFuture]}>
                {day}
              </Text>

              {/* Gregorian date */}
              <Text style={styles.gregorianDate}>{gregorian}</Text>

              {/* Status icons */}
              <View style={styles.statusIcons}>
                {fasting?.status === 'fasted' && (
                  <FontAwesome6 name="check" size={8} color="#10B981" />
                )}
                {fasting?.status === 'missed' && (
                  <FontAwesome6 name="xmark" size={8} color="#EF4444" />
                )}
                {fasting?.status === 'excused' && (
                  <FontAwesome6 name="minus" size={8} color="#F59E0B" />
                )}
                {tarawih?.prayed && (
                  <FontAwesome6 name="person-praying" size={8} color="#3B82F6" />
                )}
              </View>

              {/* Special night indicator */}
              {isSpecialNight && (
                <View style={styles.specialIndicator}>
                  <FontAwesome6 name="star" size={7} color="#FFD700" solid />
                </View>
              )}
            </MotiView>
          )
        )}
      </View>

      {/* Special Nights Info */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 600 }}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <FontAwesome6 name="star" size={14} color="#FFD700" solid />
            <Text style={styles.infoTitle}>Laylatul Qadr</Text>
          </View>
          <Text style={styles.infoText}>
            The Night of Power is better than a thousand months. Seek it in the
            odd nights of the last ten days of Ramadan — nights 21, 23, 25, 27,
            and 29.
          </Text>
        </View>
      </MotiView>

      {/* Last 10 Nights Info */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 700 }}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <FontAwesome6 name="fire" size={14} color="#FF6B35" />
            <Text style={styles.infoTitle}>Last 10 Nights</Text>
          </View>
          <Text style={styles.infoText}>
            The Prophet (PBUH) would exert himself in worship during the last
            ten nights more than at any other time. Increase your prayers,
            Quran recitation, and dua during these blessed nights.
          </Text>
        </View>
      </MotiView>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.primary },
    contentContainer: { padding: 16, paddingBottom: 100 },

    // Month Header
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 16,
    },
    monthTitle: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 22,
      color: theme.colors.text.primary,
    },

    // Legend
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 16,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 11,
      color: theme.colors.text.secondary,
    },

    // Weekday headers
    weekdayRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekdayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
    },
    weekdayText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 12,
      color: theme.colors.text.muted,
    },

    // Calendar Grid
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 20,
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 0.8,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2,
      borderRadius: 8,
      marginBottom: 4,
    },
    dayCellToday: {
      backgroundColor: theme.colors.primary + '20',
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    dayCellLastTen: {
      backgroundColor: '#FFD70008',
    },
    dayCellFuture: {
      opacity: 0.35,
    },
    dayNumber: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    dayNumberFuture: {
      color: theme.colors.text.muted,
    },
    gregorianDate: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 8,
      color: theme.colors.text.muted,
      marginTop: 1,
    },
    statusIcons: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 2,
    },
    specialIndicator: {
      position: 'absolute',
      top: 2,
      right: 4,
    },

    // Info Cards
    infoCard: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    infoTitle: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      color: theme.colors.text.primary,
    },
    infoText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
  });

export default RamadanCalendar;
