import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Surah } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';
import { ProgressBar } from 'react-native-paper';
import { MotiView } from 'moti';

interface SurahProps {
  surah: Surah;
  onPress: (surah: Surah) => void;
  readCount?: number;
  index: number;
}

const SurahItem = ({ surah, onPress, readCount, index }: SurahProps) => {
  const { theme, textSize } = useTheme();
  const styles = createStyles(theme, textSize);

  const progress = readCount && surah.numberOfAyahs
    ? readCount / surah.numberOfAyahs
    : 0;

  return (
    <Pressable onPress={() => onPress(surah)}>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 10 }}
        style={styles.container}
      >
        <View style={styles.row}>
          {/* Column 1: English name */}
          <View style={styles.columnLeft}>
            <Text style={styles.surahNumber}>{surah.number}</Text>
            <View>
              <Text style={styles.surahInfo}>{surah.englishName}</Text>
              <Text style={styles.surahInfo}>({surah.englishNameTranslation})</Text>
            </View>
          </View>

          {/* Column 2: Progress */}
          <View style={styles.columnCenter}>
            <Text style={styles.progressText}>
              {readCount || 0} / {surah.numberOfAyahs}
            </Text>
            <ProgressBar
              progress={progress}
              color={theme.colors.accent}
              style={styles.progressBar}
            />
          </View>

          {/* Column 3: Arabic name */}
          <View style={styles.columnRight}>
            <Text style={styles.surahArabic}>{surah.arabicName}</Text>
          </View>
        </View>
      </MotiView>
    </Pressable>
  );
};

const createStyles = (theme: any, textSize: any) =>
  StyleSheet.create({
    container: {
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.small,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    columnLeft: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    columnCenter: {
      flex: 0.8,
      justifyContent: 'center',
      marginLeft: 60
    },
    columnRight: {
      flex: 1.2,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    surahNumber: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: textSize - 2,
      color: theme.colors.text.primary,
    },
    surahInfo: {
      fontFamily: 'Outfit_500Medium',
      fontSize: textSize / 2.2,
      color: theme.colors.text.secondary,
    },
    progressText: {
      fontSize: 12,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    progressBar: {
      height: 6,
      borderRadius: 4,
    },
    surahArabic: {
      fontFamily: 'Amiri_400Regular',
      fontSize: textSize - 10,
      color: theme.colors.text.primary,
    },
  });

export default React.memo(SurahItem);