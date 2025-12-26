/**
 * Prayer Time Item Component (HIGH CONTRAST v4.0)
 *
 * ✅ FIX: Current prayer always uses contrast-safe text (no more green-on-green)
 * ✅ FIX: Checkbox also adapts for contrast on current prayer
 * ✅ IMPROVED: Stronger regular card opacity in dark mode for readability
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
const containerWidth = screenWidth * 0.8;

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
// COLOR HELPERS
// ============================================================================

function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '').trim();
  const full =
    cleaned.length === 3
      ? cleaned.split('').map((c) => c + c).join('')
      : cleaned;

  if (full.length !== 6) return null;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  // sRGB -> linear
  const srgb = [r, g, b].map((v) => v / 255);
  const lin = srgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

// Return a readable text color for a given hex background.
// You can tweak the threshold if you want it to flip earlier/later.
function getContrastTextColor(bgHex: string) {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return '#FFFFFF';
  const lum = relativeLuminance(rgb);
  // If bg is bright, use near-black; otherwise use white
  return lum > 0.55 ? '#121212' : '#FFFFFF';
}

// Append alpha to a #RRGGBB color as #RRGGBBAA (RN supports this)
function withHexAlpha(hex: string, alphaHex: string) {
  const cleaned = hex.trim();
  if (!cleaned.startsWith('#')) return cleaned;
  if (cleaned.length === 7) return `${cleaned}${alphaHex}`;
  return cleaned; // fallback if already has alpha or odd format
}

// ============================================================================
// COMPONENT
// ============================================================================

const PrayerTimeItem: React.FC<PrayerTimeItemProps> = memo(
  ({
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
    const timeFormat = usePreferencesStore((state) => state.timeFormat);

    // Contrast-safe text color for accent background
    const accentText = useMemo(
      () => getContrastTextColor(theme.colors.accent),
      [theme.colors.accent]
    );

    // ============================================================================
    // TIME FORMATTING
    // ============================================================================

    const formattedTime = useMemo(() => {
      try {
        const parsedTime = parse(time, 'HH:mm', new Date());
        return timeFormat === '12-hour'
          ? format(parsedTime, 'hh:mm a')
          : format(parsedTime, 'HH:mm');
      } catch {
        return time;
      }
    }, [time, timeFormat]);

    // ============================================================================
    // GLASS CONFIGURATION
    // ============================================================================

    const glassConfig = useMemo(() => {
      if (isCurrent) {
        // Make current prayer background more solid so contrast stays consistent
        const bg = isDarkMode
          ? withHexAlpha(theme.colors.accent, 'CC') // 80% in dark mode
          : withHexAlpha(theme.colors.accent, 'DD'); // 87% in light mode

        return {
          intensity: 30,
          tint: 'light' as const,
          backgroundColor: bg,
          borderColor: withHexAlpha(accentText, '33'), // subtle contrast border
          borderWidth: 2,
          shadowColor: theme.colors.accent,
          shadowOpacity: 0.35,
          elevation: 8,
        };
      }

      // Regular prayer: keep it readable over any wallpaper
      return {
        intensity: isDarkMode ? 25 : 20,
        tint: 'light' as const,
        backgroundColor: isDarkMode
          ? 'rgba(255, 255, 255, 0.92)' // stronger in dark mode
          : 'rgba(255, 255, 255, 0.75)', // slightly more glass in light mode
        borderColor: isDarkMode
          ? 'rgba(0, 0, 0, 0.18)'
          : 'rgba(0, 0, 0, 0.10)',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: isDarkMode ? 0.18 : 0.12,
        elevation: isDarkMode ? 4 : 3,
      };
    }, [isCurrent, isDarkMode, theme.colors.accent, accentText]);

    // ============================================================================
    // TEXT COLORS (ALWAYS READABLE)
    // ============================================================================

    const mainTextColor = useMemo(() => {
      if (!isLoggable) return isDarkMode ? '#7A7A7A' : '#9A9A9A';
      if (isCurrent) return accentText; // ✅ key fix
      return '#121212'; // always strong readable text on light card bg
    }, [isLoggable, isDarkMode, isCurrent, accentText]);

    const countdownColor = useMemo(() => {
      if (!isLoggable) return isDarkMode ? '#7A7A7A' : '#9A9A9A';
      if (isCurrent) return accentText; // ✅ key fix
      return isDarkMode ? '#2A2A2A' : '#5A5A5A';
    }, [isLoggable, isDarkMode, isCurrent, accentText]);

    // ============================================================================
    // CHECKBOX
    // ============================================================================

    const checkboxColor = useMemo(() => {
      if (!isLoggable) return isDarkMode ? '#888888' : '#D0D0D0';

      // On current prayer (accent background) keep it contrast-safe
      if (isCurrent) {
        return isLogged ? accentText : withHexAlpha(accentText, 'CC'); // white/black w/ opacity
      }

      // Non-current
      if (isLogged) return '#2EAF5D'; // green check
      return isDarkMode ? '#666666' : '#666666';
    }, [isLoggable, isDarkMode, isCurrent, isLogged, accentText]);

    const renderCheckbox = () => {
      if (!showCheckbox) return null;

      const iconName = isLogged ? 'check-circle' : 'circle';

      return (
        <TouchableOpacity
          onPress={isLoggable ? onToggle : undefined}
          disabled={!isLoggable}
          style={styles.checkButton}
          accessibilityLabel={`Mark ${name} as ${
            isLogged ? 'not completed' : 'completed'
          }`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isLogged, disabled: !isLoggable }}
        >
          <FontAwesome6
            name={iconName}
            size={isCurrent ? 26 : 24}
            color={checkboxColor}
          />
        </TouchableOpacity>
      );
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
      <BlurView
        intensity={glassConfig.intensity}
        tint={glassConfig.tint}
        style={[
          styles.container,
          {
            backgroundColor: glassConfig.backgroundColor,
            borderColor: glassConfig.borderColor,
            borderWidth: glassConfig.borderWidth,
            shadowColor: glassConfig.shadowColor,
            shadowOpacity: glassConfig.shadowOpacity,
            elevation: glassConfig.elevation,
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
              {
                color: mainTextColor,
                fontFamily: isCurrent ? 'Outfit_700Bold' : 'Outfit_600SemiBold',
                fontSize: isCurrent ? 19 : 17,
              },
            ]}
          >
            {name}
          </Text>

          {!!countdown && (
            <Text
              style={[
                styles.countdownText,
                {
                  color: countdownColor,
                  fontFamily: isCurrent ? 'Outfit_600SemiBold' : 'Outfit_400Regular',
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
            {
              color: mainTextColor,
              fontFamily: isCurrent ? 'Outfit_700Bold' : 'Outfit_600SemiBold',
              fontSize: isCurrent ? 19 : 17,
            },
          ]}
        >
          {formattedTime}
        </Text>

        {/* Checkbox */}
        {renderCheckbox()}
      </BlurView>
    );
  }
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    width: containerWidth,
    minHeight: Platform.OS === 'android' ? 45 : 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingRight: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    overflow: 'hidden',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  nameContainer: {
    flexDirection: 'column',
    gap: 3,
  },
  prayerName: {
    textAlign: 'left',
    marginRight: 12,
    letterSpacing: 0.2,
  },
  countdownText: {
    fontSize: 11,
    textAlign: 'left',
  },
  prayerTime: {
    textAlign: 'right',
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.3,
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
