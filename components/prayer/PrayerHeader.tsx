// components/prayer/PrayerHeader.tsx
import React from 'react';
import { ImageBackground, StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface PrayerHeaderProps {
  backgroundImage: any;
}

const PrayerHeader: React.FC<PrayerHeaderProps> = ({ backgroundImage }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={isDarkMode 
          ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']
          : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.5)']
        }
        style={styles.gradient}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height * 0.3,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default PrayerHeader;