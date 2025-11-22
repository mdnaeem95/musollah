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
      {/* Header Information */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.headingText, { color: textColor }]}
          accessibilityRole="text"
        >
          Your heading: {Math.round(userHeading)}°
        </Text>
        <Text
          style={[styles.headingText, { color: textColor }]}
          accessibilityRole="text"
        >
          Qibla heading: {Math.round(qiblaHeading)}°
        </Text>
        
        {/* Distance Display */}
        {distance && (
          <View style={styles.distanceContainer}>
            <Text style={[styles.distanceLabel, { color: textColor }]}>
              Distance to Mecca
            </Text>
            <Text style={[styles.distanceValue, { color: accentColor }]}>
              {distance.km.toLocaleString()} km ({distance.miles.toLocaleString()} mi)
            </Text>
          </View>
        )}

        <Text
          style={[styles.instructionText, { color: mutedColor }]}
          accessibilityRole="text"
        >
          When the arrow points to the Kaabah, you're facing Qiblah.
        </Text>
      </View>

      {/* Footer Information */}
      <View style={styles.footerContainer}>
        <Text
          style={[styles.accuracyText, { color: mutedColor }]}
          accessibilityRole="text"
        >
          Accuracy: {accuracyPercentage}%
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  headingText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  distanceContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  distanceLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  distanceValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  instructionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  foundText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  accuracyText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
});

export default memo(CompassInfo);