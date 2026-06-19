/**
 * Restaurant Info Card (RATING ALIGNMENT FIX)
 * 
 * Fixed rating number and review count baseline alignment.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAccent } from '../../hooks/useAccent';
import FavoriteButton from './FavouriteButton';
import { enter } from '../../utils';

interface RestaurantInfoCardProps {
  name: string;
  categories: string[];
  averageRating: number;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

const RestaurantInfoCard: React.FC<RestaurantInfoCardProps> = ({
  name,
  categories,
  averageRating,
  isFavorited,
  onToggleFavorite,
}) => {
  const { theme } = useTheme();
  const { accent } = useAccent();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <View style={[styles.card, {
        backgroundColor: theme.colors.secondary,
      }]}>
        {/* Restaurant Name */}
        <Text style={[styles.name, { color: theme.colors.text.primary }]} numberOfLines={2}>
          {name}
        </Text>
        
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {categories.slice(0, 3).map((category, index) => (
            <View
              key={`${category}-${index}`}
              style={[styles.categoryPill, {
                backgroundColor: accent + '15',
              }]}
            >
              <Text style={[styles.categoryText, { color: accent }]}>
                {category}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Rating Row — aggregated Google rating + favourite */}
        <View style={styles.ratingRow}>
          {averageRating > 0 ? (
            <View style={styles.ratingChip}>
              <FontAwesome6 name="star" size={12} color="#FFC107" solid />
              <Text style={[styles.ratingNumber, { color: theme.colors.text.primary }]}>
                {averageRating.toFixed(1)}
              </Text>
              <Text style={[styles.ratingSource, { color: theme.colors.text.muted }]}>
                on Google
              </Text>
            </View>
          ) : (
            <Text style={[styles.reviewCount, { color: theme.colors.text.muted }]}>
              No rating yet
            </Text>
          )}

          {/* Right: Favorite */}
          <FavoriteButton isFavorited={isFavorited} onToggle={onToggleFavorite} />
        </View>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20
  },
  name: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
    lineHeight: 28,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,193,7,0.12)',
  },
  ratingNumber: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 18,
  },
  ratingSource: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    lineHeight: 18,
  },
  reviewCount: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
  },
});

export default RestaurantInfoCard;