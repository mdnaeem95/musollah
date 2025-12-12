/**
 * SurahItem - Modern Design
 * 
 * Individual surah card with glassmorphism and progress tracking
 * 
 * @version 2.0
 */

import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { Surah } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';

interface SurahProps {
  surah: Surah;
  onPress: (surah: Surah) => void;
  readCount?: number;
  index: number;
}

const SurahItem = ({ surah, onPress, readCount = 0, index }: SurahProps) => {
  const { theme, isDarkMode, textSize } = useTheme();
  const styles = createStyles(theme, textSize);

  const progress = surah.numberOfAyahs > 0 ? readCount / surah.numberOfAyahs : 0;
  const progressPercentage = Math.round(progress * 100);
  const isComplete = progressPercentage === 100;

  return (
    <Pressable onPress={() => onPress(surah)}>
      {({ pressed }) => (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: pressed ? 0.98 : 1 
          }}
          transition={{ 
            type: 'spring', 
            damping: 20,
          }}
          style={{ marginBottom: 12 }}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.container, { backgroundColor: theme.colors.secondary }]}
          >
            {/* Left Section: Number & Names */}
            <View style={styles.leftSection}>
              {/* Surah Number Badge */}
              <View style={[styles.numberBadge, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.surahNumber}>{surah.number}</Text>
              </View>

              {/* Names */}
              <View style={styles.namesContainer}>
                <Text style={styles.englishName}>{surah.englishName}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{surah.englishNameTranslation}</Text>
                  <View style={styles.separator} />
                  <Text style={styles.metaText}>{surah.numberOfAyahs} Ayahs</Text>
                </View>
              </View>
            </View>

            {/* Right Section: Arabic & Progress */}
            <View style={styles.rightSection}>
              {/* Arabic Name */}
              <Text style={styles.arabicName}>{surah.arabicName}</Text>
              
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                {isComplete ? (
                  <View style={[styles.completeBadge, { backgroundColor: theme.colors.text.success + '15' }]}>
                    <FontAwesome6 name="circle-check" size={12} color={theme.colors.text.success} solid />
                    <Text style={[styles.completeText, { color: theme.colors.text.success }]}>
                      Complete
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Progress Bar */}
                    <View style={[styles.progressTrack, { backgroundColor: theme.colors.muted }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${progressPercentage}%`,
                            backgroundColor: theme.colors.accent 
                          }
                        ]} 
                      />
                    </View>
                    {/* Progress Text */}
                    <Text style={styles.progressText}>
                      {readCount}/{surah.numberOfAyahs}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </BlurView>
        </MotiView>
      )}
    </Pressable>
  );
};

const createStyles = (theme: any, textSize: number) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },

    // Left Section
    leftSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    numberBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    surahNumber: {
      fontSize: 16,
      fontFamily: 'Outfit_700Bold',
      color: '#fff',
    },
    namesContainer: {
      flex: 1,
      gap: 4,
    },
    englishName: {
      fontSize: 16,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    metaText: {
      fontSize: 12,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
    separator: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.colors.text.muted,
    },

    // Right Section
    rightSection: {
      alignItems: 'flex-end',
      gap: 8,
      minWidth: 100,
    },
    arabicName: {
      fontSize: 20,
      fontFamily: 'Amiri_400Regular',
      color: theme.colors.text.primary,
    },

    // Progress
    progressContainer: {
      width: '100%',
      alignItems: 'flex-end',
      gap: 4,
    },
    progressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 11,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.secondary,
    },

    // Complete Badge
    completeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    completeText: {
      fontSize: 11,
      fontFamily: 'Outfit_600SemiBold',
    },
  });

export default React.memo(SurahItem);