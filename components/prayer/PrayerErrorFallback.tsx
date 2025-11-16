import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';

interface PrayerErrorFallbackProps {
  error: Error;
  resetError: () => void;
  isOffline?: boolean;
}

/**
 * Error fallback component for prayer tab
 * Shows different messages based on error type
 */
export const PrayerErrorFallback: React.FC<PrayerErrorFallbackProps> = ({
  error,
  resetError,
  isOffline = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Determine error type
  const isNetworkError = error.message.includes('network') || 
                        error.message.includes('connection') ||
                        isOffline;

  const icon = isNetworkError ? 'wifi-slash' : 'exclamation-triangle';
  const title = isNetworkError ? 'No Connection' : 'Something Went Wrong';
  const message = isNetworkError
    ? 'Please check your internet connection and try again.'
    : error.message || 'An unexpected error occurred.';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <FontAwesome6 
          name={icon} 
          size={48} 
          color={theme.colors.text.error} 
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={resetError}
        activeOpacity={0.7}
      >
        <FontAwesome6 name="rotate" size={16} color={theme.colors.text.primary} />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>

      {isNetworkError && (
        <Text style={styles.hint}>
          Cached prayer times will be shown when available
        </Text>
      )}
    </MotiView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.secondary,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: theme.colors.text.primary,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: 16,
  },
});