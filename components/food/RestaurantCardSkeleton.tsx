import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

const RestaurantCardSkeleton = () => (
  <MotiView
    from={{ opacity: 0.3 }}
    animate={{ opacity: 0.7 }}
    transition={{ loop: true, type: 'timing', duration: 900 }}
    style={styles.card}
  >
    <View style={styles.image} />
    <View style={styles.lines}>
      <View style={styles.line} />
      <View style={[styles.line, { width: '65%' }]} />
      <View style={[styles.line, { width: '45%', marginTop: 4 }]} />
    </View>
  </MotiView>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  lines: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  line: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    width: '80%',
  },
});

export default RestaurantCardSkeleton;
