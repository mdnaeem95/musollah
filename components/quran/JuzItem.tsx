/**
 * JuzItem - Modern Design
 * 
 * Individual juz card with glassmorphism and progress tracking
 * 
 * @version 2.0
 */

import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface JuzItemProps {
  number: number;
  start: { surah: number; ayah: number };
  end: { surah: number; ayah: number };
  readCount?: number;
  totalAyahs?: number;
  onPress?: (juzNumber: number) => void;
  index: number;
}

const JuzItem = ({ 
  number, 
  onPress, 
  start, 
  end, 
  readCount = 0, 
  totalAyahs = 0, 
  index 
}: JuzItemProps) => {
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme);

  const progress = totalAyahs > 0 ? readCount / totalAyahs : 0;
  const progressPercentage = Math.round(progress * 100);
  const isComplete = progressPercentage === 100;

  return (
    <Pressable onPress={() => onPress?.(number)}>
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
            {/* Left Section: Juz Badge */}
            <View style={[styles.juzBadge, { backgroundColor: theme.colors.accent + '15' }]}>
              <Text style={styles.juzLabel}>JUZ</Text>
              <Text style={[styles.juzNumber, { color: theme.colors.accent }]}>{number}</Text>
            </View>

            {/* Middle Section: Range & Progress */}
            <View style={styles.middleSection}>
              {/* Range */}
              <View style={styles.rangeContainer}>
                <FontAwesome6 name="book-open" size={12} color={theme.colors.text.secondary} />
                <Text style={styles.rangeText}>
                  Surah {start.surah}:{start.ayah} → {end.surah}:{end.ayah}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
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
                <Text style={styles.progressText}>
                  {readCount}/{totalAyahs} ayahs ({progressPercentage}%)
                </Text>
              </View>
            </View>

            {/* Right Section: Status */}
            <View style={styles.rightSection}>
              {isComplete ? (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.text.success }]}>
                  <FontAwesome6 name="check" size={16} color="#fff" />
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.accent }]}>
                  <FontAwesome6 name="chevron-right" size={14} color="#fff" />
                </View>
              )}
            </View>
          </BlurView>
        </MotiView>
      )}
    </Pressable>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },

    // Juz Badge
    juzBadge: {
      width: 60,
      height: 60,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
    },
    juzLabel: {
      fontSize: 10,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.secondary,
      letterSpacing: 0.5,
    },
    juzNumber: {
      fontSize: 24,
      fontFamily: 'Outfit_700Bold',
    },

    // Middle Section
    middleSection: {
      flex: 1,
      gap: 8,
    },
    rangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rangeText: {
      fontSize: 13,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.secondary,
    },

    // Progress
    progressContainer: {
      gap: 4,
    },
    progressTrack: {
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

    // Right Section
    rightSection: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
  });

export default React.memo(JuzItem);