import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';
import { scaleSize } from '../../utils';
import { useTheme } from '../../context/ThemeContext';
import { PrayerName } from '../../utils/types/prayer.types';

interface CurrentPrayerInfoProps {
  currentPrayer: PrayerName | null;
  nextPrayerInfo: {
    nextPrayer: PrayerName;
    timeUntilNextPrayer: string;
  } | null;
}

const CurrentPrayerInfo: React.FC<CurrentPrayerInfoProps> = memo(({
  currentPrayer,
  nextPrayerInfo,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (!currentPrayer || !nextPrayerInfo) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <Text style={styles.currentPrayerText}>
          {currentPrayer}
        </Text>
      </MotiView>
      
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 100 }}
      >
        <Text style={styles.nextPrayerText}>
          {nextPrayerInfo.timeUntilNextPrayer} until {nextPrayerInfo.nextPrayer}
        </Text>
      </MotiView>
    </View>
  );
});

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  currentPrayerText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: scaleSize(28),
    color: 'black',
    textAlign: 'center',
    marginBottom: 8,
  },
  nextPrayerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(16),
    color: 'black',
    textAlign: 'center',
  },
});

export default CurrentPrayerInfo;