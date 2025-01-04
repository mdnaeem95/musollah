import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PrayerTimeItem from './PrayerTimeItem';
import { PrayerTimes } from '../utils/types';

interface PrayerTimesListProps {
  prayerTimes: PrayerTimes | null;
}

const PrayerTimesList = ({ prayerTimes }: PrayerTimesListProps) => {
  const desiredPrayers: (keyof PrayerTimes)[] = [
    'Subuh',
    'Syuruk',
    'Zohor',
    'Asar',
    'Maghrib',
    'Isyak',
  ];

  if (!prayerTimes) {
    return <Text style={styles.loadingText}>Loading prayer times...</Text>;
  }

  return (
    <View style={styles.container}>
      {desiredPrayers.map((prayer) => (
        <PrayerTimeItem
          key={prayer}
          name={prayer as string}
          time={prayerTimes[prayer]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    gap: 15,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
});

export default memo(PrayerTimesList);
