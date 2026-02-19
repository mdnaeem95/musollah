/**
 * Tarawih Logger Screen
 *
 * Track nightly Tarawih prayers during Ramadan.
 * Log whether prayed at mosque or home.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import { useRamadanStore, useTarawihLogs } from '../../../stores/useRamadanStore';
import { useRamadanDetection } from '../../../hooks/ramadan/useRamadanDetection';
import { LAYLATUL_QADR_NIGHTS, LAST_TEN_NIGHTS_START } from '../../../api/services/ramadan/types/constants';
import type { TarawihLocation } from '../../../api/services/ramadan/types';

const TarawihLogger = () => {
  const { theme } = useTheme();
  const tracker = useRamadanStore((s) => s.tracker);
  const tarawihLogs = useTarawihLogs();
  const logTarawihDay = useRamadanStore((s) => s.logTarawihDay);
  const { data: detection } = useRamadanDetection();

  const [selectedNight, setSelectedNight] = useState<number | null>(null);
  const [location, setLocation] = useState<TarawihLocation>('mosque');

  const currentDay = detection?.currentDay ?? 0;
  const totalDays = tracker?.totalDays ?? 30;

  const stats = useMemo(() => {
    const logs = Object.values(tarawihLogs);
    const completed = logs.filter((l) => l.prayed).length;
    const atMosque = logs.filter((l) => l.prayed && l.location === 'mosque').length;
    const atHome = logs.filter((l) => l.prayed && l.location === 'home').length;
    return { completed, atMosque, atHome };
  }, [tarawihLogs]);

  const handleNightPress = useCallback((night: number) => {
    if (night > currentDay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNight(night);
    const existing = tarawihLogs[night];
    if (existing) {
      setLocation(existing.location ?? 'mosque');
    } else {
      setLocation('mosque');
    }
  }, [currentDay, tarawihLogs]);

  const handleSave = useCallback((prayed: boolean) => {
    if (selectedNight === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const startDate = tracker?.ramadanStartGregorian ?? '';
    const start = new Date(startDate);
    const nightDate = new Date(start);
    nightDate.setDate(start.getDate() + selectedNight - 1);
    const gregorianDate = nightDate.toISOString().split('T')[0];

    logTarawihDay(selectedNight, gregorianDate, prayed, prayed ? location : undefined);
    setSelectedNight(null);
  }, [selectedNight, location, tracker, logTarawihDay]);

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats Header */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={styles.statsHeader}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{stats.completed}</Text>
            <Text style={styles.mainStatLabel}>/{totalDays} nights</Text>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <FontAwesome6 name="mosque" size={14} color={theme.colors.accent} />
              <Text style={styles.breakdownText}>Mosque: {stats.atMosque}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <FontAwesome6 name="house" size={14} color={theme.colors.accent} />
              <Text style={styles.breakdownText}>Home: {stats.atHome}</Text>
            </View>
          </View>
        </View>
      </MotiView>

      {/* Night List */}
      {Array.from({ length: totalDays }, (_, i) => {
        const night = i + 1;
        const log = tarawihLogs[night];
        const isFuture = night > currentDay;
        const isToday = night === currentDay;
        const isSpecial = (LAYLATUL_QADR_NIGHTS as readonly number[]).includes(night);
        const isLastTen = night >= LAST_TEN_NIGHTS_START;

        return (
          <MotiView
            key={night}
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300, delay: i * 30 }}
          >
            <TouchableOpacity
              style={[
                styles.nightRow,
                isToday && styles.nightRowToday,
                isLastTen && styles.nightRowLastTen,
                isFuture && styles.nightRowFuture,
              ]}
              onPress={() => handleNightPress(night)}
              disabled={isFuture}
              activeOpacity={0.7}
            >
              <View style={styles.nightLeft}>
                <Text style={[styles.nightNumber, isFuture && styles.nightNumberFuture]}>
                  Night {night}
                </Text>
                {isSpecial && (
                  <View style={styles.specialBadge}>
                    <FontAwesome6 name="star" size={10} color="#FFD700" solid />
                    <Text style={styles.specialText}>Laylatul Qadr</Text>
                  </View>
                )}
              </View>
              <View style={styles.nightRight}>
                {log?.prayed ? (
                  <View style={styles.prayedBadge}>
                    <FontAwesome6 name="check" size={12} color="#10B981" />
                    <Text style={styles.prayedText}>
                      {log.location === 'mosque' ? 'Mosque' : 'Home'}
                    </Text>
                  </View>
                ) : log && !log.prayed ? (
                  <FontAwesome6 name="xmark" size={14} color="#EF4444" />
                ) : !isFuture ? (
                  <Text style={styles.notLoggedText}>Tap to log</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          </MotiView>
        );
      })}

      {/* Log Modal */}
      <Modal
        visible={selectedNight !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedNight(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Night {selectedNight}</Text>

            <Text style={styles.modalSubtitle}>Where did you pray?</Text>
            <View style={styles.locationRow}>
              <TouchableOpacity
                style={[
                  styles.locationOption,
                  location === 'mosque' && styles.locationOptionActive,
                ]}
                onPress={() => setLocation('mosque')}
              >
                <FontAwesome6
                  name="mosque"
                  size={20}
                  color={location === 'mosque' ? theme.colors.accent : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.locationText,
                    location === 'mosque' && styles.locationTextActive,
                  ]}
                >
                  Mosque
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.locationOption,
                  location === 'home' && styles.locationOptionActive,
                ]}
                onPress={() => setLocation('home')}
              >
                <FontAwesome6
                  name="house"
                  size={20}
                  color={location === 'home' ? theme.colors.accent : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.locationText,
                    location === 'home' && styles.locationTextActive,
                  ]}
                >
                  Home
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.missedButton}
                onPress={() => handleSave(false)}
              >
                <Text style={styles.missedButtonText}>Missed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.prayedButton}
                onPress={() => handleSave(true)}
              >
                <Text style={styles.prayedButtonText}>Prayed</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => setSelectedNight(null)}
            >
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.primary },
    contentContainer: { padding: 16, paddingBottom: 100 },

    statsHeader: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
    },
    mainStat: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
    mainStatValue: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 36,
      color: theme.colors.accent,
    },
    mainStatLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 16,
      color: theme.colors.text.secondary,
    },
    breakdownRow: { flexDirection: 'row', gap: 24 },
    breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    breakdownText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: theme.colors.text.secondary,
    },

    nightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.secondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    nightRowToday: { borderWidth: 2, borderColor: theme.colors.accent },
    nightRowLastTen: { borderLeftWidth: 3, borderLeftColor: '#FFD700' },
    nightRowFuture: { opacity: 0.4 },
    nightLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    nightNumber: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 15,
      color: theme.colors.text.primary,
    },
    nightNumberFuture: { color: theme.colors.text.muted },
    specialBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FFD70020',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    specialText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 10,
      color: '#B8860B',
    },
    nightRight: { flexDirection: 'row', alignItems: 'center' },
    prayedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    prayedText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: '#10B981',
    },
    notLoggedText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: theme.colors.text.muted,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      alignItems: 'center',
    },
    modalTitle: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 22,
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 20,
    },
    locationRow: { flexDirection: 'row', gap: 16, marginBottom: 24, width: '100%' },
    locationOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 20,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.text.muted,
    },
    locationOptionActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accent + '10',
    },
    locationText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    locationTextActive: { color: theme.colors.accent },
    modalActions: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
    missedButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#EF444420',
      alignItems: 'center',
    },
    missedButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      color: '#EF4444',
    },
    prayedButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
    },
    prayedButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      color: '#FFFFFF',
    },
    cancelLink: { padding: 10 },
    cancelLinkText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.muted,
    },
  });

export default TarawihLogger;
