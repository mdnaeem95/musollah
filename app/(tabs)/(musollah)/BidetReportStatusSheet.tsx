/**
 * ReportStatusSheet - Modern Design v2.1 (LAYOUT FIX)
 * 
 * Allows users to report location status with granular facility information
 * - Proper scrolling to all sections
 * - Fixed header and actions
 * - Expanded ScrollView area
 * 
 * @version 2.1.0
 * @lastUpdated 2025-12-11
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { createLogger } from '../../../services/logging/logger';

const logger = createLogger('Bidet Report');
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import { enter } from '../../../utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Spacing constants
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Status colors
const STATUS_COLORS = {
  Available: '#4CAF50',
  Yes: '#4CAF50',
  Unavailable: '#ff6b6b',
  No: '#ff6b6b',
  Unknown: '#9CA3AF',
};

interface ReportStatusSheetProps {
  visible: boolean;
  onClose: () => void;
  type: 'bidet' | 'musollah';
  locationId: string;
  currentStatus?: 'Available' | 'Unavailable' | 'Unknown';
  currentMale?: 'Yes' | 'No' | 'Unknown' | string;  // Can be Yes/No or location text
  currentFemale?: 'Yes' | 'No' | 'Unknown' | string;
  currentHandicap?: 'Yes' | 'No' | 'Unknown' | string;
  onStatusUpdate: (updates: {
    status: 'Available' | 'Unavailable' | 'Unknown';
    male?: 'Yes' | 'No' | 'Unknown' | string;  // Can send location text
    female?: 'Yes' | 'No' | 'Unknown' | string;
    handicap?: 'Yes' | 'No' | 'Unknown' | string;
  }) => void;
}

// Memoized Status Option Component
const StatusOption = React.memo(({
  label,
  value,
  isSelected,
  onPress,
  icon,
  theme,
  isDarkMode,
  index,
  disabled,
}: any) => {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(value);
  }, [onPress, value]);

  const color = STATUS_COLORS[value as keyof typeof STATUS_COLORS] || theme.colors.text.muted;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
      style={{ flex: 1 }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            styles.statusOption,
            {
              backgroundColor: isSelected
                ? `${color}20`
                : theme.colors.secondary,
              borderColor: isSelected ? color : 'transparent',
              borderWidth: isSelected ? 2 : 0,
            },
          ]}
        >
          {/* Icon Circle */}
          {icon && (
            <View
              style={[
                styles.statusIconCircle,
                {
                  backgroundColor: isSelected ? color : `${theme.colors.text.muted}30`,
                },
              ]}
            >
              <FontAwesome6
                name={icon}
                size={20}
                color={isSelected ? '#fff' : theme.colors.text.muted}
              />
            </View>
          )}

          {/* Label */}
          <Text
            style={[
              styles.statusLabel,
              {
                color: isSelected ? color : theme.colors.text.secondary,
                fontFamily: isSelected ? 'Outfit_600SemiBold' : 'Outfit_500Medium',
              },
            ]}
          >
            {label}
          </Text>

          {/* Check Icon */}
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: color }]}>
              <FontAwesome6 name="check" size={12} color="#fff" />
            </View>
          )}
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
});

