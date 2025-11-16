import React, { memo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';

interface LoadingStateProps {
  color: string;
  mutedColor: string;
}

interface ErrorStateProps {
  error: string;
  textColor: string;
  buttonColor: string;
  onRetry: () => void;
}

/**
 * Loading state component
 */
export const LoadingState: React.FC<LoadingStateProps> = memo(({ color, mutedColor }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator 
      size="large" 
      color={color}
      accessibilityLabel="Loading compass"
    />
    <Text 
      style={[styles.loadingText, { color: mutedColor }]}
      accessibilityRole="text"
    >
      Calibrating Compass...
    </Text>
  </View>
));

LoadingState.displayName = 'LoadingState';

/**
 * Error state component
 */
export const ErrorState: React.FC<ErrorStateProps> = memo(({
  error,
  textColor,
  buttonColor,
  onRetry,
}) => (
  <View style={styles.errorContainer}>
    <Text 
      style={[styles.errorText, { color: textColor }]}
      accessibilityRole="text"
    >
      {error}
    </Text>
    <TouchableOpacity 
      style={[styles.retryButton, { backgroundColor: buttonColor }]}
      onPress={onRetry}
      accessibilityRole="button"
      accessibilityLabel="Retry compass initialization"
      accessibilityHint="Tap to retry loading the compass"
    >
      <Text style={[styles.retryButtonText, { color: textColor }]}>
        Retry
      </Text>
    </TouchableOpacity>
  </View>
));

ErrorState.displayName = 'ErrorState';

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
  },
});