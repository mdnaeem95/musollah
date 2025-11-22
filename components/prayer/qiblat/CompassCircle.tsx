import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import { COMPASS_SIZE } from '../../../constants/compass.constants';

interface CompassCircleProps {
  backgroundProgress: Animated.SharedValue<number>;
  arrowAnimatedStyle: any;
  kaabahAnimatedStyle: any;
  isNearQibla: boolean;
  backgroundColor: string;
  accentColor: string;
  borderColor: string;
}

/**
 * Presentational component for the compass circle
 * Following SRP - only responsible for rendering the compass visual
 */
const CompassCircle: React.FC<CompassCircleProps> = ({
  backgroundProgress,
  arrowAnimatedStyle,
  kaabahAnimatedStyle,
  isNearQibla,
  backgroundColor,
  accentColor,
  borderColor,
}) => {
  // Animated background color
  const circleAnimatedStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      backgroundProgress.value,
      [0, 1],
      [backgroundColor, accentColor]
    );
    
    return {
      backgroundColor: bgColor,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          circleAnimatedStyle,
          { borderColor },
        ]}
        accessibilityRole="image"
        accessibilityLabel={`Compass showing ${isNearQibla ? 'Qibla direction found' : 'searching for Qibla direction'}`}
      >
        {/* Kaabah Icon */}
        <Animated.Image
          source={require('../../../assets/kaabah.png')}
          style={[styles.kaabahIcon, kaabahAnimatedStyle]}
          accessibilityRole="image"
          accessibilityLabel="Kaabah direction indicator"
        />
        
        {/* Compass Arrow */}
        <Animated.Image
          source={require('../../../assets/arrow-up.png')}
          style={[styles.compassArrow, arrowAnimatedStyle]}
          accessibilityRole="image"
          accessibilityLabel="Direction arrow"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: 30
  },
  circle: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  kaabahIcon: {
    position: 'absolute',
    top: -45,
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  compassArrow: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
});

export default memo(CompassCircle);