import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { fetchReviews } from "../../../../api/firebase";
import { FontAwesome6 } from "@expo/vector-icons";
import { RestaurantReview } from "../../../../utils/types";
import { AirbnbRating } from "react-native-ratings";

const AllReviews = () => {
  const { id } = useLocalSearchParams(); // Restaurant ID
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4E2C1" />
      </View>
    );
  }

  if (!reviews.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No reviews yet. Be the first to write one!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewText}>{item.review}</Text>
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
});

export default AllReviews;
