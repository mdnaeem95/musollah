import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useKhutbahs } from '../../../../api/services/khutbah';
import KhutbahCard from '../../../../components/prayer/KhutbahCard';

/**
 * Khutbah Screen
 * 
 * Displays Friday sermon (Khutbah) content with download links
 * 
 * Improvements over original:
 * - Uses TanStack Query for data fetching
 * - Automatic caching and refetching
 * - Better error handling
 * - Proper loading states
 * - Cleaner, more maintainable code
 */
const KhutbahScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Fetch khutbahs with TanStack Query
  const { data: khutbahs, isLoading, isError, error, refetch } = useKhutbahs();

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
        <Text style={styles.loadingText}>Loading khutbahs...</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load khutbahs'}
        </Text>
        <Text style={styles.retryText} onPress={() => refetch()}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // Empty state
  if (!khutbahs || khutbahs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No khutbahs available</Text>
      </View>
    );
  }

  // Success state
  return (
    <View style={styles.container}>
      <FlatList
        data={khutbahs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <KhutbahCard khutbah={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.primary,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      padding: 20,
    },
    listContent: {
      paddingBottom: 100,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
    errorText: {
      fontSize: 16,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.error,
      textAlign: 'center',
    },
    retryText: {
      marginTop: 16,
      fontSize: 14,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.primary,
      textDecorationLine: 'underline',
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
  });

export default KhutbahScreen;