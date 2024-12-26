import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { fetchReviews } from "../../../../api/firebase";
import { FontAwesome6 } from "@expo/vector-icons";
import { RestaurantReview } from "../../../../utils/types";
import { AirbnbRating } from "react-native-ratings";
import { FlashList } from "@shopify/flash-list";

const AllReviews = () => {
  const { id } = useLocalSearchParams(); // Restaurant ID
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await fetchReviews(id as string);
        setReviews(data);
      } catch (error) {
        console.error("Failed to load reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [id]);

  const openImageViewer = (images: string[], index: number) => {
    setSelectedImage(images[index]);
    setCurrentImageIndex(index);
  }

  const closeImageViewer = () => {
    setSelectedImage(null);
  }

  const nextImage = (images: string[]) => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prevIndex) => prevIndex + 1);
      setSelectedImage(images[currentImageIndex + 1]);
    }
  }

  const prevImage = (images: string[]) => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prevIndex) => prevIndex - 1);
      setSelectedImage(images[currentImageIndex -1])
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F4E2C1" />
      </View>
    );
  }

  if (!reviews.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No reviews yet. Be the first to write one!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        estimatedItemSize={138}
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewText}>{item.review}</Text>
            {item.images && item.images.length > 0 && (
              <View style={styles.imagesContainer}>
                {item.images.map((image, index) => (
                  <TouchableOpacity key={index} onPress={() => openImageViewer(item.images!, index)}>
                    <Image source={{ uri: image }} style={styles.thumbnail} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.reviewFooter}>
              <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: "center", gap: 5 }}>
                <AirbnbRating 
                  isDisabled
                  showRating={false}
                  defaultRating={item.rating}
                  size={14}
                  />
                <Text style={styles.reviewRating}>
                  {item.rating > 1 ? `${item.rating}` : `${item.rating}`}
                </Text>
              </View>
              <Text style={styles.reviewTimestamp}>
                {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />

      {/* FULLSCREEN IMAGE VIEWER */}
      <Modal visible={!!selectedImage} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={closeImageViewer} style={styles.closeButton}>
            <FontAwesome6 name="xmark" size={24} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage}} style={styles.fullScreenImage} />
          )}
          <View style={styles.navigationButtons}>
            <TouchableOpacity 
              onPress={() => prevImage(reviews.find(r => r.images?.includes(selectedImage!))?.images || [])}
              disabled={currentImageIndex === 0}
            >
              <FontAwesome6 name="chevron-left" size={36} color={currentImageIndex === 0 ? "#999" : "#FFF"} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => nextImage(reviews.find(r => r.images?.includes(selectedImage!))?.images || [])}
              disabled={currentImageIndex === (reviews.find(r => r.images?.includes(selectedImage!))?.images || []).length - 1}
            >
              <FontAwesome6 name="chevron-right" size={36} color={currentImageIndex === (reviews.find(r => r.images?.includes(selectedImage!))?.images || []).length - 1 ? "#999" : "#FFF"} />
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
    backgroundColor: "#2E3D3A",
  },
  title: {
    fontSize: 20,
    fontFamily: "Outfit_600SemiBold",
    color: "#ECDFCC",
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: "#3D4F4C",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#ECDFCC",
    marginBottom: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 5
  },
  reviewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    color: "#F4A261",
  },
  reviewRating: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#ECDFCC",
  },
  reviewTimestamp: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#ECDFCC",
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullScreenImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain'
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10
  },
  navigationButtons: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%'
  }
});

export default AllReviews;
