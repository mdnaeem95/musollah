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
  isRamadanMode?: boolean;
}

const CurrentPrayerInfo: React.FC<CurrentPrayerInfoProps> = ({
  currentPrayer,
  nextPrayerInfo,
  isRamadanMode = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, isRamadanMode);

  if (!currentPrayer || !nextPrayerInfo) {
    return null; // Render nothing if data is missing
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.currentPrayerText, isRamadanMode && styles.currentPrayerTextRamadan]}>
        {currentPrayer}
      </Text>
      <Text style={[styles.nextPrayerText, isRamadanMode && styles.nextPrayerTextRamadan]}>
        {nextPrayerInfo.timeUntilNextPrayer} until {nextPrayerInfo.nextPrayer}
      </Text>
    </View>
  );
};

const createStyles = (theme: any, isRamadanMode: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      marginVertical: 10,
    },
    currentPrayerText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: scaleSize(24),
      lineHeight: 30,
      color: isRamadanMode ? theme.colors.text.primary : "#000000",
      textAlign: 'center',
    },
    nextPrayerText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: scaleSize(14),
      color: isRamadanMode ? theme.colors.text.primary : "#000000",
      textAlign: 'center',
      marginTop: 5,
    },
    // Smaller font sizes for Ramadan mode
    currentPrayerTextRamadan: {
      fontSize: scaleSize(18),
      lineHeight: scaleSize(22),
    },
    nextPrayerTextRamadan: {
      fontSize: scaleSize(10),
      marginTop: 3,
    },
  });

export default CurrentPrayerInfo;
