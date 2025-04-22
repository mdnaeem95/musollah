import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MotiView } from 'moti';
import { ProgressBar } from 'react-native-paper';

interface JuzItemProps {
  number: number;
  start: { surah: number; ayah: number };
  end: { surah: number; ayah: number };
  readCount?: number;
  totalAyahs?: number;
  onPress?: (juzNumber: number) => void;
  index: number
}

const JuzItem = ({ number, onPress, start, end, readCount = 0, totalAyahs = 0, index }: JuzItemProps) => {
  const { theme, textSize } = useTheme();
  const styles = createStyles(theme, textSize);

  const progress = totalAyahs ? readCount / totalAyahs : 0;

  return (
    <Pressable onPress={() => onPress?.(number)}>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index < 10 ? index * 40 : 0, }}
        style={styles.container}
      >
        <View style={styles.row}>
          {/* Column 1: Juz number */}
          <View style={styles.columnLeft}>
            <Text style={styles.juzLabel}>Juz</Text>
            <Text style={styles.juzNumber}>{number}</Text>
          </View>

          {/* Column 2: Ayah range + Progress */}
          <View style={styles.columnCenter}>
            <Text style={styles.rangeText}>
              {start.surah}:{start.ayah} → {end.surah}:{end.ayah}
            </Text>
            <Text style={styles.progressText}>
              {readCount} / {totalAyahs} ayahs
            </Text>
            <ProgressBar
              progress={progress}
              color={theme.colors.accent}
              style={styles.progressBar}
            />
          </View>
        </View>
      </MotiView>
    </Pressable>
  );
};

const createStyles = (theme: any, textSize: number) =>
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
      flex: 2,
      justifyContent: 'center',
      marginLeft: 40,
    },
    juzLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: textSize - 2,
      color: theme.colors.text.secondary,
    },
    juzNumber: {
      fontFamily: 'Outfit_700Bold',
      fontSize: textSize,
      color: theme.colors.text.primary,
    },
    rangeText: {
      fontSize: textSize / 2,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
    progressText: {
      fontSize: textSize / 2,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    progressBar: {
      height: 6,
      borderRadius: 4,
    },
  });

export default React.memo(JuzItem);