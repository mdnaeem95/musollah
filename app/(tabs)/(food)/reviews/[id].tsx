import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { AirbnbRating } from 'react-native-ratings';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../../../context/ThemeContext';
import { useRestaurantReviews } from '../../../../api/services/food';
import type { RestaurantReview as UIReview } from '../../../../utils/types';

function toIsoStringTimestamp(ts: unknown): string {
  if (ts && typeof ts === 'object' && typeof (ts as any).toDate === 'function') {
    return (ts as any).toDate().toISOString();
  }
  if (typeof ts === 'number') return new Date(ts).toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

const AllReviews = () => {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();

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
      rating: r.rating ?? 0,
      review: r.review ?? r.comment ?? '',          // 👈 support legacy `comment`
      timestamp: toIsoStringTimestamp(r.timestamp), // 👈 ensure ISO string
      images: Array.isArray(r.images) ? r.images : [],
    }));
  }, [reviews, id]);

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
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
      </View>
    );
  }

  if (!uiReviews.length) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.emptyText, { color: theme.colors.text.primary }]}>
          No reviews yet. Be the first to write one!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <FlashList
        estimatedItemSize={138}
        data={uiReviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.reviewCard, { backgroundColor: theme.colors.secondary }]}>
            <Text style={[styles.reviewText, { color: theme.colors.text.primary }]}>
              {item.review}
            </Text>
            {item.images && item.images.length > 0 && (
              <View style={styles.imagesContainer}>
                {item.images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImageViewer(item.images!, index)}
                  >
                    <Image source={{ uri: image }} style={styles.thumbnail} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.reviewFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <AirbnbRating
                  isDisabled
                  showRating={false}
                  defaultRating={item.rating}
                  size={14}
                />
                <Text style={[styles.reviewRating, { color: theme.colors.text.primary }]}>
                  {item.rating}
                </Text>
              </View>
              <Text style={[styles.reviewTimestamp, { color: theme.colors.text.muted }]}>
                {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      />

      <Modal visible={!!selectedImage} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={closeImageViewer} style={styles.closeButton}>
            <FontAwesome6 name="xmark" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
          )}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              onPress={prevImage}
              disabled={currentImageIndex === 0}
            >
              <FontAwesome6
                name="chevron-left"
                size={36}
                color={currentImageIndex === 0 ? theme.colors.text.muted : theme.colors.text.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextImage}
              disabled={currentImageIndex === currentImages.length - 1}
            >
              <FontAwesome6
                name="chevron-right"
                size={36}
                color={
                  currentImageIndex === currentImages.length - 1
                    ? theme.colors.text.muted
                    : theme.colors.text.primary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewRating: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  reviewTimestamp: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  navigationButtons: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
});

export default AllReviews;