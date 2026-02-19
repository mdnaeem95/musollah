/**
 * Ramadan Summary
 *
 * Post-Ramadan summary modal showing final stats.
 * Shown once after Ramadan ends, before tab hides.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';
import { useRamadanStats } from '../../hooks/ramadan/useRamadanStats';
import {
  useRamadanStore,
  useHasSeenSummary,
} from '../../stores/useRamadanStore';
import { TOTAL_JUZ } from '../../api/services/ramadan/types/constants';

const RamadanSummary = () => {
  const { theme } = useTheme();
  const stats = useRamadanStats();
  const tracker = useRamadanStore((s) => s.tracker);
  const hasSeenSummary = useHasSeenSummary();
  const markSummarySeen = useRamadanStore((s) => s.markSummarySeen);

  if (!stats || hasSeenSummary || !tracker) return null;

  const styles = createStyles(theme);

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <View style={styles.card}>
            <FontAwesome6 name="moon" size={32} color="#FFD700" solid />
            <Text style={styles.title}>Ramadan Summary</Text>
            <Text style={styles.subtitle}>
              Ramadan {tracker.ramadanYear} — Your Journey
            </Text>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.daysFasted}</Text>
                <Text style={styles.statLabel}>Days Fasted</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.tarawihCompleted}</Text>
                <Text style={styles.statLabel}>Tarawih Nights</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.juzCompleted}/{TOTAL_JUZ}</Text>
                <Text style={styles.statLabel}>Juz Read</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.longestFastingStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
            </View>

            {/* Score */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={styles.scoreValue}>{stats.overallScore}%</Text>
            </View>

            {stats.qadaDaysNeeded > 0 && (
              <View style={styles.qadaNote}>
                <FontAwesome6 name="rotate-left" size={12} color="#8B5CF6" />
                <Text style={styles.qadaText}>
                  You have {stats.qadaDaysNeeded} Qada (makeup) days to complete
                </Text>
              </View>
            )}

            <Text style={styles.duaText}>
              May Allah accept all your ibadah during this blessed month.
              Taqabbalallahu minna wa minkum.
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={markSummarySeen}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Alhamdulillah</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: '#1a1a2e',
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      width: '100%',
      maxWidth: 360,
    },
    title: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 24,
      color: '#FFD700',
      marginTop: 12,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.6)',
      marginBottom: 24,
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      width: '100%',
      marginBottom: 20,
    },
    statItem: {
      width: '46%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
    },
    statValue: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 28,
      color: '#FFFFFF',
    },
    statLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: 2,
    },

    scoreContainer: {
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    scoreLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    scoreValue: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 20,
      color: '#FFD700',
    },

    qadaNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginBottom: 16,
    },
    qadaText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: '#8B5CF6',
    },

    duaText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },

    closeButton: {
      backgroundColor: '#FFD700',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 48,
    },
    closeButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: '#1a1a2e',
    },
  });

export default RamadanSummary;
