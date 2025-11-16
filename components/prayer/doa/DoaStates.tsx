import React, { memo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';

interface LoadingStateProps {
  color: string;
}

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
  textColor: string;
  buttonColor: string;
}

/**
 * Loading state component
 */
export const LoadingState: React.FC<LoadingStateProps> = memo(({ color }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator 
      size="large" 
      color={color}
      accessibilityLabel="Loading duas"
    />
  </View>
));

LoadingState.displayName = 'LoadingState';

/**
 * Error state component
 */
export const ErrorState: React.FC<ErrorStateProps> = memo(({
  error,
  onRetry,
  textColor,
  buttonColor,
}) => (
  <View style={styles.errorContainer}>
    <Text style={[styles.errorText, { color: textColor }]}>
      {error.message || 'Failed to load duas'}
    </Text>
    <TouchableOpacity
      style={[styles.retryButton, { backgroundColor: buttonColor }]}
      onPress={onRetry}
      accessibilityRole="button"
      accessibilityLabel="Retry loading duas"
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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