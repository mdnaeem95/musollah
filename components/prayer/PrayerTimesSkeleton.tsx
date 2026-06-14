import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const PrayerTimesSkeleton = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const skeletons = Array.from({ length: 6 }); // 6 prayer slots

  return (
    <View style={styles.container}>
      {skeletons.map((_, index) => (
        <MotiView
          key={index}
          from={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{
            loop: true,
            type: 'timing',
            duration: 800,
            delay: index * 80,
          }}
          style={styles.skeletonBox}
        />
      ))}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 10,
    paddingHorizontal: 16,
    width: '100%',
  },
  skeletonBox: {
    width: screenWidth - 32,
    minHeight: Platform.OS === 'android' ? 52 : 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export default PrayerTimesSkeleton;
