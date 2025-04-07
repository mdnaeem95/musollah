import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

interface Props {
  imageUrl: string;
  animatedStyle: any; // Reanimated's shared animated style
}

const HeroImage: React.FC<Props> = ({ imageUrl, animatedStyle }) => (
  <Animated.View style={[styles.container, animatedStyle]}>
    <Image source={{ uri: imageUrl }} style={styles.image} />
    <View style={styles.overlay} />
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default HeroImage;