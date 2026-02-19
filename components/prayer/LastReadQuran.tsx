import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { createLogger } from '../../services/logging/logger';
import { scaleSize } from '../../utils';

const logger = createLogger('Last Read Quran');

const LastReadQuran = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const [lastReadAyah, setLastReadAyah] = useState<{ ayahNumber: number; surahNumber: number } | null>(null);

  useEffect(() => {
    const loadLastRead = async () => {
      try {
        const lastRead = await AsyncStorage.getItem('lastReadAyah');
        if (lastRead) {
          setLastReadAyah(JSON.parse(lastRead));
        }
      } catch (error) {
        logger.error('Error fetching last read Quran progress:', error as Error);
      }
    };
    
    loadLastRead();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Last Read Quran</Text>

      {lastReadAyah ? (
        <TouchableOpacity 
          style={styles.quranCard} 
          onPress={() => router.push({ pathname: `/surahs/${lastReadAyah.surahNumber}`, params: { ayahIndex: lastReadAyah.ayahNumber } })}
        >
          <Text style={styles.quranTitle}>Last Read</Text>
          <Text style={styles.quranDetails}>Surah {lastReadAyah.surahNumber}, Ayah {lastReadAyah.ayahNumber}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noDataText}>No recent Quran reading.</Text>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.medium,
      marginBottom: theme.spacing.small
    },
    header: {
      fontSize: scaleSize(18),
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.small,
    },
    quranCard: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginBottom: theme.spacing.small,
      ...theme.shadows.default,
    },
    quranTitle: {
      fontSize: scaleSize(14),
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.primary,
    },
    quranDetails: {
      fontSize: scaleSize(12),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
    noDataText: {
      fontSize: scaleSize(12),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
  });

export default LastReadQuran;
