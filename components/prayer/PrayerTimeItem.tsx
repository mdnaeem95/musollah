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
  isPast?: boolean;
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
    isPast = false,
    countdown,
  }) => {
    // next prayer = has countdown but is not current
    const isNext = !!countdown && !isCurrent;
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
        return {
          intensity: 45,
          tint: 'dark' as const,
          backgroundColor: withHexAlpha(theme.colors.accent, 'D9'), // ~85%
          borderColor: 'rgba(255, 255, 255, 0.4)',
          borderWidth: 1.5,
          shadowColor: theme.colors.accent,
          shadowOpacity: 0.55,
          elevation: 14,
          shadowRadius: 20,
        };
      }
      if (isPast) {
        return {
          intensity: 15,
          tint: 'dark' as const,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.07)',
          borderWidth: 0.5,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          elevation: 1,
          shadowRadius: 2,
        };
      }
      if (isNext) {
        return {
          intensity: 50,
          tint: 'dark' as const,
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          borderColor: 'rgba(255, 255, 255, 0.28)',
          borderWidth: 1,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          elevation: 5,
          shadowRadius: 8,
        };
      }
      // Future / standard
      return {
        intensity: 50,
        tint: 'dark' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderColor: 'rgba(255, 255, 255, 0.18)',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        elevation: 3,
        shadowRadius: 6,
      };
    }, [isCurrent, isPast, isNext, theme.colors.accent]);

    // ============================================================================
    // TEXT COLORS (ALWAYS READABLE)
    // ============================================================================

    const mainTextColor = useMemo(() => {
      if (name === 'Syuruk') return 'rgba(255, 255, 255, 0.35)';
      if (isCurrent) return accentText;
      if (isPast)    return 'rgba(255, 255, 255, 0.45)';
      return 'rgba(255, 255, 255, 0.92)';
    }, [name, isCurrent, isPast, accentText]);

    const countdownColor = useMemo(() => {
      if (name === 'Syuruk') return 'rgba(255, 255, 255, 0.25)';
      if (isCurrent) return accentText;
      if (isNext)    return theme.colors.accent;
      return 'rgba(255, 255, 255, 0.55)';
    }, [name, isCurrent, isNext, accentText, theme.colors.accent]);

    // ============================================================================
    // CHECKBOX
    // ============================================================================

    const checkboxColor = useMemo(() => {
      if (name === 'Syuruk') return 'rgba(255, 255, 255, 0.25)';
      if (!isLoggable) return 'rgba(255, 255, 255, 0.25)';
      if (isCurrent) return isLogged ? accentText : withHexAlpha(accentText, 'CC');
      if (isLogged) return '#4ADE80'; // bright green visible on any sky
      return 'rgba(255, 255, 255, 0.5)';
    }, [name, isLoggable, isCurrent, isLogged, accentText]);

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

    const fontSize   = isCurrent ? 20 : isPast ? 15 : 17;
    const fontFamily = isCurrent ? 'Outfit_700Bold' : isPast ? 'Outfit_400Regular' : 'Outfit_600SemiBold';

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
            shadowRadius: glassConfig.shadowRadius,
            elevation: glassConfig.elevation,
            minHeight: isCurrent ? 68 : isPast ? 48 : 58,
            opacity: isPast && name !== 'Syuruk' ? 0.55 : 1,
          },
          name === 'Syuruk' && styles.disabledContainer,
        ]}
      >
        {/* Accent left-bar for next prayer */}
        {isNext && (
          <View style={[styles.nextBar, { backgroundColor: theme.colors.accent }]} />
        )}

        {/* Prayer Name + Countdown */}
        <View style={styles.nameContainer}>
          <Text style={[styles.prayerName, style, { color: mainTextColor, fontFamily, fontSize }]}>
            {name}
          </Text>

          {!!countdown && (
            <Text
              style={[
                styles.countdownText,
                {
                  color: countdownColor,
                  fontFamily: isNext ? 'Outfit_600SemiBold' : 'Outfit_400Regular',
                  fontSize: isNext ? 12 : 11,
                },
              ]}
            >
              in {countdown}
            </Text>
          )}
        </View>

        {/* Prayer Time */}
        <Text style={[styles.prayerTime, style, { color: mainTextColor, fontFamily, fontSize }]}>
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
    width: screenWidth - 32,
    minHeight: Platform.OS === 'android' ? 52 : 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingRight: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    overflow: 'hidden',
  },
  disabledContainer: {
    opacity: 0.4,
  },
  nextBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
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
