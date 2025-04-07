import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AirbnbRating } from 'react-native-ratings';
import { Restaurant } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  restaurant: Restaurant;
  distance: string;
}

const RestaurantCard: React.FC<Props> = ({ restaurant, distance }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const hasReviews = restaurant.averageRating !== 0 && restaurant.totalReviews !== 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.secondary }]}
      onPress={() => router.push(`${restaurant.id}`)}
    >
      <Image source={{ uri: restaurant.image }} style={styles.image} />
      <View style={styles.details}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]} numberOfLines={1} ellipsizeMode="tail">
          {restaurant.name}
        </Text>
        {hasReviews ? (
          <>
            <View style={styles.ratingRow}>
              <AirbnbRating
                isDisabled
                showRating={false}
                defaultRating={restaurant.averageRating}
                size={14}
              />
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                {`${restaurant.averageRating} (${restaurant.totalReviews})`}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {distance} km
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.subtitle, { color: theme.colors.text.muted }]}>
              No reviews yet.
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {distance} km
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    borderRadius: 12,
    marginRight: 16,
    height: 180
  },
  image: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  details: {
    padding: 10,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RestaurantCard;
