import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FormattedDistance } from '../../../types/compass.types';

interface CompassInfoProps {
  userHeading: number;
  qiblaHeading: number;
  distance: FormattedDistance | null;
  isNearQibla: boolean;
  accuracyPercentage: number;
  textColor: string;
  accentColor: string;
  mutedColor: string;
}

/**
 * Presentational component for displaying compass information
 * Following SRP - only responsible for displaying info
 */
const CompassInfo: React.FC<CompassInfoProps> = ({
  userHeading,
  qiblaHeading,
  distance,
  isNearQibla,
  accuracyPercentage,
  textColor,
  accentColor,
  mutedColor,
}) => {
  return (
    <>
      {/* Distance hero + headings */}
      <View style={styles.infoContainer}>
        {distance && (
          <View style={styles.distanceContainer}>
            <Text style={[styles.distanceValue, { color: accentColor }]}>
              {distance.km.toLocaleString()} km
            </Text>
            <Text style={[styles.distanceLabel, { color: mutedColor }]}>
              from Mecca
            </Text>
          </View>
        )}

        <View style={styles.headingsRow}>
          <View style={styles.headingItem}>
            <Text style={[styles.headingValue, { color: textColor }]}>
              {Math.round(userHeading)}°
            </Text>
            <Text style={[styles.headingLabel, { color: mutedColor }]}>Heading</Text>
          </View>
          <View style={[styles.headingDivider, { backgroundColor: mutedColor + '30' }]} />
          <View style={styles.headingItem}>
            <Text style={[styles.headingValue, { color: accentColor }]}>
              {Math.round(qiblaHeading)}°
            </Text>
            <Text style={[styles.headingLabel, { color: mutedColor }]}>Qibla</Text>
          </View>
        </View>

        <Text style={[styles.instructionText, { color: mutedColor }]} accessibilityRole="text">
          {isNearQibla ? 'You are facing the Qibla ✓' : 'Align the arrow with the Kaabah'}
        </Text>
      </View>

      {/* Accuracy footer */}
      <View style={styles.footerContainer}>
        <Text style={[styles.accuracyText, { color: mutedColor }]} accessibilityRole="text">
          Accuracy {accuracyPercentage}%
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  distanceContainer: {
    alignItems: 'center',
    gap: 2,
  },
  distanceValue: {
    fontFamily: 'Outfit_300Light',
    fontSize: 44,
    letterSpacing: -1,
    textAlign: 'center',
  },
  distanceLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headingItem: {
    alignItems: 'center',
    gap: 3,
  },
  headingValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 20,
    textAlign: 'center',
  },
  headingLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headingDivider: {
    width: 1,
    height: 32,
    borderRadius: 1,
  },
  instructionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  accuracyText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default memo(CompassInfo);