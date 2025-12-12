/**
 * BookmarkIcon - Lottie Bookmark Animation
 * 
 * @version 2.0 - Improved wrapper
 */

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface BookmarkIconProps {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: number;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({ 
  isBookmarked, 
  onToggle, 
  size = 40 
}) => {
  const animation = useRef<LottieView>(null);

  useEffect(() => {
    if (isBookmarked) {
      animation.current?.play(0, 60);
    } else {
      animation.current?.reset();
    }

    setTimeout(() => {
      animation.current?.pause();
    }, 1000);
  }, [isBookmarked]);

  return (
    <TouchableOpacity 
      onPress={onToggle} 
      style={styles.container}
      activeOpacity={0.7}
    >
      <LottieView
        ref={animation}
        source={require('../../assets/animations/bookmark.json')}
        loop={false}
        style={{ width: size, height: size }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});

export default BookmarkIcon;