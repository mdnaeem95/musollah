import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import { useTheme } from '../../context/ThemeContext';

const OverallProgressTracker = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [overallSurahProgress, setOverallSurahProgress] = useState(0);

  useEffect(() => {
    const loadOverallProgress = async () => {
      const readSurahsOverall = await AsyncStorage.getItem('readSurahsOverall');
      const totalSurahsCompleted = readSurahsOverall ? JSON.parse(readSurahsOverall).length : 0;
      setOverallSurahProgress(totalSurahsCompleted);
    };

    loadOverallProgress();
  }, []); // Runs once on mount

  return (
    <View style={styles.overallProgressContainer}>
      <Text style={styles.overallProgressHeader}>Overall Quran Progress</Text>
      <View style={styles.overallProgressRow}>
        <Progress.Bar
          progress={overallSurahProgress / 114} // Total surahs = 114
          height={10}
          color={theme.colors.accent}
          unfilledColor={theme.colors.primary}
          borderWidth={0}
          style={styles.progressBar}
        />
        <Text style={styles.percentageText}>
          {((overallSurahProgress / 114) * 100).toFixed(2)}%
        </Text>
      </View>
      <Text style={[styles.percentageText, { marginTop: 16 }]}>
        {overallSurahProgress} / 114 Surahs Read
      </Text>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    overallProgressContainer: {
      backgroundColor: theme.colors.secondary,
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
      shadowColor: theme.shadows.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.shadows.opacity,
      shadowRadius: theme.shadows.radius,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overallProgressHeader: {
      fontSize: 20,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_600SemiBold',
      marginBottom: 16,
      textAlign: 'center',
    },
    overallProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressBar: {
      marginRight: 10,
      borderRadius: 10,
      overflow: 'hidden',
    },
    percentageText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_500Medium',
    },
  });

export default OverallProgressTracker;
