import React from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { AirbnbRating } from 'react-native-ratings';
import { FontAwesome6 } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate } from 'react-native-reanimated';

import HeroImage from '../../../components/food/HeroImage';
import ReviewPreviewCarousel from '../../../components/food/ReviewPreviewCarousel';
import SocialIcons from '../../../components/food/SocialIcons';
import ActionButtons from '../../../components/food/ActionButtons';
import FavoriteButton from '../../../components/FavouriteButton';
import OperatingHours from '../../../components/food/OperatingHours';
import SignInModal from '../../../components/SignInModal';
import { CircleButton } from './_layout';

import { useRestaurantDetails } from '../../../hooks/food/useRestaurantDetails';

const HERO_IMAGE_HEIGHT = 250;
const HEADER_HEIGHT = 60;
const statusBarHeight = (StatusBar.currentHeight || 24) + 20;

const RestaurantDetails = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scrollY = useSharedValue(0);

  const {
    restaurant,
    reviews,
    averageRating,
    isFavorited,
    isLoading,
    error,
    showHours,
    showSocials,
    isAuthModalVisible,
    toggleFavorite,
    toggleHours,
    toggleSocials,
    closeAuthModal,
  } = useRestaurantDetails(id as string);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroImageStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [-HERO_IMAGE_HEIGHT, 0, HERO_IMAGE_HEIGHT],
      [HERO_IMAGE_HEIGHT * 1.5, HERO_IMAGE_HEIGHT, HERO_IMAGE_HEIGHT]
    );
    const translateY = interpolate(
      scrollY.value,
      [-HERO_IMAGE_HEIGHT, 0, HERO_IMAGE_HEIGHT],
      [-HERO_IMAGE_HEIGHT * 0.25, 0, 0]
    );

    return {
      height,
      transform: [{ translateY }],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      scrollY.value,
      [0, HERO_IMAGE_HEIGHT - HEADER_HEIGHT],
      [0, 1]
    );
    return {
      backgroundColor: backgroundColor === 0 ? 'transparent' : theme.colors.secondary,
    };
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.primary }]}>
        <Text style={{ color: theme.colors.text.primary }}>
          Failed to load restaurant details.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.colors.accent, marginTop: 10 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <Animated.View
        style={[styles.header, headerStyle, { paddingTop: statusBarHeight }]}
      >
        <CircleButton onPress={() => router.back()} />
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
      >
        <HeroImage imageUrl={restaurant.image!} animatedStyle={heroImageStyle} />

        <View style={{ height: HERO_IMAGE_HEIGHT }} />

        <View style={[styles.section, { backgroundColor: theme.colors.secondary }]}>
          <Text style={[styles.name, { color: theme.colors.text.primary }]}>
            {restaurant.name}
          </Text>
          <Text style={[styles.categories, { color: theme.colors.text.secondary }]}>
            {restaurant.categories.join(' • ')}
          </Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <AirbnbRating
                isDisabled
                showRating={false}
                defaultRating={averageRating}
                size={20}
              />
              <Text style={[styles.ratingText, { color: theme.colors.text.muted }]}>
                {averageRating} ({reviews.length} Reviews)
              </Text>
            </View>
            <FavoriteButton isFavorited={isFavorited} onToggle={toggleFavorite} />
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.expandable, { borderBottomColor: theme.colors.muted }]}
            onPress={toggleHours}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Operating Hours
            </Text>
            <FontAwesome6
              name={showHours ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          {showHours && <OperatingHours hoursString={restaurant.hours!} />}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.expandable, { borderBottomColor: theme.colors.muted }]}
            onPress={toggleSocials}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Socials
            </Text>
            <FontAwesome6
              name={showSocials ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          {showSocials && restaurant.socials && <SocialIcons socials={restaurant.socials} />}
        </View>

        <View style={styles.section}>
          <ReviewPreviewCarousel
            reviews={reviews}
            onSeeAll={() => router.push(`/reviews/${restaurant.id}`)}
          />
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <ActionButtons
            restaurantId={restaurant.id}
            address={restaurant.address!}
            name={restaurant.name}
            website={restaurant.website}
          />
        </View>
      </Animated.ScrollView>

      <SignInModal isVisible={isAuthModalVisible} onClose={closeAuthModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    height: HEADER_HEIGHT + statusBarHeight,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  section: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
  },
  categories: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
  },
  expandable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RestaurantDetails;