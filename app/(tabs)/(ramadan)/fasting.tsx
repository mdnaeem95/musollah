/**
 * Fasting Tracker Screen
 *
 * 30-day calendar grid for logging daily fasting status.
 * States: Fasted / Missed (with reason) / Excused / Not logged
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
  TextInput,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import {
  useRamadanStore,
  useFastingLogs,
} from '../../../stores/useRamadanStore';
import { useRamadanDetection } from '../../../hooks/ramadan/useRamadanDetection';
import type { FastingStatus, MissedReason } from '../../../api/services/ramadan/types';

const FastingTracker = () => {
  const { theme } = useTheme();
  const tracker = useRamadanStore((s) => s.tracker);
  const fastingLogs = useFastingLogs();
  const logFastingDay = useRamadanStore((s) => s.logFastingDay);
  const { data: detection } = useRamadanDetection();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<FastingStatus>('fasted');
  const [selectedReason, setSelectedReason] = useState<MissedReason>('illness');
  const [notes, setNotes] = useState('');

  const currentDay = detection?.currentDay ?? 0;
  const totalDays = tracker?.totalDays ?? 30;

  // Compute stats
  const stats = useMemo(() => {
    const logs = Object.values(fastingLogs);
    const fasted = logs.filter((l) => l.status === 'fasted').length;
    const missed = logs.filter((l) => l.status === 'missed').length;
    const excused = logs.filter((l) => l.status === 'excused').length;

    // Calculate streak
    let streak = 0;
    for (let d = currentDay; d >= 1; d--) {
      if (fastingLogs[d]?.status === 'fasted') {
        streak++;
      } else {
        break;
      }
    }

    return { fasted, missed, excused, qada: missed, streak };
  }, [fastingLogs, currentDay]);

  const handleDayPress = useCallback((day: number) => {
    if (day > currentDay) return; // Can't log future days
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(day);
    const existing = fastingLogs[day];
    if (existing) {
      setSelectedStatus(existing.status);
      setSelectedReason((existing.missedReason as MissedReason) ?? 'illness');
      setNotes(existing.notes ?? '');
    } else {
      setSelectedStatus('fasted');
      setSelectedReason('illness');
      setNotes('');
    }
  }, [currentDay, fastingLogs]);

  const handleSave = useCallback(() => {
    if (selectedDay === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const startDate = tracker?.ramadanStartGregorian ?? '';
    // Estimate gregorian date for this day
    const start = new Date(startDate);
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + selectedDay - 1);
    const gregorianDate = dayDate.toISOString().split('T')[0];

    logFastingDay(
      selectedDay,
      gregorianDate,
      `${selectedDay} Ramadan ${tracker?.ramadanYear ?? ''}`,
      selectedStatus,
      selectedStatus === 'missed' ? selectedReason : undefined,
      notes || undefined
    );

    setSelectedDay(null);
  }, [selectedDay, selectedStatus, selectedReason, notes, tracker, logFastingDay]);

  const getStatusColor = (status: FastingStatus) => {
    switch (status) {
      case 'fasted':
        return '#10B981';
      case 'missed':
        return '#EF4444';
      case 'excused':
        return '#F59E0B';
      default:
        return theme.colors.text.muted;
    }
  };

  const getStatusIcon = (status: FastingStatus) => {
    switch (status) {
      case 'fasted':
        return 'check';
      case 'missed':
        return 'xmark';
      case 'excused':
        return 'minus';
      default:
        return 'circle';
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Header */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={styles.progressHeader}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressValue}>{stats.fasted}</Text>
            <Text style={styles.progressTotal}>/{totalDays}</Text>
          </View>
          <View style={styles.progressDetails}>
            <View style={styles.progressItem}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.progressLabel}>Fasted: {stats.fasted}</Text>
            </View>
            <View style={styles.progressItem}>
              <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.progressLabel}>Missed: {stats.missed}</Text>
            </View>
            <View style={styles.progressItem}>
              <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.progressLabel}>Excused: {stats.excused}</Text>
            </View>
            <View style={styles.progressItem}>
              <FontAwesome6 name="fire" size={12} color="#FF6B35" />
              <Text style={styles.progressLabel}>Streak: {stats.streak} days</Text>
            </View>
            {stats.qada > 0 && (
              <View style={styles.progressItem}>
                <FontAwesome6 name="rotate-left" size={12} color="#8B5CF6" />
                <Text style={styles.progressLabel}>Qada: {stats.qada} days</Text>
              </View>
            )}
          </View>
        </View>
      </MotiView>

      {/* 30-Day Grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const log = fastingLogs[day];
          const isFuture = day > currentDay;
          const isToday = day === currentDay;
          const status = log?.status ?? 'not_logged';

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
                isFuture && styles.dayCellFuture,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={isFuture}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayNumber,
                  isFuture && styles.dayNumberFuture,
                ]}
              >
                {day}
              </Text>
              {status !== 'not_logged' && (
                <FontAwesome6
                  name={getStatusIcon(status)}
                  size={12}
                  color={getStatusColor(status)}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Log Modal */}
      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Day {selectedDay}</Text>

            {/* Status Options */}
            <View style={styles.statusOptions}>
              {(['fasted', 'missed', 'excused'] as FastingStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedStatus === status && {
                      backgroundColor: getStatusColor(status) + '20',
                      borderColor: getStatusColor(status),
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedStatus(status);
                  }}
                >
                  <FontAwesome6
                    name={getStatusIcon(status)}
                    size={16}
                    color={
                      selectedStatus === status
                        ? getStatusColor(status)
                        : theme.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      selectedStatus === status && {
                        color: getStatusColor(status),
                      },
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Missed Reason */}
            {selectedStatus === 'missed' && (
              <View style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <View style={styles.reasonOptions}>
                  {(['illness', 'travel', 'menstruation', 'other'] as MissedReason[]).map(
                    (reason) => (
                      <TouchableOpacity
                        key={reason}
                        style={[
                          styles.reasonPill,
                          selectedReason === reason && styles.reasonPillActive,
                        ]}
                        onPress={() => setSelectedReason(reason)}
                      >
                        <Text
                          style={[
                            styles.reasonPillText,
                            selectedReason === reason && styles.reasonPillTextActive,
                          ]}
                        >
                          {reason.charAt(0).toUpperCase() + reason.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            )}

            {/* Notes */}
            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              placeholderTextColor={theme.colors.text.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={200}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSelectedDay(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 100,
    },

    // Progress Header
    progressHeader: {
      flexDirection: 'row',
      backgroundColor: theme.colors.secondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      gap: 20,
    },
    progressCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.accent + '15',
      borderWidth: 3,
      borderColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressValue: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 24,
      color: theme.colors.accent,
    },
    progressTotal: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginTop: -4,
    },
    progressDetails: {
      flex: 1,
      gap: 6,
    },
    progressItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    progressLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: theme.colors.text.secondary,
    },

    // Calendar Grid
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'flex-start',
    },
    dayCell: {
      width: '18%',
      aspectRatio: 1,
      backgroundColor: theme.colors.secondary,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    dayCellToday: {
      borderColor: theme.colors.accent,
    },
    dayCellFuture: {
      opacity: 0.4,
    },
    dayNumber: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    dayNumberFuture: {
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
    },
    modalTitle: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 22,
      color: theme.colors.text.primary,
      marginBottom: 20,
    },

    // Status Options
    statusOptions: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    statusOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.text.muted,
    },
    statusOptionText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 14,
      color: theme.colors.text.secondary,
    },

    // Reason Section
    reasonSection: {
      marginBottom: 16,
    },
    reasonLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 8,
    },
    reasonOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    reasonPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.secondary,
    },
    reasonPillActive: {
      backgroundColor: theme.colors.accent + '20',
    },
    reasonPillText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: theme.colors.text.secondary,
    },
    reasonPillTextActive: {
      color: theme.colors.accent,
      fontFamily: 'Outfit_500Medium',
    },

    // Notes
    notesInput: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 12,
      padding: 14,
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.primary,
      minHeight: 60,
      textAlignVertical: 'top',
      marginBottom: 20,
    },

    // Modal Actions
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 15,
      color: theme.colors.text.secondary,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
    },
    saveButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      color: '#FFFFFF',
    },
  });

export default FastingTracker;
