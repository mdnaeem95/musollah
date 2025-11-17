import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { MotiView } from 'moti';

import SearchBar from '../../../components/food/SearchBar';
import CategoryPill from '../../../components/food/CategoryPill';
import RestaurantCard from '../../../components/food/RestaurantCard';
import RestaurantMap from '../../../components/food/RestaurantMap';
import RestaurantCardSkeleton from '../../../components/food/RestaurantCardSkeleton';
import CategoryPillSkeleton from '../../../components/food/CategoryPillSkeleton';

import { useFoodTab } from '../../../hooks/food/useFoodTab';

const RestaurantLocator = () => {
  const { theme } = useTheme();
  
  const {
    restaurants,
    recommendedRestaurants,
    categories,
    selectedCategories,
    region,
    isLoading,
    handleCategorySelect,
    getRestaurantDistance,
  } = useFoodTab();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.primary }]}
      contentContainerStyle={styles.contentContainer}
    >
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
      >
        <SearchBar />
      </MotiView>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 500, delay: 100 }}
      >
        <RestaurantMap
          region={region}
          restaurants={isLoading ? [] : restaurants}
        />
      </MotiView>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Categories
        </Text>
        <FlatList
          data={isLoading ? Array(5).fill(null) : categories}
          horizontal
          keyExtractor={(item, index) => item || `skeleton-${index}`}
          renderItem={({ item, index }) =>
            isLoading ? (
              <CategoryPillSkeleton />
            ) : (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 80 }}
              >
                <CategoryPill
                  label={item}
                  selected={selectedCategories.includes(item)}
                  onPress={() => handleCategorySelect(item)}
                />
              </MotiView>
            )
          }
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Recommended for You
        </Text>
        <FlatList
          data={isLoading ? Array(5).fill(null) : recommendedRestaurants}
          horizontal
          keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
          renderItem={({ item, index }) =>
            isLoading || !item ? (
              <RestaurantCardSkeleton />
            ) : (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 100 }}
              >
                <RestaurantCard
                  restaurant={item}
                  distance={getRestaurantDistance(item)}
                />
              </MotiView>
            )
          }
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
  },
});

export default RestaurantLocator;