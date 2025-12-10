/**
 * All Reviews Page (REDESIGNED)
 * 
 * Modern reviews page with enhanced UI, animations, and better image gallery.
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { AirbnbRating } from 'react-native-ratings';
import { FlashList } from '@shopify/flash-list';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../../context/ThemeContext';
import { useRestaurantReviews } from '../../../../api/services/food';
import type { RestaurantReview as UIReview } from '../../../../utils/types';

const { width } = Dimensions.get('window');

function toIsoStringTimestamp(ts: unknown): string {
  if (ts && typeof ts === 'object' && typeof (ts as any).toDate === 'function') {
    return (ts as any).toDate().toISOString();
  }
  if (typeof ts === 'number') return new Date(ts).toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  
  return date.toLocaleDateString('en-SG', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

const AllReviews = () => {
  const { id } = useLocalSearchParams();
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = React.useState<number>(0);
  const [currentImages, setCurrentImages] = React.useState<string[]>([]);

  const { data: reviews = [], isLoading } = useRestaurantReviews(id as string);

  const uiReviews: UIReview[] = React.useMemo(() => {
    const restaurantId = (id as string) ?? '';
    return reviews.map((r: any) => ({
      id: r.id,
      restaurantId,
      userId: r.userId,
      userName: r.userName || 'Anonymous',
      rating: r.rating ?? 0,
      review: r.review ?? r.comment ?? '',
      timestamp: toIsoStringTimestamp(r.timestamp),
      images: Array.isArray(r.images) ? r.images : [],
    }));
  }, [reviews, id]);

  const averageRating = React.useMemo(() => {
    if (uiReviews.length === 0) return 0;
    const sum = uiReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / uiReviews.length;
  }, [uiReviews]);

  const openImageViewer = (images: string[], index: number) => {
    setCurrentImages(images);
    setCurrentImageIndex(index);
    setSelectedImage(images[index]);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    setCurrentImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (currentImageIndex < currentImages.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(currentImages[newIndex]);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(currentImages[newIndex]);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!uiReviews.length) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.emptyContainer}
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6 name="comment-dots" size={48} color={theme.colors.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
            No reviews yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
            Be the first to share your experience!
          </Text>
          <TouchableOpacity
            style={[styles.writeReviewButton, { backgroundColor: theme.colors.accent }]}
            onPress={() => router.push(`/food/reviews/submit/${id}`)}
          >
            <FontAwesome6 name="pen" size={16} color="#fff" />
            <Text style={styles.writeReviewButtonText}>Write a Review</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {/* Header Stats */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.statsCard, { backgroundColor: theme.colors.secondary }]}
        >
          <View style={styles.statsLeft}>
            <Text style={[styles.averageRating, { color: theme.colors.text.primary }]}>
              {averageRating.toFixed(1)}
            </Text>
            <AirbnbRating
              isDisabled
              showRating={false}
              defaultRating={averageRating}
              size={16}
              selectedColor="#FFD700"
              starContainerStyle={{ gap: 2 }}
            />
            <Text style={[styles.reviewCount, { color: theme.colors.text.secondary }]}>
              {uiReviews.length} {uiReviews.length === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
          
          <View style={styles.statsRight}>
            <TouchableOpacity
              style={[styles.writeButton, { backgroundColor: theme.colors.accent }]}
              onPress={() => router.push(`/food/reviews/submit/${id}`)}
            >
              <FontAwesome6 name="pen" size={14} color="#fff" />
              <Text style={styles.writeButtonText}>Write Review</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </MotiView>

      {/* Reviews List */}
      <FlashList
        estimatedItemSize={200}
        data={uiReviews}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              delay: index * 50,
              damping: 20,
            }}
          >
            <BlurView
              intensity={20}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.reviewCard, { backgroundColor: theme.colors.secondary }]}
            >
              {/* User Info */}
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: theme.colors.accent + '20' }]}>
                    <FontAwesome6 name="user" size={20} color={theme.colors.accent} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
                      'Anonymous'
                    </Text>
                    <Text style={[styles.reviewDate, { color: theme.colors.text.muted }]}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </View>
                </View>
                
                {/* Rating */}
                <View style={[styles.ratingBadge, { backgroundColor: '#FFD700' + '20' }]}>
                  <FontAwesome6 name="star" size={14} color="#FFD700" solid />
                  <Text style={[styles.ratingNumber, { color: theme.colors.text.primary }]}>
                    {item.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Review Text */}
              <Text style={[styles.reviewText, { color: theme.colors.text.primary }]}>
                {item.review}
              </Text>

              {/* Review Images */}
              {item.images && item.images.length > 0 && (
                <View style={styles.imagesContainer}>
                  {item.images.slice(0, 4).map((image, imgIndex) => (
                    <TouchableOpacity
                      key={imgIndex}
                      onPress={() => openImageViewer(item.images!, imgIndex)}
                      style={styles.imageWrapper}
                    >
                      <Image source={{ uri: image }} style={styles.thumbnail} />
                      {imgIndex === 3 && item.images!.length > 4 && (
                        <View style={styles.moreImagesOverlay}>
                          <Text style={styles.moreImagesText}>
                            +{item.images!.length - 4}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Review Footer */}
              <View style={styles.reviewFooter}>
                <AirbnbRating
                  isDisabled
                  showRating={false}
                  defaultRating={item.rating}
                  size={16}
                  selectedColor="#FFD700"
                  starContainerStyle={{ gap: 2 }}
                />
              </View>
            </BlurView>
          </MotiView>
        )}
      />

      {/* Image Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={closeImageViewer}
            style={[styles.closeButton, { top: insets.top + 16 }]}
          >
            <View style={styles.closeButtonCircle}>
              <FontAwesome6 name="xmark" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Image */}
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {currentImages.length}
            </Text>
          </View>

          {/* Navigation Buttons */}
          {currentImages.length > 1 && (
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                onPress={prevImage}
                disabled={currentImageIndex === 0}
                style={[
                  styles.navButton,
                  currentImageIndex === 0 && styles.navButtonDisabled,
                ]}
              >
                <FontAwesome6
                  name="chevron-left"
                  size={24}
                  color={currentImageIndex === 0 ? '#666' : '#fff'}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={nextImage}
                disabled={currentImageIndex === currentImages.length - 1}
                style={[
                  styles.navButton,
                  currentImageIndex === currentImages.length - 1 && styles.navButtonDisabled,
                ]}
              >
                <FontAwesome6
                  name="chevron-right"
                  size={24}
                  color={currentImageIndex === currentImages.length - 1 ? '#666' : '#fff'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsLeft: {
    gap: 4,
  },
  averageRating: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
  },
  reviewCount: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
  statsRight: {
    alignItems: 'flex-end',
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  writeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  reviewCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  ratingNumber: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 22,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: (width - 72) / 4,
    height: (width - 72) / 4,
    borderRadius: 8,
  },
  moreImagesOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  reviewFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  writeReviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  navigationButtons: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
});

export default AllReviews;