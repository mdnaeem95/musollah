/**
 * Khutbah (Friday Sermon) - Modern Design
 * 
 * Display Friday sermon content with multi-language PDFs and AI summaries
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';

import { useTheme } from '../../../../context/ThemeContext';
import { useKhutbahs } from '../../../../api/services/khutbah';
import KhutbahCard from '../../../../components/prayer/KhutbahCard';

/**
 * Khutbah Screen
 * 
 * Displays Friday sermon (Khutbah) content with download links
 * 
 * Features:
 * - Multi-language PDF downloads (English, Malay, Tamil, Mandarin)
 * - AI-generated summaries
 * - Date-ordered display (newest first)
 * - Staggered animations
 * - Modern loading/error states
 * - TanStack Query caching
 */
const KhutbahScreen: React.FC = () => {
  const { theme } = useTheme();

  // Fetch khutbahs with TanStack Query
  const { data: khutbahs, isLoading, isError, error, refetch } = useKhutbahs();

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <LoadingState />
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <ErrorState error={error} onRetry={refetch} />
      </View>
    );
  }

  // Empty state
  if (!khutbahs || khutbahs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <EmptyState />
      </View>
    );
  }

  // Success state
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>  
      <FlashList
        data={khutbahs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              delay: index * 60,
              damping: 20,
            }}
          >
            <KhutbahCard khutbah={item} />
          </MotiView>
        )}
        estimatedItemSize={250}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<KhutbahHeader />}
      />
    </View>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

const KhutbahHeader: React.FC = () => {
  const { theme } = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      style={styles.headerContainer}
    >
      {/* Icon Badge */}
      <View style={[styles.iconBadge, { backgroundColor: theme.colors.accent + '15' }]}>
        <FontAwesome6 name="mosque" size={32} color={theme.colors.accent} />
      </View>

      {/* Text Content */}
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Friday Khutbah
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
          Weekly sermon content & resources
        </Text>
      </View>

      {/* Info Badge */}
      <View style={[styles.infoBadge, { backgroundColor: theme.colors.accent + '15' }]}>
        <FontAwesome6 name="book-quran" size={12} color={theme.colors.accent} />
        <Text style={[styles.infoBadgeText, { color: theme.colors.accent }]}>
          Authentic
        </Text>
      </View>
    </MotiView>
  );
};

// ============================================================================
// LOADING STATE
// ============================================================================

const LoadingState: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.centerContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.stateContent}
      >
        <View style={[styles.stateIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name="mosque" size={48} color={theme.colors.accent} />
        </View>
        <ActivityIndicator size="large" color={theme.colors.accent} style={styles.spinner} />
        <Text style={[styles.stateTitle, { color: theme.colors.text.primary }]}>
          Loading Khutbahs
        </Text>
        <Text style={[styles.stateSubtext, { color: theme.colors.text.muted }]}>
          Fetching sermon content...
        </Text>
      </MotiView>
    </View>
  );
};

// ============================================================================
// ERROR STATE
// ============================================================================

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { theme } = useTheme();

  const errorMessage = error instanceof Error ? error.message : 'Failed to load khutbahs';

  return (
    <View style={styles.centerContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.stateContent}
      >
        <View style={[styles.stateIcon, { backgroundColor: '#ff6b6b' + '15' }]}>
          <FontAwesome6 name="triangle-exclamation" size={48} color="#ff6b6b" />
        </View>
        <Text style={[styles.stateTitle, { color: theme.colors.text.primary }]}>
          Unable to Load Khutbahs
        </Text>
        <Text style={[styles.errorMessage, { color: theme.colors.text.secondary }]}>
          {errorMessage}
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
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.centerContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.stateContent}
      >
        <View style={[styles.stateIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name="calendar-xmark" size={48} color={theme.colors.accent} />
        </View>
        <Text style={[styles.stateTitle, { color: theme.colors.text.primary }]}>
          No Khutbahs Available
        </Text>
        <Text style={[styles.stateSubtext, { color: theme.colors.text.secondary }]}>
          Check back soon for new sermon content
        </Text>
      </MotiView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  headerContainer: {
    marginBottom: 24,
    gap: 16,
  },
  iconBadge: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  infoBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },

  // State Container
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  stateContent: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 300,
  },
  stateIcon: {
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
  stateTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },
  stateSubtext: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 20,
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

export default KhutbahScreen;