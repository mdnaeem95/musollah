/**
 * Prayer Time Item Component
 * 
 * Displays a single prayer time with name, formatted time, and logging checkbox.
 * 
 * ✨ NEW Features:
 * - Current prayer highlighted with accent background
 * - Next prayer shows countdown (e.g., "in 2h 45m")
 * - Adapts to user's time format preference
 */

import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, TextStyle, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { format, parse } from 'date-fns';
import { BlurView } from 'expo-blur';
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
  isCurrent?: boolean;      // ✅ NEW
  countdown?: string;       // ✅ NEW (e.g., "2h 45m")
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
  isCurrent = false,        // ✅ NEW
  countdown,                // ✅ NEW
}) => {
  const { theme, isDarkMode } = useTheme();
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
      ? (isLogged ? '#4CAF50' : theme.colors.text.muted)
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
          size={isCurrent ? 26 : 24}  // ✅ Larger icon for current prayer
          color={iconColor}
        />
      </TouchableOpacity>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // ✅ Choose container component based on isCurrent
  const ContainerComponent = isCurrent ? BlurView : View;
  const containerProps = isCurrent
    ? {
        intensity: 25,
        tint: (isDarkMode ? 'dark' : 'light') as 'dark' | 'light', // ✅ Type assertion
      }
    : {};

  return (
    <ContainerComponent
      {...containerProps}
      style={[
        styles.container,
        isCurrent && {
          backgroundColor: theme.colors.accent + '25', // ✅ Highlighted background
          borderColor: theme.colors.accent,
          borderWidth: 1.5,
        },
        !isLoggable && styles.disabledContainer,
      ]}
    >
      {/* Prayer Name + Countdown */}
      <View style={styles.nameContainer}>
        <Text
          style={[
            styles.prayerName,
            style,
            isCurrent && {
              fontFamily: 'Outfit_700Bold', // ✅ Bolder for current
              fontSize: 19,
              color: theme.colors.accent,
            },
            !isLoggable && styles.disabledText,
          ]}
        >
          {name}
        </Text>
        
        {/* ✅ Show countdown for next prayer */}
        {countdown && (
          <Text
            style={[
              styles.countdownText,
              { color: theme.colors.text.muted },
            ]}
          >
            in {countdown}
          </Text>
        )}
      </View>

      {/* Prayer Time */}
      <Text
        style={[
          styles.prayerTime,
          style,
          isCurrent && {
            fontFamily: 'Outfit_700Bold', // ✅ Bolder for current
            fontSize: 19,
            color: theme.colors.accent,
          },
          !isLoggable && styles.disabledText,
        ]}
      >
        {formattedTime}
      </Text>

      {/* Checkbox */}
      {renderCheckbox()}
    </ContainerComponent>
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
    paddingRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: Platform.OS === 'android' ? 0 : 4 
    },
    shadowOpacity: 0.2,
    shadowRadius: Platform.OS === 'android' ? 0 : 6,
    elevation: Platform.OS === 'android' ? 0 : 4,
    overflow: 'hidden', // ✅ Required for BlurView
  },
  disabledContainer: {
    opacity: 0.6,
  },
  nameContainer: {
    // ✅ NEW: Container for name + countdown
    flexDirection: 'column',
    gap: 2,
  },
  prayerName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: '#333333',
    textAlign: 'left',
    marginRight: 12,
  },
  countdownText: {
    // ✅ NEW: Countdown text style
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    textAlign: 'left',
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