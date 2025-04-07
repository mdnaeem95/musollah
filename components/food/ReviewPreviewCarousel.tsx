import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';
import { RestaurantReview } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';
import { MotiView } from 'moti';

interface Props {
  reviews: RestaurantReview[];
  onSeeAll: () => void;
}

const ReviewPreviewCarousel: React.FC<Props> = ({ reviews, onSeeAll }) => {
  const { theme } = useTheme();

  if (reviews.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>
        No reviews yet. Be the first to write one!
      </Text>
    );
  }

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          User Reviews
        </Text>
        <Text
          onPress={onSeeAll}
          style={[styles.seeAllText, { color: theme.colors.accent }]}
        >
          See All →
        </Text>
      </View>

      <FlashList
        estimatedItemSize={160}
        data={reviews.slice(0, 3)}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 80 }}
            style={[styles.card, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome6 name="user-circle" size={20} color={theme.colors.text.primary} />
                <Text style={[styles.reviewerName, { color: theme.colors.text.primary }]}>Anonymous</Text>
              </View>
              <Text style={[styles.timestamp, { color: theme.colors.text.muted }]}>
                {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.text.secondary }]} numberOfLines={2}>
              {item.review}
            </Text>
            {item.images && item.images?.length > 0 && (
              <Text style={[styles.imageTag, { color: theme.colors.text.muted }]}>
                Contains Images
              </Text>
            )}
          </MotiView>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        contentContainerStyle={{ paddingBottom: 10, paddingLeft: 6 }}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    width: 240,
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
    justifyContent: 'space-between',
    height: 145,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  text: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 6,
  },
  imageTag: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    alignSelf: 'flex-start',
  },
});

export default ReviewPreviewCarousel;