import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Animated,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { addToFavourites, fetchFavourites, fetchRestaurantById, fetchReviews, removeFromFavourites } from '../../../api/firebase'; // Function to fetch restaurant details by ID
import { Restaurant, RestaurantReview } from '../../../utils/types';
import OperatingHours from '../../../components/food/OperatingHours';
import FavoriteButton from '../../../components/FavouriteButton'
import { getAuth } from '@react-native-firebase/auth';
import SignInModal from '../../../components/SignInModal';
import { AirbnbRating } from 'react-native-ratings';
import { FontAwesome6 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { FlashList } from '@shopify/flash-list';
import { CircleButton } from './_layout';
import { useTheme } from '../../../context/ThemeContext';

const HERO_IMAGE_HEIGHT = 250;
const HEADER_HEIGHT = 60
const statusBarHeight = (StatusBar.currentHeight || 24) + 20

const RestaurantDetails = () => {
  const { showActionSheetWithOptions } = useActionSheet();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showOperatingHours, setShowOperatingHours] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const { id } = useLocalSearchParams(); // Get the restaurant ID from the URL
  const router = useRouter();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { theme } = useTheme();

  const user = getAuth();
  const currentUser = user.currentUser;
  const currentUserId = user.currentUser?.uid;

  const heroImageHeight = scrollY.interpolate({
    inputRange: [-HERO_IMAGE_HEIGHT, 0, HERO_IMAGE_HEIGHT],
    outputRange: [HERO_IMAGE_HEIGHT * 1.5, HERO_IMAGE_HEIGHT, HERO_IMAGE_HEIGHT],
    extrapolate: 'clamp',
  });

  const heroImageTranslate = scrollY.interpolate({
    inputRange: [-HERO_IMAGE_HEIGHT, 0, HERO_IMAGE_HEIGHT],
    outputRange: [-HERO_IMAGE_HEIGHT * 0.25, 0, 0],
    extrapolate: 'clamp',
  });

  const headerBackground = scrollY.interpolate({
    inputRange: [0, HERO_IMAGE_HEIGHT - HEADER_HEIGHT],
    outputRange: ['transparent', theme.colors.secondary],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!id) return;
    const loadRestaurant = async () => {
      try {
        const data = await fetchRestaurantById(id as string); // Fetch data using ID
        setRestaurant(data);
        console.log(data?.socials)

        const reviewsData = await fetchReviews(id as string);
        setReviews(reviewsData)

        if (reviewsData.length > 0) {
          const average = reviewsData.reduce((acc, review) => acc + review.rating, 0) / reviewsData.length;
          setAverageRating(Number(average.toFixed(1)));
          setTotalReviews(reviewsData.length)
        }
      } catch (error) {
        console.error('Failed to load restaurant details:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkFavoriteStatus = async () => {
        try {
          const favorites = await fetchFavourites(currentUserId!);
          setIsFavorited(favorites.includes(id as string));
        } catch (error) {
          console.error('Failed to fetch favorites:', error);
        }
      };

    loadRestaurant();
    checkFavoriteStatus();
  }, [id]);

  const toggleFavorite = async () => {
    if (!currentUser) {
        Alert.alert(
            'Sign In Required',
            'You need to sign in to save favourites.',
            [
                { text: 'Cancel', style: 'cancel'},
                {
                    text: 'Sign In',
                    onPress: () => setIsAuthModalVisible(true)
                }
            ]
        );
        return;
    }

    try {
      if (isFavorited) {
        await removeFromFavourites(currentUserId!, restaurant?.id as string);
      } else {
        await addToFavourites(currentUserId!, restaurant?.id as string);
      }
      setIsFavorited(!isFavorited); // Toggle local state
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4E2C1" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load restaurant details.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${restaurant?.name},${restaurant?.address}`
    Linking.openURL(url);
  };

  const handlePhone = (phoneNumber: string) => {
    const options = ['Call', 'Cancel'];
    const destructiveButtonIndex = -1;
    const cancelButtonIndex = 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: `Call ${phoneNumber}`,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          console.log(`Opening ${phoneNumber}`)
          Linking.openURL(`tel:${phoneNumber}`)
        }
      }
    )
  }

  const openSocialLink = (url: string) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open this link.');
        }
      })
      .catch((err) => console.error('Error opening link:', err));
  }

  const renderSocialIcon = (platform: string, link: string) => {
    const icons = {
      facebook: 'facebook',
      instagram: 'instagram',
      tiktok: 'tiktok',
      number: 'phone'
    }

    const handlePress = () => {
      if (platform === 'number') {
        handlePhone(link);
      } else {
        openSocialLink(link);
      }
    }

    return (
      <TouchableOpacity key={platform} onPress={handlePress} style={styles.socialIconContainer}>
        <FontAwesome6
          //@ts-ignore
          name={icons[platform]} size={24} color="#ECDFCC" 
        />
      </TouchableOpacity>
    )
  }

  const openMenu = async () => {
    if (restaurant?.menuUrl) {
      const result = await WebBrowser.openBrowserAsync(restaurant.menuUrl);
      console.log('In-app browser closed', result);
    } else {
      Alert.alert('Menu not available', 'This restaurant has no menu link.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackground, paddingTop: statusBarHeight },
        ]}
      >
        <CircleButton onPress={() => router.back()} />
      </Animated.View>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >

        {/* Hero Image */}
        <Animated.View
          style={[
            styles.heroImageContainer,
            { height: heroImageHeight, transform: [{ translateY: heroImageTranslate }] },
          ]}
        >
          {restaurant.image && (
            <>
              <Image source={{ uri: restaurant.image }} style={styles.heroImage} />
              <View style={styles.heroImageOverlay} />
            </>
          )}
        </Animated.View>
  
        {/* Details Section */}
        <View style={[styles.detailsSection, { backgroundColor: theme.colors.secondary }]}>
          <Text style={[styles.restaurantName, { color: theme.colors.text.primary }]}>
            {restaurant.name}
          </Text>
          <Text style={[styles.categories, { color: theme.colors.text.secondary }]}>
            {restaurant.categories.join(' • ')}
          </Text>
          <View style={[styles.ratingRow, { justifyContent: 'space-between' }]}>
            <View style={styles.ratingRowLeft}>
              <AirbnbRating
                isDisabled
                showRating={false}
                defaultRating={averageRating}
                size={20}
              />
              <Text style={[styles.ratingText, { color: theme.colors.text.muted }]}>
                {averageRating} ({totalReviews} Reviews)
              </Text>
            </View>
            <FavoriteButton isFavorited={isFavorited} onToggle={toggleFavorite} />
          </View>
        </View>
  
        {/* Menu Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.accent }]}
            onPress={openMenu}
          >
            <Text style={[styles.menuButtonText, { color: theme.colors.text.primary }]}>
              View Menu
            </Text>
            <FontAwesome6 name="sheet-plastic" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
  
        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              User Reviews
            </Text>
            <TouchableOpacity onPress={() => router.push(`/reviews/${restaurant.id}`)}>
              <Text style={[styles.seeAllText, { color: theme.colors.accent }]}>
                See All →
              </Text>
            </TouchableOpacity>
          </View>
          {reviews.length > 0 ? (
            <View style={styles.reviewListContainer}>
              <FlashList
                estimatedItemSize={174}
                data={reviews.slice(0, 3)}
                contentContainerStyle={styles.carouselContainer}
                renderItem={({ item }) => (
                  <View style={[styles.reviewCard, { backgroundColor: theme.colors.secondary }]}>
                    <View style={styles.reviewHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <FontAwesome6 name="user-circle" size={20} color={theme.colors.text.primary} />
                        <Text style={[styles.reviewerName, { color: theme.colors.text.primary }]}>
                          Anonymous
                        </Text>
                      </View>
                      <Text style={[styles.reviewTimestamp, { color: theme.colors.text.muted }]}>
                        {new Date(item.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.reviewText, { color: theme.colors.text.secondary }]} numberOfLines={2} ellipsizeMode="tail">
                      {item.review}
                    </Text>
                    {item.images && item.images.length > 0 && (
                      <View style={styles.imageTagContainer}>
                        <Text style={[styles.imageTag, { color: theme.colors.text.muted }]}>
                          Contains Images
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>
              No reviews yet. Be the first to write one!
            </Text>
          )}
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={() => setShowOperatingHours(!showOperatingHours)}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Operating Hours
            </Text>
            <FontAwesome6
              name={showOperatingHours ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          {showOperatingHours && (
            <OperatingHours hoursString={restaurant.hours} />
          )}
        </View>

        {/* Socials */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={() => setShowSocials(!showSocials)}
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
          {showSocials && restaurant.socials && (
            <View style={styles.socialsContainer}>
              {Object.entries(restaurant.socials).map(([platform, link]) =>
                renderSocialIcon(platform, link)
              )}
            </View>
          )}
        </View>

        {/* Call to Action */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.accent }]}
            onPress={openGoogleMaps}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
              Get Directions
            </Text>
          </TouchableOpacity>

          {restaurant?.website && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.accent }]}
              onPress={() => Linking.openURL(restaurant.website)}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
                Make a Reservation
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.writeReviewButton,
              { backgroundColor: theme.colors.accent },
            ]}
            onPress={() => router.push(`/reviews/submit/${restaurant.id}`)}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
              Write a Review
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3D3A',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT + statusBarHeight,
    justifyContent: "center",
    paddingHorizontal: 16,
    zIndex: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E3D3A', // Match the page background
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#2E3D3A', // Match the page background
  },
  errorText: {
    fontSize: 16,
    color: '#ECDFCC',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
    textAlign: 'center',
  },
  goBackText: {
    fontSize: 14,
    color: '#ECDFCC',
    fontFamily: 'Outfit_400Regular',
    textDecorationLine: 'underline',
  },
  heroImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_IMAGE_HEIGHT,
    zIndex: -1,
  },  
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject, // Ensures it covers the entire image
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent black
  },
  detailsSection: {
    marginTop: HERO_IMAGE_HEIGHT,
    padding: 16,
    backgroundColor: '#3D4F4C',
  },
  restaurantName: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#ECDFCC',
    marginBottom: 8,
  },
  categories: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingRowLeft: {
    flexDirection: 'row', 
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#F4A261',
  },
  imageTag: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#F4A261',
    backgroundColor: '#2E3D3A',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  icon: {
    color: "#F4A261"
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#3D4F4C',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#A3C0BB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  writeReviewButton: {
    backgroundColor: '#A3C0BB',
  },
  reviewsSection: {
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  reviewListContainer: {
    flex: 1,
    marginBottom: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
  },
  carouselContainer: {
    paddingHorizontal: 6,
    paddingBottom: 12 // Adds spacing between cards
  },
  reviewCard: {
    width: 240,
    padding: 16,
    backgroundColor: '#3D4F4C',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 20,
    justifyContent: 'space-between',
    height: 145
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#F4E2C1'
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
    marginBottom: 8,
  },
  reviewRating: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#F4A261',
    marginBottom: 4,
  },
  reviewTimestamp: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Outfit_400Regular'
  },
  imageTagContainer: {
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
    marginTop: 8,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  socialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3D4F4C',
    justifyContent: 'center',
    alignItems: 'center'
  },
  socialsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 8
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#A3C0BB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  menuButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  
});

  
export default RestaurantDetails;
