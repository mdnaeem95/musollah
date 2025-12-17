/**
 * Restaurant Card Component (PRODUCTION SAFE)
 * 
 * 3D restaurant card with certification badges and quick actions.
 * 
 * ✅ FIXED: Line 143 crash - averageRating?.toFixed() type validation
 * ✅ FIXED: Safe number handling for totalReviews
 * ✅ FIXED: Safe array handling for categories
 * 
 * @version 2.1 - Production crash fixes
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import QuickActionButton from './QuickActionButton';
import type { Restaurant } from '../../utils/types';
import { enter } from '../../utils';

interface RestaurantCardProps {
  restaurant: Restaurant;
  distance: string;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, distance }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  const handleCardPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/${restaurant.id}`);
  };
  
  const handleCall = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Implement call functionality
  };
  
  const handleDirections = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Open maps
    const url = Platform.select({
      ios: `maps://app?daddr=${restaurant.coordinates.latitude},${restaurant.coordinates.longitude}`,
      android: `google.navigation:q=${restaurant.coordinates.latitude},${restaurant.coordinates.longitude}`,
    });
    if (url) Linking.openURL(url);
  };
  
  const handleFavorite = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(isFavorited ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsFavorited(!isFavorited);
  };
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20, rotateX: '45deg' }}
      animate={{ opacity: 1, translateY: 0, rotateX: '0deg' }}
      transition={enter(0)}
    >
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [
          styles.card,
          {
            transform: [
              { perspective: 1000 },
              { scale: pressed ? 0.98 : 1 },
            ],
            backgroundColor: theme.colors.secondary,
            shadowColor: theme.colors.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 8,
          },
        ]}
      >
        {/* Image with gradient overlay */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: restaurant.image }}
            style={styles.image}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
          
          {/* MUIS Badge (if certified) */}
          {restaurant.halal && (
            <MotiView
              from={{ scale: 0, rotate: '-45deg' }}
              animate={{ scale: 1, rotate: '0deg' }}
              delay={300}
              style={styles.certificationBadge}
            >
              <BlurView intensity={80} tint="light" style={styles.badgeBlur}>
                <FontAwesome6 name="certificate" size={12} color="#4CAF50" />
                <Text style={styles.badgeText}>MUIS</Text>
              </BlurView>
            </MotiView>
          )}
          
          {/* Distance badge */}
          <View style={styles.distanceBadge}>
            <BlurView intensity={80} tint="dark" style={styles.distanceBlur}>
              <FontAwesome6 name="location-dot" size={10} color="#fff" />
              <Text style={styles.distanceText}>{distance}</Text>
            </BlurView>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text 
            style={[styles.name, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>
          
          <View style={styles.metaRow}>
            {/* Rating - FIXED: Type-safe number validation (LINE 143 CRASH FIX) */}
            <View style={styles.ratingContainer}>
              <FontAwesome6 name="star" size={12} color="#FFD700" solid />
              <Text style={[styles.rating, { color: theme.colors.text.primary }]}>
                {typeof restaurant.averageRating === 'number' && isFinite(restaurant.averageRating)
                  ? restaurant.averageRating.toFixed(1)
                  : 'New'}
              </Text>
            </View>
            
            {/* Reviews count - FIXED: Safe number fallback */}
            <Text style={[styles.reviews, { color: theme.colors.text.secondary }]}>
              ({typeof restaurant.totalReviews === 'number' ? Math.max(0, restaurant.totalReviews) : 0})
            </Text>
            
            {/* Categories - FIXED: Safe array handling */}
            <Text 
              style={[styles.categories, { color: theme.colors.text.secondary }]}
              numberOfLines={1}
            >
              {Array.isArray(restaurant.categories) 
                ? restaurant.categories.slice(0, 2).join(' • ') 
                : ''}
            </Text>
          </View>
          
          {/* Quick actions row */}
          <View style={styles.actionsRow}>
            <QuickActionButton icon="phone" onPress={handleCall} />
            <QuickActionButton icon="location-arrow" onPress={handleDirections} />
            <QuickActionButton icon="bookmark" onPress={handleFavorite} active={isFavorited} />
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 280,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
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
  certificationBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#4CAF50',
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  distanceBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 16,
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
});

export default RestaurantCard;