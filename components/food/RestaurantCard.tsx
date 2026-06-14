/**
 * Restaurant Card — glassmorphism redesign
 * Full-width list card with BlurView glass surface.
 *
 * @version 6.0
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/${restaurant.id}`);
  };

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite?.();
  };

  const textPrimary   = isDarkMode ? 'rgba(255,255,255,0.92)' : theme.colors.text.primary;
  const textSecondary = isDarkMode ? 'rgba(255,255,255,0.50)' : theme.colors.text.secondary;
  const textMuted     = isDarkMode ? 'rgba(255,255,255,0.35)' : theme.colors.text.muted;

  const ratingValue = (() => {
    const r = typeof restaurant.averageRating === 'string'
      ? parseFloat(restaurant.averageRating)
      : restaurant.averageRating;
    return typeof r === 'number' && !isNaN(r) && r > 0 ? r.toFixed(1) : 'New';
  })();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: index * 30 }}
    >
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
      >
        <BlurView
          intensity={isDarkMode ? 18 : 22}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.88)',
              borderColor: isDarkMode
                ? 'rgba(255,255,255,0.09)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          {/* Left: Image */}
          <View style={styles.imageWrap}>
            <ProgressiveImage
              uri={restaurant.image}
              style={styles.image}
              fallbackIcon="utensils"
            />
            {restaurant.halal && (
              <View style={styles.muisBadge}>
                <FontAwesome6 name="certificate" size={7} color="#fff" />
              </View>
            )}
          </View>

          {/* Right: Content */}
          <View style={styles.content}>
            {/* Name + heart */}
            <View style={styles.topRow}>
              <Text style={[styles.name, { color: textPrimary }]} numberOfLines={1}>
                {restaurant.name}
              </Text>
              <TouchableOpacity
                onPress={handleFavorite}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome6
                  name="heart"
                  size={15}
                  color={isFavorited ? '#FF6B6B' : textMuted}
                  solid={isFavorited}
                />
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <Text style={[styles.categories, { color: textSecondary }]} numberOfLines={1}>
              {Array.isArray(restaurant.categories)
                ? restaurant.categories.slice(0, 3).join(' · ')
                : 'Restaurant'}
            </Text>

            {/* Bottom row */}
            <View style={styles.bottomRow}>
              <View style={styles.ratingRow}>
                <FontAwesome6 name="star" size={11} color="#FFA500" solid />
                <Text style={[styles.ratingText, { color: textPrimary }]}>{ratingValue}</Text>
              </View>

              <Text style={[styles.dot, { color: textMuted }]}>·</Text>

              {isOpenNow !== undefined && (
                <>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: isOpenNow ? '#4CAF50' : '#FF6B6B' }]} />
                    <Text style={[styles.statusText, { color: isOpenNow ? '#4CAF50' : '#FF6B6B' }]}>
                      {isOpenNow ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                  <Text style={[styles.dot, { color: textMuted }]}>·</Text>
                </>
              )}

              <View style={styles.distRow}>
                <FontAwesome6 name="location-dot" size={10} color={textMuted} />
                <Text style={[styles.distText, { color: textSecondary }]}>{distance}</Text>
              </View>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  // Image
  imageWrap: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  muisBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#22C55E',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: -0.2,
    marginRight: 8,
  },
  categories: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  dot: {
    fontSize: 12,
  },
  statusRow: {
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
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
});

export default RestaurantCard;
