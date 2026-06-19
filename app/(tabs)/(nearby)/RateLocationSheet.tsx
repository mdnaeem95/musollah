/**
 * RateLocationSheet
 *
 * Community cleanliness rating modal for musollahs & bidets — a 1–5 gold-star
 * selector plus an optional note. Mirrors the report-status sheet's styling.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { enter } from '../../../utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
const STAR_COLOR = '#FFC107';
const STAR_LABELS = ['', 'Poor', 'Fair', 'Okay', 'Clean', 'Spotless'];

interface RateLocationSheetProps {
  visible: boolean;
  onClose: () => void;
  locationName: string;
  currentRating?: number;
  currentNote?: string;
  isSubmitting?: boolean;
  onSubmit: (rating: number, note: string) => void;
}

const RateLocationSheet: React.FC<RateLocationSheetProps> = ({
  visible,
  onClose,
  locationName,
  currentRating = 0,
  currentNote = '',
  isSubmitting = false,
  onSubmit,
}) => {
  const { theme, isDarkMode } = useTheme();

  const [rating, setRating] = useState(currentRating);
  const [note, setNote] = useState(currentNote);

  // Sync when the prior rating loads / target changes.
  useEffect(() => {
    if (visible) {
      setRating(currentRating);
      setNote(currentNote);
    }
  }, [visible, currentRating, currentNote]);

  const handleStarPress = useCallback((value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (rating < 1 || isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(rating, note.trim());
  }, [rating, note, isSubmitting, onSubmit]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDarkMode ? '#080F1E' : '#E8EFFF' },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: theme.colors.text.muted }]} />

          {/* Header */}
          <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={enter(0)}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Rate cleanliness
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]} numberOfLines={2}>
              How clean is {locationName}? Your rating helps the community.
            </Text>
          </MotiView>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => {
              const filled = value <= rating;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleStarPress(value)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  style={styles.starButton}
                >
                  <FontAwesome6 name="star" size={40} solid={filled} color={filled ? STAR_COLOR : theme.colors.text.muted} />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.ratingLabel, { color: rating > 0 ? STAR_COLOR : theme.colors.text.muted }]}>
            {rating > 0 ? STAR_LABELS[rating] : 'Tap a star'}
          </Text>

          {/* Optional note */}
          <TextInput
            style={[styles.noteInput, {
              color: theme.colors.text.primary,
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
            }]}
            placeholder="Add a note (optional) — e.g. water pressure, prayer mats condition"
            placeholderTextColor={theme.colors.text.muted}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={280}
            textAlignVertical="top"
          />

          {/* Actions */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={rating < 1 || isSubmitting}
            style={[styles.submitButton, {
              backgroundColor: rating >= 1 ? theme.colors.accent : theme.colors.text.muted,
              opacity: isSubmitting ? 0.6 : 1,
            }]}
          >
            <FontAwesome6 name="star" size={16} color="#fff" solid />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting…' : currentRating > 0 ? 'Update rating' : 'Submit rating'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} activeOpacity={0.7} disabled={isSubmitting} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: theme.colors.text.secondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl + SPACING.lg,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    opacity: 0.4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  starButton: {
    padding: SPACING.xs,
  },
  ratingLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  noteInput: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: SPACING.xl,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    height: 56,
    borderRadius: 14,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
  },
});

export default RateLocationSheet;
