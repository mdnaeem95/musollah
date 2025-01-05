import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  currentPrayerText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 24,
    color: '#333333',
    textAlign: 'center',
  },
  nextPrayerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default CurrentPrayerInfo;
