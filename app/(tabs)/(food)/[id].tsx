/**
 * Restaurant Details Screen (ALIGNMENT & VISIBILITY FIX)
 *
 * Fixed rating alignment and made back button always visible.
 *
 * @version 3.3
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';

import RestaurantInfoCard from '../../../components/food/RestaurantInfoCard';
import CertificationBadge from '../../../components/food/CertificationBadge';
import AddressCard from '../../../components/food/AddressCard';
import QuickActionBar from '../../../components/food/QuickActionBar';
import ExpandableSection from '../../../components/food/ExpandableSection';
import ReviewPreviewCarousel from '../../../components/food/ReviewPreviewCarousel';
import SocialIcons from '../../../components/food/SocialIcons';
import OperatingHours from '../../../components/food/OperatingHours';
import SignInModal from '../../../components/SignInModal';

import { useRestaurantDetails } from '../../../hooks/food/useRestaurantDetails';

const HERO_IMAGE_HEIGHT = 280;

const RestaurantDetails = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
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
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.3, 1],
      'clamp'
    );

    return {
      transform: [{ scale }],
    };
  });

  const headerBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HERO_IMAGE_HEIGHT - 100, HERO_IMAGE_HEIGHT],
      [0, 1],
      'clamp'
    );
    
    return {
      opacity,
      backgroundColor: theme.colors.secondary,
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
        <Text style={{ color: theme.colors.text.primary, marginBottom: 16, fontSize: 16 }}>
          Failed to load restaurant details.
        </Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: theme.colors.accent }]}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {/* Fixed Header with Animated Background */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + 8,
            height: insets.top + 60,
          },
        ]}
      >
        {/* Animated Background */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            headerBackgroundStyle,
          ]}
        />
        
        {/* Always Visible Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }]}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Animated.Image
            source={{ uri: restaurant.image }}
            style={[styles.heroImage, heroImageStyle]}
            resizeMode="cover"
          />
        </View>

        {/* Content Container */}
        <View style={[styles.contentContainer, { backgroundColor: theme.colors.primary }]}>
          {/* Restaurant Info Card */}
          <RestaurantInfoCard
            name={restaurant.name}
            categories={restaurant.categories}
            averageRating={averageRating}
            reviewCount={reviews.length}
            isFavorited={isFavorited}
            onToggleFavorite={toggleFavorite}
          />
          
          {/* Certification Badge */}
          {restaurant.halal && (
            <View style={styles.section}>
              <CertificationBadge certified={true} />
            </View>
          )}
          
          {/* Quick Action Bar */}
          <View style={styles.section}>
            <QuickActionBar
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              address={restaurant.address!}
              latitude={restaurant.coordinates.latitude}
              longitude={restaurant.coordinates.longitude}
              website={restaurant.website}
            />
          </View>
          
          {/* Address Card */}
          <View style={styles.section}>
            <AddressCard 
              address={restaurant.address!}
              distance="1.2 km"
            />
          </View>
          
          {/* Operating Hours */}
          <View style={styles.section}>
            <ExpandableSection
              title="Operating Hours"
              icon="clock"
              isExpanded={showHours}
              onToggle={toggleHours}
              delay={300}
            >
              <OperatingHours hoursString={restaurant.hours!} />
            </ExpandableSection>
          </View>
          
          {/* Socials */}
          {restaurant.socials && (
            <View style={styles.section}>
              <ExpandableSection
                title="Social Media"
                icon="share-nodes"
                isExpanded={showSocials}
                onToggle={toggleSocials}
                delay={400}
              >
                <SocialIcons socials={restaurant.socials} />
              </ExpandableSection>
            </View>
          )}
          
          {/* Reviews Section */}
          <View style={styles.section}>
            <ReviewPreviewCarousel
              reviews={reviews}
              onSeeAll={() => router.push(`/food/reviews/${restaurant.id}`)}
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Sign In Modal */}
      <SignInModal isVisible={isAuthModalVisible} onClose={closeAuthModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    width: '100%',
    height: HERO_IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default RestaurantDetails;