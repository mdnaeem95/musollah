import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

const RestaurantCardSkeleton = () => {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{ loop: true, type: 'timing', duration: 1000 }}
      style={styles.card}
    >
      <View style={styles.image} />
      <View style={styles.textBlock} />
      <View style={[styles.textBlock, { width: '60%' }]} />
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    marginRight: 16,
    overflow: 'hidden',
    padding: 10,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  textBlock: {
    height: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginTop: 8,
  },
});

export default RestaurantCardSkeleton;