// Memoized Section Header Component
const SectionHeader = React.memo(({ title, icon, theme, index }: any) => (
  <MotiView
    from={{ opacity: 0, translateX: -20 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={enter(0)}
    style={styles.sectionHeader}
  >
    <View style={[styles.sectionIconCircle, { backgroundColor: `${theme.colors.accent}20` }]}>
      <FontAwesome6 name={icon} size={16} color={theme.colors.accent} />
    </View>
    <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{title}</Text>
  </MotiView>
));

// Location Input Component (appears when facility is "Yes")
const LocationInput = React.memo(({
  value,
  onChangeText,
  placeholder,
  theme,
  isDarkMode,
}: any) => (
  <MotiView
    from={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ type: 'timing', duration: 200 }}
    style={styles.locationInputContainer}
  >
    <BlurView
      intensity={15}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[styles.locationInputWrapper, { backgroundColor: theme.colors.secondary }]}
    >
      <View style={[styles.locationIconContainer, { backgroundColor: `${theme.colors.accent}15` }]}>
        <FontAwesome6 name="location-dot" size={14} color={theme.colors.accent} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        style={[styles.locationInput, { color: theme.colors.text.primary }]}
        maxLength={50}
        autoCapitalize="words"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} activeOpacity={0.7}>
          <FontAwesome6 name="circle-xmark" size={18} color={theme.colors.text.muted} solid />
        </TouchableOpacity>
      )}
    </BlurView>
    <Text style={[styles.helperText, { color: theme.colors.text.muted }]}>
      e.g., "Level 3, near lifts" or "Basement 1"
    </Text>
  </MotiView>
));

