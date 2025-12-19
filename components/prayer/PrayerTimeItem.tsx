/**
 * Prayer Time Item Component (ENHANCED v2.0)
 * 
 * Displays a single prayer time with name, formatted time, and logging checkbox.
 * 
 * ✨ ENHANCED Features:
 * - **MUCH BETTER** dark mode visibility for current prayer
 * - Stronger background opacity (40% vs 25%)
 * - Added prominent border for current prayer
 * - Increased BlurView intensity for better glassmorphism effect
 * - Next prayer countdown display (e.g., "in 2h 45m")
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
  isCurrent?: boolean;
  countdown?: string;
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
  isCurrent = false,
  countdown,
}) => {
  const { theme, isDarkMode } = useTheme();
  const timeFormat = usePreferencesStore(state => state.timeFormat);

  // ============================================================================
  // TIME FORMATTING
  // ============================================================================

  const formattedTime = useMemo(() => {
    try {
      const parsedTime = parse(time, 'HH:mm', new Date());
      return timeFormat === '12-hour'
        ? format(parsedTime, 'hh:mm a')
        : format(parsedTime, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
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
      : 'rgba(0, 0, 0, 0.2)';

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
          size={isCurrent ? 26 : 24}
          color={iconColor}
        />
      </TouchableOpacity>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const ContainerComponent = isCurrent ? BlurView : View;
  const containerProps = isCurrent
    ? {
        intensity: 35,  // ✅ INCREASED from 25 to 35 for stronger blur
        tint: (isDarkMode ? 'dark' : 'light') as 'dark' | 'light',
      }
    : {};

  return (
    <ContainerComponent
      {...containerProps}
      style={[
        styles.container,
        isCurrent && {
          backgroundColor: theme.colors.accent + '40',  // ✅ INCREASED from 25% to 40%
          borderColor: theme.colors.accent,
          borderWidth: 2,  // ✅ INCREASED from 1.5 to 2 for stronger presence
          shadowColor: theme.colors.accent,  // ✅ Added accent shadow
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 6,  // ✅ Increased elevation
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
              fontFamily: 'Outfit_700Bold',
              fontSize: 19,
              color: theme.colors.accent,
              textShadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'transparent',  // ✅ Text shadow for dark mode
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            },
            !isLoggable && styles.disabledText,
          ]}
        >
          {name}
        </Text>
        
        {countdown && (
          <Text
            style={[
              styles.countdownText,
              { 
                color: isCurrent 
                  ? theme.colors.accent  // ✅ Use accent color for current prayer countdown
                  : theme.colors.text.muted 
              },
              isCurrent && {
                fontFamily: 'Outfit_600SemiBold',  // ✅ Bold countdown for current prayer
              },
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
            fontFamily: 'Outfit_700Bold',
            fontSize: 19,
            color: theme.colors.accent,
            textShadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'transparent',  // ✅ Text shadow for dark mode
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
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
    overflow: 'hidden',
  },
  disabledContainer: {
    opacity: 0.6,
  },
  nameContainer: {
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