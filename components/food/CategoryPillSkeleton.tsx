import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

const CategoryPillSkeleton = () => (
  <MotiView
    from={{ opacity: 0.3 }}
    animate={{ opacity: 1 }}
    transition={{ loop: true, type: 'timing', duration: 1000 }}
    style={styles.pill}
  />
);

const styles = StyleSheet.create({
  pill: {
    width: 80,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
});

export default CategoryPillSkeleton;
