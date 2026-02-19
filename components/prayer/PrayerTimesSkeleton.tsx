import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const containerWidth = screenWidth * 0.75;

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
    marginTop: 20,
    gap: 15,
    alignItems: 'center',
  },
  skeletonBox: {
    width: containerWidth,
    minHeight: Platform.OS === 'android' ? 45 : 54,
    borderRadius: 15,
    backgroundColor: theme.colors.muted,
  },
});

export default PrayerTimesSkeleton;
