/**
 * Shareable Stats Card Screen
 *
 * Beautiful Ramadan-themed card for sharing progress on social media.
 * Captures card as image using ViewShot, shares via expo-sharing.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import React, { useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import {
  useRamadanStore,
  useFastingLogs,
  useTarawihLogs,
  useQuranKhatamLogs,
} from '../../../stores/useRamadanStore';
import { useRamadanDetection } from '../../../hooks/ramadan/useRamadanDetection';
import { TOTAL_JUZ } from '../../../api/services/ramadan/types/constants';

const ShareScreen = () => {
  const { theme } = useTheme();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  const tracker = useRamadanStore((s) => s.tracker);
  const fastingLogs = useFastingLogs();
  const tarawihLogs = useTarawihLogs();
  const quranKhatamLogs = useQuranKhatamLogs();
  const { data: detection } = useRamadanDetection();

  const currentDay = detection?.currentDay ?? 0;
  const totalDays = tracker?.totalDays ?? 30;

  const stats = useMemo(() => {
    const daysFasted = Object.values(fastingLogs).filter(
      (l) => l.status === 'fasted'
    ).length;
    const tarawihCompleted = Object.values(tarawihLogs).filter(
      (l) => l.prayed
    ).length;
    const juzCompleted = Object.values(quranKhatamLogs).filter(
      (l) => l.completed
    ).length;

    // Fasting streak
    let streak = 0;
    for (let d = currentDay; d >= 1; d--) {
      if (fastingLogs[d]?.status === 'fasted') {
        streak++;
      } else {
        break;
      }
    }

    return { daysFasted, tarawihCompleted, juzCompleted, streak };
  }, [fastingLogs, tarawihLogs, quranKhatamLogs, currentDay]);

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    setIsSharing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const uri = await viewShotRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Ramadan Progress',
        });
      }
    } catch {
      // Sharing cancelled or failed silently
    } finally {
      setIsSharing(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.instruction}>
        Share your Ramadan progress with friends and family
      </Text>

      {/* Shareable Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1.0 }}
        >
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <FontAwesome6 name="moon" size={22} color="#FFD700" solid />
              <Text style={styles.cardTitle}>Ramadan {tracker?.ramadanYear}</Text>
            </View>

            <Text style={styles.cardSubtitle}>
              Day {currentDay} of {totalDays}
            </Text>

            {/* Stats Grid */}
            <View style={styles.cardStats}>
              <View style={styles.cardStatItem}>
                <Text style={styles.cardStatValue}>{stats.daysFasted}</Text>
                <Text style={styles.cardStatLabel}>Days{'\n'}Fasted</Text>
              </View>
              <View style={styles.cardStatDivider} />
              <View style={styles.cardStatItem}>
                <Text style={styles.cardStatValue}>{stats.tarawihCompleted}</Text>
                <Text style={styles.cardStatLabel}>Tarawih{'\n'}Nights</Text>
              </View>
              <View style={styles.cardStatDivider} />
              <View style={styles.cardStatItem}>
                <Text style={styles.cardStatValue}>{stats.juzCompleted}</Text>
                <Text style={styles.cardStatLabel}>Juz{'\n'}Read</Text>
              </View>
            </View>

            {/* Streak */}
            {stats.streak > 0 && (
              <View style={styles.streakBadge}>
                <FontAwesome6 name="fire" size={14} color="#FF6B35" />
                <Text style={styles.streakText}>
                  {stats.streak} day fasting streak
                </Text>
              </View>
            )}

            {/* Progress Bars */}
            <View style={styles.cardProgressSection}>
              <View style={styles.cardProgressRow}>
                <Text style={styles.cardProgressLabel}>Fasting</Text>
                <View style={styles.cardProgressBarBg}>
                  <View
                    style={[
                      styles.cardProgressBarFill,
                      {
                        width: `${Math.round((stats.daysFasted / totalDays) * 100)}%`,
                        backgroundColor: '#10B981',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.cardProgressValue}>
                  {Math.round((stats.daysFasted / totalDays) * 100)}%
                </Text>
              </View>
              <View style={styles.cardProgressRow}>
                <Text style={styles.cardProgressLabel}>Tarawih</Text>
                <View style={styles.cardProgressBarBg}>
                  <View
                    style={[
                      styles.cardProgressBarFill,
                      {
                        width: `${Math.round((stats.tarawihCompleted / totalDays) * 100)}%`,
                        backgroundColor: '#3B82F6',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.cardProgressValue}>
                  {Math.round((stats.tarawihCompleted / totalDays) * 100)}%
                </Text>
              </View>
              <View style={styles.cardProgressRow}>
                <Text style={styles.cardProgressLabel}>Quran</Text>
                <View style={styles.cardProgressBarBg}>
                  <View
                    style={[
                      styles.cardProgressBarFill,
                      {
                        width: `${Math.round((stats.juzCompleted / TOTAL_JUZ) * 100)}%`,
                        backgroundColor: '#8B5CF6',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.cardProgressValue}>
                  {Math.round((stats.juzCompleted / TOTAL_JUZ) * 100)}%
                </Text>
              </View>
            </View>

            {/* Branding */}
            <View style={styles.cardBranding}>
              <Text style={styles.cardBrandingText}>Tracked with Rihlah</Text>
            </View>
          </View>
        </ViewShot>
      </MotiView>

      {/* Share Button */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        disabled={isSharing}
        activeOpacity={0.8}
      >
        {isSharing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <FontAwesome6 name="share-nodes" size={18} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Progress</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.shareHint}>
        Share to WhatsApp, Instagram Stories, or save to gallery
      </Text>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.primary },
    contentContainer: { padding: 16, paddingBottom: 100, alignItems: 'center' },

    instruction: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: 20,
    },

    // Card
    card: {
      width: 320,
      backgroundColor: '#1a1a2e',
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4,
    },
    cardTitle: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 24,
      color: '#FFD700',
    },
    cardSubtitle: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.6)',
      marginBottom: 24,
    },

    // Stats Grid
    cardStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      width: '100%',
    },
    cardStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    cardStatValue: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 32,
      color: '#FFFFFF',
    },
    cardStatLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      lineHeight: 14,
      marginTop: 2,
    },
    cardStatDivider: {
      width: 1,
      height: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },

    // Streak
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 107, 53, 0.15)',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 20,
    },
    streakText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      color: '#FF6B35',
    },

    // Progress Bars
    cardProgressSection: {
      width: '100%',
      gap: 10,
      marginBottom: 24,
    },
    cardProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardProgressLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.6)',
      width: 50,
    },
    cardProgressBarBg: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
    },
    cardProgressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    cardProgressValue: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.7)',
      width: 32,
      textAlign: 'right',
    },

    // Branding
    cardBranding: {
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      width: '100%',
      alignItems: 'center',
    },
    cardBrandingText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.35)',
    },

    // Share Button
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: theme.colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      width: 320,
      marginTop: 20,
    },
    shareButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    shareHint: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: theme.colors.text.muted,
      textAlign: 'center',
      marginTop: 8,
    },
  });

export default ShareScreen;
