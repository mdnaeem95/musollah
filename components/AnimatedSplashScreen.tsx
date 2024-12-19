import React from 'react';
import { View, Text, Animated } from 'react-native';

const AnimatedSplashScreen = ({ animatedStyle }: any) => {
  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#2E3D3A',
            zIndex: 1,
          },
          animatedStyle,
        ]}
      />
      <Text style={{ color: 'white', textAlign: 'center', marginTop: '50%' }}>
        Setting up the app...
      </Text>
    </View>
  );
};

export default AnimatedSplashScreen;
