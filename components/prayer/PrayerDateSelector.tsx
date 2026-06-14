import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { format } from 'date-fns';
import { MotiView } from 'moti';
import { enter, scaleSize } from '../../utils';
import { useTheme } from '../../context/ThemeContext';

interface PrayerDateSelectorProps {
  selectedDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  hijriDate?: string;
}

/**
 * Prayer date selector component
 * Displays date with previous/next navigation
 */
export const PrayerDateSelector: React.FC<PrayerDateSelectorProps> = memo(({
  selectedDate,
  onPrevious,
  onNext,
  canGoNext,
  canGoPrev,
  hijriDate,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
      style={styles.container}
    >
      {/* Date navigation */}
      <View style={styles.dateRow}>
        <TouchableOpacity
          onPress={onPrevious}
          disabled={!canGoPrev}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Previous day"
          accessibilityRole="button"
        >
          <FontAwesome6
            name="chevron-left"
            size={16}
            color={canGoPrev ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)'}
          />
        </TouchableOpacity>

        <Text style={styles.dateText}>
          {format(selectedDate, 'd MMMM yyyy')}
        </Text>

        <TouchableOpacity
          onPress={onNext}
          disabled={!canGoNext}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Next day"
          accessibilityRole="button"
        >
          <FontAwesome6
            name="chevron-right"
            size={16}
            color={canGoNext ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)'}
          />
        </TouchableOpacity>
      </View>

      {/* Hijri date */}
      {hijriDate && (
        <Text style={styles.hijriDateText}>
          {hijriDate}
        </Text>
      )}
    </MotiView>
  );
});

PrayerDateSelector.displayName = 'PrayerDateSelector';

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 5 : 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  navButton: {
    padding: 8,
  },
  dateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(18),
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    minWidth: 180,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hijriDateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(14),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? 5 : -10,
  },
});