const BidetReportStatusSheet: React.FC<ReportStatusSheetProps> = ({
  visible,
  onClose,
  type,
  locationId,
  currentStatus = 'Unknown',
  currentMale = 'Unknown',
  currentFemale = 'Unknown',
  currentHandicap = 'Unknown',
  onStatusUpdate,
}) => {
  const { theme, isDarkMode } = useTheme();

  // Helper to check if value is a location detail (not Yes/No/Unknown)
  const isLocationDetail = (value: string) => {
    const normalized = value?.toLowerCase();
    return normalized !== 'yes' && normalized !== 'no' && normalized !== 'unknown' && value.length > 0;
  };

  // State
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  
  // For facility availability, default to 'Unknown' if current value is location text
  const [male, setMale] = useState<'Yes' | 'No' | 'Unknown'>(
    isLocationDetail(currentMale) ? 'Yes' : (currentMale as 'Yes' | 'No' | 'Unknown')
  );
  const [female, setFemale] = useState<'Yes' | 'No' | 'Unknown'>(
    isLocationDetail(currentFemale) ? 'Yes' : (currentFemale as 'Yes' | 'No' | 'Unknown')
  );
  const [handicap, setHandicap] = useState<'Yes' | 'No' | 'Unknown'>(
    isLocationDetail(currentHandicap) ? 'Yes' : (currentHandicap as 'Yes' | 'No' | 'Unknown')
  );
  
  // Location detail text inputs
  const [maleLocation, setMaleLocation] = useState(isLocationDetail(currentMale) ? currentMale : '');
  const [femaleLocation, setFemaleLocation] = useState(isLocationDetail(currentFemale) ? currentFemale : '');
  const [handicapLocation, setHandicapLocation] = useState(isLocationDetail(currentHandicap) ? currentHandicap : '');
  
  const [isPending, setIsPending] = useState(false);

  // Check if any changes were made
  const hasChanges = useMemo(() => {
    if (type === 'bidet') {
      // Check if basic selections changed OR location details were added/modified
      const maleChanged = male !== (isLocationDetail(currentMale) ? 'Yes' : currentMale) || 
                         maleLocation !== (isLocationDetail(currentMale) ? currentMale : '');
      const femaleChanged = female !== (isLocationDetail(currentFemale) ? 'Yes' : currentFemale) || 
                           femaleLocation !== (isLocationDetail(currentFemale) ? currentFemale : '');
      const handicapChanged = handicap !== (isLocationDetail(currentHandicap) ? 'Yes' : currentHandicap) || 
                             handicapLocation !== (isLocationDetail(currentHandicap) ? currentHandicap : '');
      
      return (
        selectedStatus !== currentStatus ||
        maleChanged ||
        femaleChanged ||
        handicapChanged
      );
    }
    return selectedStatus !== currentStatus;
  }, [selectedStatus, male, female, handicap, maleLocation, femaleLocation, handicapLocation, 
      currentStatus, currentMale, currentFemale, currentHandicap, type]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!hasChanges || isPending) return;

    setIsPending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const updates: any = { status: selectedStatus };

      if (type === 'bidet') {
        // For each facility, send location text if provided AND facility is "Yes"
        // Otherwise send the Yes/No/Unknown value
        updates.male = male === 'Yes' && maleLocation.trim() 
          ? maleLocation.trim() 
          : male;
        
        updates.female = female === 'Yes' && femaleLocation.trim() 
          ? femaleLocation.trim() 
          : female;
        
        updates.handicap = handicap === 'Yes' && handicapLocation.trim() 
          ? handicapLocation.trim() 
          : handicap;
      }

      await onStatusUpdate(updates);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      logger.error('Failed to update status', error as Error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPending(false);
    }
  }, [hasChanges, isPending, selectedStatus, male, female, handicap, 
      maleLocation, femaleLocation, handicapLocation, type, onStatusUpdate, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.primary }]}>
          {/* Handle Bar */}
          <MotiView
            from={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={enter(0)}
          >
            <View style={[styles.handleBar, { backgroundColor: theme.colors.text.muted }]} />
          </MotiView>

          {/* Header - Fixed */}
          <View style={styles.headerSection}>
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={enter(0)}
            >
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                Report Current Status
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                Help keep the community informed
              </Text>
            </MotiView>
          </View>

          {/* Scrollable Content Area */}
          <ScrollView
            style={styles.contentArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Overall Status Section */}
            <SectionHeader title="Overall Status" icon="check" theme={theme} index={0} />

            <View style={styles.optionsRow}>
              <StatusOption
                label="Available"
                value="Available"
                isSelected={selectedStatus === 'Available'}
                onPress={setSelectedStatus}
                icon="circle-check"
                theme={theme}
                isDarkMode={isDarkMode}
                index={0}
                disabled={isPending}
              />
              <StatusOption
                label="Unavailable"
                value="Unavailable"
                isSelected={selectedStatus === 'Unavailable'}
                onPress={setSelectedStatus}
                icon="circle-xmark"
                theme={theme}
                isDarkMode={isDarkMode}
                index={1}
                disabled={isPending}
              />
              <StatusOption
                label="Unknown"
                value="Unknown"
                isSelected={selectedStatus === 'Unknown'}
                onPress={setSelectedStatus}
                icon="circle-question"
                theme={theme}
                isDarkMode={isDarkMode}
                index={2}
                disabled={isPending}
              />
            </View>

            {/* Bidet-Specific Facilities Section */}
            {type === 'bidet' && (
              <>
                <SectionHeader title="Facility Availability" icon="restroom" theme={theme} index={1} />

                {/* Male Facilities */}
                <View style={styles.facilityGroup}>
                  <View style={styles.facilityHeader}>
                    <FontAwesome6 name="person" size={16} color={theme.colors.text.secondary} />
                    <Text style={[styles.facilityLabel, { color: theme.colors.text.primary }]}>
                      Male Facilities
                    </Text>
                  </View>
                  <View style={styles.optionsRow}>
                    <StatusOption
                      label="Yes"
                      value="Yes"
                      isSelected={male === 'Yes'}
                      onPress={setMale}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={3}
                      disabled={isPending}
                    />
                    <StatusOption
                      label="No"
                      value="No"
                      isSelected={male === 'No'}
                      onPress={setMale}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={4}
                      disabled={isPending}
                    />
                    <StatusOption
                      label="Unknown"
                      value="Unknown"
                      isSelected={male === 'Unknown'}
                      onPress={setMale}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={5}
                      disabled={isPending}
                    />
                  </View>
                  
                  {/* Location Input (only shown when Male = Yes) */}
                  {male === 'Yes' && (
                    <LocationInput
                      value={maleLocation}
                      onChangeText={setMaleLocation}
                      placeholder="Where exactly? (optional)"
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </View>

                {/* Female Facilities */}
                <View style={styles.facilityGroup}>
                  <View style={styles.facilityHeader}>
                    <FontAwesome6 name="person-dress" size={16} color={theme.colors.text.secondary} />
                    <Text style={[styles.facilityLabel, { color: theme.colors.text.primary }]}>
                      Female Facilities
                    </Text>
                  </View>
                  <View style={styles.optionsRow}>
                    <StatusOption
                      label="Yes"
                      value="Yes"
                      isSelected={female === 'Yes'}
                      onPress={setFemale}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={6}
                      disabled={isPending}
                    />
                    <StatusOption
                      label="No"
                      value="No"
                      isSelected={female === 'No'}
                      onPress={setFemale}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={7}
                      disabled={isPending}
                    />
                    <StatusOption
                      label="Unknown"
                      value="Unknown"
                      isSelected={female === 'Unknown'}
                      onPress={setFemale}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={8}
                      disabled={isPending}
                    />
                  </View>
                  
                  {/* Location Input (only shown when Female = Yes) */}
                  {female === 'Yes' && (
                    <LocationInput
                      value={femaleLocation}
                      onChangeText={setFemaleLocation}
                      placeholder="Where exactly? (optional)"
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </View>

                {/* Accessible Facilities */}
                <View style={styles.facilityGroup}>
                  <View style={styles.facilityHeader}>
                    <FontAwesome6 name="wheelchair" size={16} color={theme.colors.text.secondary} />
                    <Text style={[styles.facilityLabel, { color: theme.colors.text.primary }]}>
                      Accessible Facilities
                    </Text>
                  </View>
                  <View style={styles.optionsRow}>
                    <StatusOption
                      label="Yes"
                      value="Yes"
                      isSelected={handicap === 'Yes'}
                      onPress={setHandicap}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={9}
                      disabled={isPending}
                    />
                    <StatusOption
                      label="No"
                      value="No"
                      isSelected={handicap === 'No'}
                      onPress={setHandicap}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={10}
                      disabled={isPending}
                    />
                    <StatusOption
                      label="Unknown"
                      value="Unknown"
                      isSelected={handicap === 'Unknown'}
                      onPress={setHandicap}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      index={11}
                      disabled={isPending}
                    />
                  </View>
                  
                  {/* Location Input (only shown when Accessible = Yes) */}
                  {handicap === 'Yes' && (
                    <LocationInput
                      value={handicapLocation}
                      onChangeText={setHandicapLocation}
                      placeholder="Where exactly? (optional)"
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Action Buttons - Fixed at Bottom */}
          <View style={[styles.actionsSection, { borderTopColor: `${theme.colors.text.muted}20` }]}>
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={enter(0)}
            >
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isPending || !hasChanges}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: hasChanges ? theme.colors.accent : theme.colors.text.muted,
                    opacity: isPending ? 0.6 : 1,
                  },
                ]}
              >
                {isPending ? (
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                ) : (
                  <>
                    <FontAwesome6 name="paper-plane" size={16} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                disabled={isPending}
                style={styles.cancelButton}
              >
                <Text style={[styles.cancelText, { color: theme.colors.text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.85, // 85% of screen height
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  // Handle Bar
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },

  // Header Section (Fixed)
  headerSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },

  // Content Area (Scrollable)
  contentArea: {
    flex: 1, // Takes all available space
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl * 2, // Extra padding at bottom
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },

  // Status Option
  statusOption: {
    borderRadius: 14,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 110,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Facility Group
  facilityGroup: {
    marginBottom: SPACING.xl,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  facilityLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
  },

  // Location Input
  locationInputContainer: {
    marginTop: SPACING.md,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    paddingVertical: 0,
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: SPACING.xs,
    marginLeft: SPACING.lg,
  },

  // Actions Section (Fixed at Bottom)
  actionsSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
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
    paddingVertical: SPACING.md,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
  },
});

export default BidetReportStatusSheet;