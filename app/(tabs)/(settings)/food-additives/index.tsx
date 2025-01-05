import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { fetchFoodAdditives } from '../../../../api/firebase';
import { FoodAdditive } from '../../../../utils/types';
import { useTheme } from '../../../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'foodAdditivesCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // Cache TTL set to 24 hours (in milliseconds)

const FoodAdditivesPage = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [foodAdditives, setFoodAdditives] = useState<FoodAdditive[]>([]);
  const [filteredAdditives, setFilteredAdditives] = useState<FoodAdditive[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFoodAdditivesWithCache = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const { timestamp, additives } = parsedData;
        const now = new Date().getTime();
        if (now - timestamp < CACHE_TTL) {
          setFoodAdditives(additives);
          setFilteredAdditives(additives);
          setIsLoading(false);
          return;
        }
      }

      const additives = await fetchFoodAdditives();
      setFoodAdditives(additives);
      setFilteredAdditives(additives);

      const cacheData = {
        timestamp: new Date().getTime(),
        additives,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to fetch food additives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodAdditivesWithCache();
  }, []);

  useEffect(() => {
    const filtered = foodAdditives.filter((additive) =>
      additive.chemicalName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAdditives(filtered);
  }, [searchQuery, foodAdditives]);

  const getStatusColor = (status: string) => {
    return status.toLowerCase() === 'ok'
      ? theme.colors.text.success
      : theme.colors.text.error;
  };

  const renderFoodAdditive = ({ item }: { item: FoodAdditive }) => (
    <View style={[styles.additiveContainer, { backgroundColor: theme.colors.secondary }]}>
      <Text style={[styles.eCode, { color: theme.colors.accent }]}>{item.eCode}</Text>
      <Text style={[styles.chemicalName, { color: theme.colors.text.secondary }]}>
        {item.chemicalName}
      </Text>
      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
        Status: {item.status}
      </Text>
      <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchContainer}>
        <FontAwesome6 name="magnifying-glass" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by chemical name"
          placeholderTextColor={theme.colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
      ) : filteredAdditives.length > 0 ? (
        <FlashList
          estimatedItemSize={150}
          data={filteredAdditives}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodAdditive}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No results found for "{searchQuery}"
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.small,
      marginBottom: theme.spacing.medium,
      ...theme.shadows.default,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.fontSizes.medium,
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.small,
      color: theme.colors.text.primary,
    },
    additiveContainer: {
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.small,
      ...theme.shadows.default,
    },
    eCode: {
      fontSize: theme.fontSizes.xLarge,
      fontFamily: 'Outfit_600SemiBold',
    },
    chemicalName: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_400Regular',
    },
    status: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_500Medium',
    },
    description: {
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_400Regular',
      marginTop: theme.spacing.small,
    },
    noResultsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noResultsText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.secondary,
    },
  });

export default FoodAdditivesPage;
