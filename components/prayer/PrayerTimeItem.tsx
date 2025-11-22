/**
 * Prayer Time Item Component
 * 
 * Displays a single prayer time with name, formatted time, and logging checkbox.
 * Adapts to user's time format preference (12-hour or 24-hour).
 * 
 * Improvements:
 * - Integrated logging checkbox for better visual alignment
 * - Disabled state for non-loggable prayers (Syuruk)
 * - Cleaner layout with consistent spacing
 */

import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, TextStyle, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { format, parse } from 'date-fns';
import { usePreferencesStore } from '../../stores/userPreferencesStore';
import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const screenWidth = Dimensions.get('window').width;
const containerWidth = screenWidth * 0.8; // 80% of screen width

// ============================================================================
// TYPES
// ============================================================================

interface PrayerTimeItemProps {
  name: string;
  time: string;
  style?: TextStyle;
  isLogged?: boolean;
  onToggle?: () => void;
  isLoggable?: boolean;
  showCheckbox?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PrayerTimeItem: React.FC<PrayerTimeItemProps> = memo(({ 
  name, 
  time, 
  style,
  isLogged = false,
  onToggle,
  isLoggable = true,
  showCheckbox = false,
}) => {
  const { theme } = useTheme();
  const timeFormat = usePreferencesStore(state => state.timeFormat);

  // ============================================================================
  // TIME FORMATTING
  // ============================================================================

  /**
   * Format time string (HH:mm) to user's preferred format
   */
  const formattedTime = useMemo(() => {
    try {
      // Parse 24-hour time string (e.g., "13:15")
      const parsedTime = parse(time, 'HH:mm', new Date());
      
      // Format according to user preference
      return timeFormat === '12-hour'
        ? format(parsedTime, 'hh:mm a')  // e.g., "01:15 PM"
        : format(parsedTime, 'HH:mm');   // e.g., "13:15"
    } catch (error) {
      console.error('Error formatting time:', error);
      return time; // Fallback to original time if parsing fails
    }
  }, [time, timeFormat]);

  // ============================================================================
  // CHECKBOX RENDERING
  // ============================================================================

  const renderCheckbox = () => {
    if (!showCheckbox) return null;

    const iconName = isLogged ? 'check-circle' : 'circle';
    const iconColor = isLoggable 
      ? (isLogged ? theme.colors.text.success : theme.colors.text.muted)
      : 'rgba(0, 0, 0, 0.2)'; // Greyed out for disabled

    return (
      <TouchableOpacity
        onPress={isLoggable ? onToggle : undefined}
        disabled={!isLoggable}
        style={styles.checkButton}
        accessibilityLabel={`Mark ${name} as ${isLogged ? 'not completed' : 'completed'}`}
        accessibilityRole="checkbox"
        accessibilityState={{ 
          checked: isLogged,
          disabled: !isLoggable 
        }}
      >
        <FontAwesome6
          name={iconName}
          size={24}
          color={iconColor}
        />
      </TouchableOpacity>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={[styles.container, !isLoggable && styles.disabledContainer]}>
      <Text style={[styles.prayerName, style, !isLoggable && styles.disabledText]}>
        {name}
      </Text>
      <Text style={[styles.prayerTime, style, !isLoggable && styles.disabledText]}>
        {formattedTime}
      </Text>
      {renderCheckbox()}
    </View>
  );
});

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    width: containerWidth,
    minHeight: Platform.OS === 'android' ? 45 : 54,
    borderRadius: 15,
    borderColor: 'rgba(255, 255, 255, 1)', 
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingRight: 12, // Slightly less padding on right for checkbox
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: Platform.OS === 'android' ? 0 : 4 
    },
    shadowOpacity: 0.2,
    shadowRadius: Platform.OS === 'android' ? 0 : 6,
    elevation: Platform.OS === 'android' ? 0 : 4,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  prayerName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: '#333333',
    textAlign: 'left',
    marginRight: 12,
  },
  prayerTime: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: '#333333',
    textAlign: 'right',
    flex: 1,
    marginRight: 8,
  },
  disabledText: {
    color: '#999999',
  },
  checkButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
  },
});

PrayerTimeItem.displayName = 'PrayerTimeItem';

export default PrayerTimeItem;