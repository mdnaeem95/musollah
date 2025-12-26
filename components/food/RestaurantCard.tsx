/**
 * Restaurant Card Component v3.0 (GLASSMORPHISM)
 * 
 * Complete redesign with app design system:
 * - BlurView glassmorphism
 * - Enhanced shadows and depth
 * - Quick favorite button
 * - Distance pre-calculated (passed as prop)
 * - "Open Now" status badge
 * - Improved visual hierarchy
 * 
 * @version 3.0 - Glassmorphism upgrade
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import ProgressiveImage from './ProgressiveImage';
import { Restaurant } from '../../api/services/food';

interface RestaurantCardProps {
  restaurant: Restaurant;
  distance: string;  // ✅ Pre-calculated distance
  isFavorited?: boolean;  // ✅ NEW: Favorite status
  onToggleFavorite?: () => void;  // ✅ NEW: Toggle handler
  isOpenNow?: boolean;  // ✅ NEW: Operating hours status
  index?: number;  // ✅ For staggered animation
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/${restaurant.id}`);
  };
  
  const handleDirections = (e: any) => {
    e.stopPropagation();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const url = Platform.select({
      ios: `maps://app?daddr=${restaurant.coordinates.latitude},${restaurant.coordinates.longitude}`,
      android: `google.navigation:q=${restaurant.coordinates.latitude},${restaurant.coordinates.longitude}`,
    });
    if (url) Linking.openURL(url);
  };
  
  const handleFavorite = (e: any) => {
    e.stopPropagation();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(isFavorited ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleFavorite?.();
  };
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: index * 50,  // ✅ Staggered entrance
      }}
    >
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [
          styles.cardWrapper,
          {
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        {/* ✅ Glassmorphism Card */}
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.secondary,
              shadowColor: theme.colors.accent,
            }
          ]}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <ProgressiveImage
              uri={restaurant.image}
              style={styles.image}
              fallbackIcon="utensils"
            />
            
            {/* Gradient overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageGradient}
            />
            
            {/* Top Row Badges */}
            <View style={styles.topBadgesRow}>
              {/* ✅ MUIS Certification Badge */}
              {restaurant.halal && (
                <MotiView
                  from={{ scale: 0, rotate: '-45deg' }}
                  animate={{ scale: 1, rotate: '0deg' }}
                  delay={300 + (index * 50)}
                  style={styles.certificationBadge}
                >
                  <BlurView intensity={80} tint="light" style={styles.badgeBlur}>
                    <FontAwesome6 name="certificate" size={12} color="#4CAF50" />
                    <Text style={styles.badgeText}>MUIS</Text>
                  </BlurView>
                </MotiView>
              )}
              
              {/* ✅ "Open Now" Badge */}
              {isOpenNow !== undefined && (
                <MotiView
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  delay={350 + (index * 50)}
                  style={styles.openBadge}
                >
                  <BlurView 
                    intensity={80} 
                    tint={isOpenNow ? 'light' : 'dark'} 
                    style={[
                      styles.openBadgeBlur,
                      { borderColor: isOpenNow ? '#4CAF50' : '#ff6b6b' }
                    ]}
                  >
                    <View style={[
                      styles.openDot,
                      { backgroundColor: isOpenNow ? '#4CAF50' : '#ff6b6b' }
                    ]} />
                    <Text style={[
                      styles.openText,
                      { color: isOpenNow ? '#4CAF50' : '#ff6b6b' }
                    ]}>
                      {isOpenNow ? 'Open' : 'Closed'}
                    </Text>
                  </BlurView>
                </MotiView>
              )}
            </View>
            
            {/* ✅ Distance Badge (bottom-right) */}
            <View style={styles.distanceBadge}>
              <BlurView intensity={80} tint="dark" style={styles.distanceBlur}>
                <FontAwesome6 name="location-dot" size={10} color="#fff" />
                <Text style={styles.distanceText}>{distance}</Text>
              </BlurView>
            </View>
          </View>
          
          {/* Content Section */}
          <View style={styles.content}>
            {/* Restaurant Name */}
            <Text 
              style={[styles.name, { color: theme.colors.text.primary }]}
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
            
            {/* Meta Row (Rating + Categories) */}
            <View style={styles.metaRow}>
              {/* Rating */}
              <View style={styles.ratingContainer}>
                <FontAwesome6 name="star" size={12} color="#FFD700" solid />
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
              
              {/* Review count */}
              <Text style={[styles.reviews, { color: theme.colors.text.secondary }]}>
                ({restaurant.totalReviews ?? 0})
              </Text>
              
              {/* Categories */}
              <Text 
                style={[styles.categories, { color: theme.colors.text.secondary }]}
                numberOfLines={1}
              >
                {Array.isArray(restaurant.categories) 
                  ? restaurant.categories.slice(0, 2).join(' • ') 
                  : ''}
              </Text>
            </View>
            
            {/* ✅ Action Buttons Row */}
            <View style={styles.actionsRow}>
              {/* Directions Button */}
              <TouchableOpacity
                onPress={handleDirections}
                style={[styles.actionButton, { backgroundColor: theme.colors.accent + '15' }]}
                activeOpacity={0.7}
              >
                <FontAwesome6 
                  name="location-arrow" 
                  size={14} 
                  color={theme.colors.accent} 
                />
                <Text style={[styles.actionText, { color: theme.colors.accent }]}>
                  Directions
                </Text>
              </TouchableOpacity>
              
              {/* ✅ Quick Favorite Button */}
              <TouchableOpacity
                onPress={handleFavorite}
                style={[
                  styles.favoriteButton,
                  { 
                    backgroundColor: isFavorited 
                      ? theme.colors.accent 
                      : theme.colors.accent + '15'
                  }
                ]}
                activeOpacity={0.7}
              >
                <FontAwesome6 
                  name="heart" 
                  size={14} 
                  color={isFavorited ? '#fff' : theme.colors.accent}
                  solid={isFavorited}
                />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: 280,
    marginRight: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topBadgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  certificationBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#4CAF50',
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  openBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  openBadgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  distanceBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  reviews: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  categories: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RestaurantCard;