import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../../../context/ThemeContext';
import { useFoodAdditivesPage } from '../../../../hooks/foodAdditives/useFoodAdditivesPage';
import { getAdditiveStatusColor } from '../../../../api/services/foodAdditives';
import { FoodAdditive } from '../../../../utils/types';

const FoodAdditivesPage = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    searchQuery,
    filteredAdditives,
    isLoading,
    error,
    handleSearchChange,
    navigateToScanner,
  } = useFoodAdditivesPage();

  const renderFoodAdditive = ({ item }: { item: FoodAdditive }) => (
    <View style={[styles.additiveContainer, { backgroundColor: theme.colors.secondary }]}>
      <Text style={[styles.eCode, { color: theme.colors.accent }]}>{item.eCode}</Text>
      <Text style={[styles.chemicalName, { color: theme.colors.text.secondary }]}>
        {item.chemicalName}
      </Text>
      <Text
        style={[
          styles.status,
          { color: getAdditiveStatusColor(item.status, theme) },
        ]}
      >
        Status: {item.status}
      </Text>
      <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
        {item.description}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.mainContainer, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading food additives...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.mainContainer, styles.centered]}>
        <FontAwesome6 name="circle-exclamation" size={48} color={theme.colors.text.error} />
        <Text style={[styles.errorText, { color: theme.colors.text.error }]}>
          Failed to load food additives
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.text.muted }]}>
          Please try again later
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome6 name="magnifying-glass" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by E-code or chemical name"
          placeholderTextColor={theme.colors.text.muted}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <FontAwesome6
            name="xmark"
            size={18}
            color={theme.colors.text.muted}
            onPress={() => handleSearchChange('')}
            style={styles.clearButton}
          />
        )}
      </View>

      {/* Results Count */}
      {searchQuery.length > 0 && (
        <Text style={[styles.resultsCount, { color: theme.colors.text.muted }]}>
          {filteredAdditives.length} result{filteredAdditives.length !== 1 ? 's' : ''} found
        </Text>
      )}

      {/* Additives List */}
      {filteredAdditives.length > 0 ? (
        <FlashList
          estimatedItemSize={150}
          data={filteredAdditives}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodAdditive}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <FontAwesome6 name="magnifying-glass" size={48} color={theme.colors.text.muted} />
          <Text style={[styles.noResultsText, { color: theme.colors.text.secondary }]}>
            No results found for "{searchQuery}"
          </Text>
          <Text style={[styles.noResultsSubtext, { color: theme.colors.text.muted }]}>
            Try a different search term
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.primary,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.medium,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.small,
      marginBottom: theme.spacing.small,
      ...theme.shadows.default,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.small,
      color: theme.colors.text.primary,
    },
    clearButton: {
      padding: theme.spacing.xSmall,
    },
    resultsCount: {
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_400Regular',
      marginBottom: theme.spacing.small,
      paddingHorizontal: theme.spacing.xSmall,
    },
    additiveContainer: {
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.medium,
      marginHorizontal: 3,
      ...theme.shadows.default,
    },
    eCode: {
      fontSize: theme.fontSizes.xLarge,
      fontFamily: 'Outfit_600SemiBold',
      marginBottom: theme.spacing.xSmall,
    },
    chemicalName: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_500Medium',
      marginBottom: theme.spacing.xSmall,
    },
    status: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_500Medium',
      marginBottom: theme.spacing.small,
    },
    description: {
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_400Regular',
      lineHeight: theme.fontSizes.small * 1.5,
    },
    noResultsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    noResultsText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_500Medium',
      textAlign: 'center',
    },
    noResultsSubtext: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      textAlign: 'center',
    },
    loadingText: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
    },
    errorText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      textAlign: 'center',
    },
    errorSubtext: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 20,
    },
  });

export default FoodAdditivesPage;