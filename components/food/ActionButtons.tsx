import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MotiView } from 'moti';

interface Props {
  restaurantId: string;
  address: string;
  name: string;
  website?: string;
}

const ActionButtons: React.FC<Props> = ({ restaurantId, address, name, website }) => {
  const router = useRouter();
  const { theme } = useTheme();

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${name},${address}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.wrapper}>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 50 }}
      >
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.accent }]} onPress={openMaps}>
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>Get Directions</Text>
        </TouchableOpacity>
      </MotiView>

      {website && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
        >
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.accent }]}
            onPress={() => Linking.openURL(website)}
          >
            <Text style={[styles.text, { color: theme.colors.text.primary }]}>Make a Reservation</Text>
          </TouchableOpacity>
        </MotiView>
      )}

      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 150 }}
      >
        <TouchableOpacity
          style={[styles.button, styles.reviewButton, { backgroundColor: theme.colors.accent }]}
          onPress={() => router.push(`/reviews/submit/${restaurantId}`)}
        >
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>Write a Review</Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    marginBottom: 32,
    gap: 12,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  reviewButton: {
    marginBottom: 0,
  },
});

export default ActionButtons;