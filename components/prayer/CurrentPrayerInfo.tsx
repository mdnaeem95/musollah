import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { scaleSize } from '../../utils';
import { useTheme } from '../../context/ThemeContext';

interface CurrentPrayerInfoProps {
  currentPrayer: string;
  nextPrayerInfo: {
    nextPrayer: string;
    timeUntilNextPrayer: string;
  } | null;
}

const CurrentPrayerInfo = ({
  currentPrayer,
  nextPrayerInfo,
}: CurrentPrayerInfoProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (!currentPrayer || !nextPrayerInfo) {
    return null; // Render nothing if data is missing
  }

  return (
    <View style={styles.container}>
      <Text style={styles.currentPrayerText}>{currentPrayer}</Text>
      <Text style={styles.nextPrayerText}>
        {nextPrayerInfo.timeUntilNextPrayer} until {nextPrayerInfo.nextPrayer}
      </Text>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  currentPrayerText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: scaleSize(24),
    lineHeight: 30,
    color: "#000000",
    textAlign: 'center',
  },
  nextPrayerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: scaleSize(14),
    color: "#000000",
    textAlign: 'center',
    marginTop: 5,
  },
});

export default CurrentPrayerInfo;
