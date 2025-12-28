/**
 * Restaurant Card Component v5.0 (GRAB LIST STYLE)
 * 
 * Full-width, compact list design inspired by Grab:
 * - Full screen width (not horizontal scroll)
 * - Image on LEFT (80x80 square)
 * - Content on RIGHT
 * - Short, compact layout (~100px height)
 * - All info visible at a glance
 * 
 * @version 5.0 - Full-width list card
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Linking, Platform } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import ProgressiveImage from './ProgressiveImage';
import { Restaurant } from '../../api/services/food';

interface RestaurantCardProps {
  restaurant: Restaurant;
  distance: string;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  isOpenNow?: boolean;
  index?: number;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ 
  restaurant, 
  distance,
  isFavorited = false,
  onToggleFavorite,
  isOpenNow,
  index = 0,
}) => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  
  const handleCardPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/${restaurant.id}`);
  };
  
  const handleFavorite = (e: any) => {
    e.stopPropagation();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleFavorite?.();
  };
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 300,
        delay: index * 30,
      }}
    >
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isDarkMode ? theme.colors.secondary : '#FFFFFF',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        {/* Left: Image */}
        <View style={styles.imageContainer}>
          <ProgressiveImage
            uri={restaurant.image}
            style={styles.image}
            fallbackIcon="utensils"
          />
          
          {/* MUIS badge (if applicable) */}
          {restaurant.halal && (
            <View style={styles.muisBadge}>
              <FontAwesome6 name="certificate" size={8} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        {/* Right: Content */}
        <View style={styles.content}>
          {/* Top row: Name + Favorite */}
          <View style={styles.topRow}>
            <Text 
              style={[styles.name, { color: theme.colors.text.primary }]}
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
            
            {/* Favorite button */}
            <TouchableOpacity
              onPress={handleFavorite}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.favoriteButton}
            >
              <FontAwesome6 
                name="heart" 
                size={16} 
                color={isFavorited ? '#FF6B6B' : theme.colors.text.muted}
                solid={isFavorited}
              />
            </TouchableOpacity>
          </View>
          
          {/* Categories */}
          <Text 
            style={[styles.categories, { color: theme.colors.text.secondary }]}
            numberOfLines={1}
          >
            {Array.isArray(restaurant.categories) 
              ? restaurant.categories.slice(0, 3).join(' • ') 
              : 'Restaurant'}
          </Text>
          
          {/* Bottom row: Rating, Status, Distance */}
          <View style={styles.bottomRow}>
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <FontAwesome6 name="star" size={12} color="#FFA500" solid />
              <Text style={[styles.rating, { color: theme.colors.text.primary }]}>
                {(() => {
                  const rating = typeof restaurant.averageRating === 'string' 
                    ? parseFloat(restaurant.averageRating) 
                    : restaurant.averageRating;
                  
                  if (typeof rating === 'number' && !isNaN(rating) && rating > 0) {
                    return rating.toFixed(1);
                  }
                  
                  return 'New';
                })()}
              </Text>
            </View>
            
            {/* Divider */}
            <Text style={[styles.divider, { color: theme.colors.text.muted }]}>•</Text>
            
            {/* Status */}
            {isOpenNow !== undefined && (
              <>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: isOpenNow ? '#4CAF50' : '#FF6B6B' }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: isOpenNow ? '#4CAF50' : '#FF6B6B' }
                  ]}>
                    {isOpenNow ? 'Open' : 'Closed'}
                  </Text>
                </View>
                <Text style={[styles.divider, { color: theme.colors.text.muted }]}>•</Text>
              </>
            )}
            
            {/* Distance */}
            <View style={styles.distanceContainer}>
              <FontAwesome6 name="location-dot" size={10} color={theme.colors.text.muted} />
              <Text style={[styles.distance, { color: theme.colors.text.secondary }]}>
                {distance}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  
  // === LEFT: IMAGE ===
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  muisBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#4CAF50',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // === RIGHT: CONTENT ===
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  
  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: -0.3,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  
  // Categories
  categories: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 6,
  },
  
  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  divider: {
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distance: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
});

export default RestaurantCard;