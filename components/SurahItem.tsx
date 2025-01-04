import React, { useContext } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surah } from '../utils/types';
import { ThemeContext } from '../context/ThemeContext';

interface SurahProps {
  surah: Surah;
  onPress: (surah: Surah) => void;
}

const SurahItem = ({ surah, onPress }: SurahProps) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const styles = createStyles(activeTheme);

  return (
    <TouchableOpacity onPress={() => onPress(surah)}>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.surahNumber}>{surah.number}</Text>
            <View>
              <Text style={styles.surahInfo}>{surah.englishName}</Text>
              <Text style={styles.surahInfo}>({surah.englishNameTranslation})</Text>
            </View>
          </View>

          <View style={styles.surahNameContainer}>
            <Text style={styles.surahName}>{surah.arabicName}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingVertical: theme.spacing.small,
      width: '100%',
    },
    contentContainer: {
      height: 55,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
    },
    textContainer: {
      flexDirection: 'row',
      gap: theme.spacing.small,
      alignItems: 'center',
    },
    surahNumber: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: theme.fontSizes.xxLarge,
      lineHeight: 45,
      color: theme.colors.text.primary,
    },
    surahInfo: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.medium,
      lineHeight: 18,
      color: theme.colors.text.secondary,
    },
    surahNameContainer: {
      top: 5,
    },
    surahName: {
      fontFamily: 'Amiri_400Regular',
      fontSize: theme.fontSizes.xLarge,
      textAlign: 'right',
      color: theme.colors.text.primary,
    },
  });

export default SurahItem;
