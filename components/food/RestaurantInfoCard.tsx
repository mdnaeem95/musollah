/**
 * Restaurant Info Card (RATING ALIGNMENT FIX)
 * 
 * Fixed rating number and review count baseline alignment.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { AirbnbRating } from 'react-native-ratings';

import { useTheme } from '../../context/ThemeContext';
import FavoriteButton from '../FavouriteButton';
import { enter } from '../../utils';

interface RestaurantInfoCardProps {
  name: string;
  categories: string[];
  averageRating: number;
  reviewCount: number;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

const RestaurantInfoCard: React.FC<RestaurantInfoCardProps> = ({
  name,
  categories,
  averageRating,
  reviewCount,
  isFavorited,
  onToggleFavorite,
}) => {
  const { theme } = useTheme();
  
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
                backgroundColor: theme.colors.accent + '15',
              }]}
            >
              <Text style={[styles.categoryText, { color: theme.colors.accent }]}>
                {category}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Rating Row - FIXED BASELINE ALIGNMENT */}
        {/* Rating Row - SINGLE LINE */}
        <View style={styles.ratingRow}>
        {/* Left cluster: number + stars + review text */}
        <View style={styles.ratingLeft}>
            <Text style={[styles.ratingNumber, { color: theme.colors.text.primary }]}>
            {averageRating.toFixed(1)}
            </Text>

            <AirbnbRating
            isDisabled
            showRating={false}
            defaultRating={averageRating}
            size={18}
            selectedColor="#FFD700"
            starContainerStyle={styles.starContainer}
            />

            <Text style={[styles.reviewCount, { color: theme.colors.text.secondary }]}>
            ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </Text>
        </View>

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
  ratingContainer: {
    flex: 1,
    gap: 8,
  },
  starContainer: {
    gap: 2,
    justifyContent: 'flex-start',
  },
  ratingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from 'baseline' to 'center'
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  ratingNumber: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 20, // Added explicit lineHeight
  },
  reviewCount: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20, // Added explicit lineHeight to match
  },
});

export default RestaurantInfoCard;