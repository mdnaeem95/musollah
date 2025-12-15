/**
 * DoaStates - Modern Design
 * 
 * Loading and error states for Doa section
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';

import { useTheme } from '../../../context/ThemeContext';
import { enter } from '../../../utils';

// ============================================================================
// LOADING STATE
// ============================================================================

export const LoadingState: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.centerContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={enter(0)}
        style={styles.loadingContent}
      >
        <View style={[styles.loadingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name="hands-praying" size={48} color={theme.colors.accent} />
        </View>
        <ActivityIndicator size="large" color={theme.colors.accent} style={styles.spinner} />
        <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
          Loading Duas
        </Text>
        <Text style={[styles.loadingSubtext, { color: theme.colors.text.muted }]}>
          Preparing supplications...
        </Text>
      </MotiView>
    </View>
  );
};

// ============================================================================
// ERROR STATE
// ============================================================================

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.centerContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={enter(0)}
        style={styles.errorContent}
      >
        <View style={[styles.errorIcon, { backgroundColor: '#ff6b6b' + '15' }]}>
          <FontAwesome6 name="triangle-exclamation" size={48} color="#ff6b6b" />
        </View>
        <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
          Unable to Load Duas
        </Text>
        <Text style={[styles.errorMessage, { color: theme.colors.text.secondary }]}>
          {error.message || 'Something went wrong while fetching the duas'}
        </Text>
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
          activeOpacity={0.8}
        >
          <FontAwesome6 name="rotate-right" size={16} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  // Loading
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  spinner: {
    marginVertical: 8,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },

  // Error
  errorContent: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 300,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});