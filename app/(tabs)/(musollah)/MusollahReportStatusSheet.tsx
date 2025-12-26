/**
 * MusollahReportStatusSheet - Modern Design v1.0
 *
 * Status + amenities reporting for musollahs:
 * - Overall status (Available / Unavailable / Unknown)
 * - Amenities: Segregated, Air Conditioned, Ablution Area,
 *   Slippers, Prayer Mats, Telekung
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import { enter } from '../../../utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const STATUS_COLORS = {
  Available: '#4CAF50',
  Unavailable: '#ff6b6b',
  Unknown: '#9CA3AF',
  Yes: '#4CAF50',
  No: '#ff6b6b',
} as const;

type LocationStatus = 'Available' | 'Unavailable' | 'Unknown';
type AmenityStatus = 'Yes' | 'No' | 'Unknown';

interface MusollahReportStatusSheetProps {
  visible: boolean;
  onClose: () => void;
  locationId: string;
  currentStatus?: LocationStatus;
  currentSegregated?: AmenityStatus;
  currentAirConditioned?: AmenityStatus;
  currentAblutionArea?: AmenityStatus;
  currentSlippers?: AmenityStatus;
  currentPrayerMats?: AmenityStatus;
  currentTelekung?: AmenityStatus;
  onStatusUpdate: (updates: {
    status: LocationStatus;
    segregated?: AmenityStatus;
    airConditioned?: AmenityStatus;
    ablutionArea?: AmenityStatus;
    slippers?: AmenityStatus;
    prayerMats?: AmenityStatus;
    telekung?: AmenityStatus;
  }) => void;
}

// ---------------------------------------------------------------------
// Reusable StatusOption
// ---------------------------------------------------------------------

const StatusOption = React.memo(
  ({
    label,
    value,
    isSelected,
    onPress,
    theme,
    isDarkMode,
    index,
    disabled,
  }: any) => {
    const handlePress = useCallback(() => {
      if (disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(value);
    }, [disabled, onPress, value]);

    const color =
      STATUS_COLORS[value as keyof typeof STATUS_COLORS] ??
      theme.colors.text.muted;

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
            <View
              style={[
                styles.statusIconCircle,
                {
                  backgroundColor: isSelected
                    ? color
                    : `${theme.colors.text.muted}30`,
                },
              ]}
            >
              <FontAwesome6
                name={
                  value === 'Available' || value === 'Yes'
                    ? 'circle-check'
                    : value === 'Unavailable' || value === 'No'
                    ? 'circle-xmark'
                    : 'circle-question'
                }
                size={20}
                color={isSelected ? '#fff' : theme.colors.text.muted}
              />
            </View>

            <Text
              style={[
                styles.statusLabel,
                {
                  color: isSelected ? color : theme.colors.text.secondary,
                  fontFamily: isSelected
                    ? 'Outfit_600SemiBold'
                    : 'Outfit_500Medium',
                },
              ]}
            >
              {label}
            </Text>

            {isSelected && (
              <View style={[styles.checkIcon, { backgroundColor: color }]}>
                <FontAwesome6 name="check" size={12} color="#fff" />
              </View>
            )}
          </BlurView>
        </TouchableOpacity>
      </MotiView>
    );
  }
);

// Section header
const SectionHeader = React.memo(
  ({ title, icon, theme, index }: any) => (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={enter(0)}
      style={styles.sectionHeader}
    >
      <View
        style={[
          styles.sectionIconCircle,
          { backgroundColor: `${theme.colors.accent}20` },
        ]}
      >
        <FontAwesome6 name={icon} size={16} color={theme.colors.accent} />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        {title}
      </Text>
    </MotiView>
  )
);

const MusollahReportStatusSheet: React.FC<MusollahReportStatusSheetProps> = ({
  visible,
  onClose,
  locationId,
  currentStatus = 'Unknown',
  currentSegregated = 'Unknown',
  currentAirConditioned = 'Unknown',
  currentAblutionArea = 'Unknown',
  currentSlippers = 'Unknown',
  currentPrayerMats = 'Unknown',
  currentTelekung = 'Unknown',
  onStatusUpdate,
}) => {
  const { theme, isDarkMode } = useTheme();

  const [selectedStatus, setSelectedStatus] =
    useState<LocationStatus>(currentStatus);
  const [segregated, setSegregated] =
    useState<AmenityStatus>(currentSegregated);
  const [airConditioned, setAirConditioned] =
    useState<AmenityStatus>(currentAirConditioned);
  const [ablutionArea, setAblutionArea] =
    useState<AmenityStatus>(currentAblutionArea);
  const [slippers, setSlippers] = useState<AmenityStatus>(currentSlippers);
  const [prayerMats, setPrayerMats] =
    useState<AmenityStatus>(currentPrayerMats);
  const [telekung, setTelekung] = useState<AmenityStatus>(currentTelekung);
  const [isPending, setIsPending] = useState(false);

  const hasChanges = useMemo(
    () =>
      selectedStatus !== currentStatus ||
      segregated !== currentSegregated ||
      airConditioned !== currentAirConditioned ||
      ablutionArea !== currentAblutionArea ||
      slippers !== currentSlippers ||
      prayerMats !== currentPrayerMats ||
      telekung !== currentTelekung,
    [
      selectedStatus,
      currentStatus,
      segregated,
      currentSegregated,
      airConditioned,
      currentAirConditioned,
      ablutionArea,
      currentAblutionArea,
      slippers,
      currentSlippers,
      prayerMats,
      currentPrayerMats,
      telekung,
      currentTelekung,
    ]
  );

  const handleSubmit = useCallback(async () => {
    if (!hasChanges || isPending) return;

    setIsPending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onStatusUpdate({
        status: selectedStatus,
        segregated,
        airConditioned,
        ablutionArea,
        slippers,
        prayerMats,
        telekung,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error('Failed to update musollah status:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPending(false);
    }
  }, [
    hasChanges,
    isPending,
    onStatusUpdate,
    onClose,
    selectedStatus,
    segregated,
    airConditioned,
    ablutionArea,
    slippers,
    prayerMats,
    telekung,
  ]);

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
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          {/* Handle bar */}
          <MotiView
            from={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={enter(0)}
          >
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.colors.text.muted },
              ]}
            />
          </MotiView>

          {/* Header */}
          <View style={styles.headerSection}>
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={enter(0)}
            >
              <Text
                style={[styles.title, { color: theme.colors.text.primary }]}
              >
                Report Musollah Status
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.colors.text.secondary }]}
              >
                Help the community stay updated on this musollah and its
                facilities
              </Text>
            </MotiView>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.contentArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Overall status */}
            <SectionHeader
              title="Overall Status"
              icon="check"
              theme={theme}
              index={0}
            />
            <View style={styles.optionsRow}>
              <StatusOption
                label="Available"
                value="Available"
                isSelected={selectedStatus === 'Available'}
                onPress={setSelectedStatus}
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
                theme={theme}
                isDarkMode={isDarkMode}
                index={2}
                disabled={isPending}
              />
            </View>

            {/* Amenities */}
            <SectionHeader
              title="Amenities"
              icon="mosque"
              theme={theme}
              index={1}
            />

            {/* Segregated */}
            <View style={styles.facilityGroup}>
              <View style={styles.facilityHeader}>
                <FontAwesome6
                  name="users"
                  size={16}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.facilityLabel,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Segregated
                </Text>
              </View>
              <View style={styles.optionsRow}>
                <StatusOption
                  label="Yes"
                  value="Yes"
                  isSelected={segregated === 'Yes'}
                  onPress={setSegregated}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={3}
                  disabled={isPending}
                />
                <StatusOption
                  label="No"
                  value="No"
                  isSelected={segregated === 'No'}
                  onPress={setSegregated}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={4}
                  disabled={isPending}
                />
                <StatusOption
                  label="Unknown"
                  value="Unknown"
                  isSelected={segregated === 'Unknown'}
                  onPress={setSegregated}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={5}
                  disabled={isPending}
                />
              </View>
            </View>

            {/* Air Conditioned */}
            <View style={styles.facilityGroup}>
              <View style={styles.facilityHeader}>
                <FontAwesome6
                  name="snowflake"
                  size={16}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.facilityLabel,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Air Conditioned
                </Text>
              </View>
              <View style={styles.optionsRow}>
                <StatusOption
                  label="Yes"
                  value="Yes"
                  isSelected={airConditioned === 'Yes'}
                  onPress={setAirConditioned}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={6}
                  disabled={isPending}
                />
                <StatusOption
                  label="No"
                  value="No"
                  isSelected={airConditioned === 'No'}
                  onPress={setAirConditioned}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={7}
                  disabled={isPending}
                />
                <StatusOption
                  label="Unknown"
                  value="Unknown"
                  isSelected={airConditioned === 'Unknown'}
                  onPress={setAirConditioned}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={8}
                  disabled={isPending}
                />
              </View>
            </View>

            {/* Ablution Area */}
            <View style={styles.facilityGroup}>
              <View style={styles.facilityHeader}>
                <FontAwesome6
                  name="droplet"
                  size={16}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.facilityLabel,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Ablution Area
                </Text>
              </View>
            <View style={styles.optionsRow}>
              <StatusOption
                label="Yes"
                value="Yes"
                isSelected={ablutionArea === 'Yes'}
                onPress={setAblutionArea}
                theme={theme}
                isDarkMode={isDarkMode}
                index={9}
                disabled={isPending}
              />
              <StatusOption
                label="No"
                value="No"
                isSelected={ablutionArea === 'No'}
                onPress={setAblutionArea}
                theme={theme}
                isDarkMode={isDarkMode}
                index={10}
                disabled={isPending}
              />
              <StatusOption
                label="Unknown"
                value="Unknown"
                isSelected={ablutionArea === 'Unknown'}
                onPress={setAblutionArea}
                theme={theme}
                isDarkMode={isDarkMode}
                index={11}
                disabled={isPending}
              />
            </View>
            </View>

            {/* Slippers */}
            <View style={styles.facilityGroup}>
              <View style={styles.facilityHeader}>
                <FontAwesome6
                  name="shoe-prints"
                  size={16}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.facilityLabel,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Slippers
                </Text>
              </View>
              <View style={styles.optionsRow}>
                <StatusOption
                  label="Yes"
                  value="Yes"
                  isSelected={slippers === 'Yes'}
                  onPress={setSlippers}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={12}
                  disabled={isPending}
                />
                <StatusOption
                  label="No"
                  value="No"
                  isSelected={slippers === 'No'}
                  onPress={setSlippers}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={13}
                  disabled={isPending}
                />
                <StatusOption
                  label="Unknown"
                  value="Unknown"
                  isSelected={slippers === 'Unknown'}
                  onPress={setSlippers}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={14}
                  disabled={isPending}
                />
              </View>
            </View>

            {/* Prayer Mats */}
            <View style={styles.facilityGroup}>
              <View style={styles.facilityHeader}>
                <FontAwesome6
                  name="rug"
                  size={16}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.facilityLabel,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Prayer Mats
                </Text>
              </View>
              <View style={styles.optionsRow}>
                <StatusOption
                  label="Yes"
                  value="Yes"
                  isSelected={prayerMats === 'Yes'}
                  onPress={setPrayerMats}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={15}
                  disabled={isPending}
                />
                <StatusOption
                  label="No"
                  value="No"
                  isSelected={prayerMats === 'No'}
                  onPress={setPrayerMats}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={16}
                  disabled={isPending}
                />
                <StatusOption
                  label="Unknown"
                  value="Unknown"
                  isSelected={prayerMats === 'Unknown'}
                  onPress={setPrayerMats}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={17}
                  disabled={isPending}
                />
              </View>
            </View>

            {/* Telekung */}
            <View style={styles.facilityGroup}>
              <View style={styles.facilityHeader}>
                <FontAwesome6
                  name="person-dress"
                  size={16}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.facilityLabel,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Telekung
                </Text>
              </View>
              <View style={styles.optionsRow}>
                <StatusOption
                  label="Yes"
                  value="Yes"
                  isSelected={telekung === 'Yes'}
                  onPress={setTelekung}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={18}
                  disabled={isPending}
                />
                <StatusOption
                  label="No"
                  value="No"
                  isSelected={telekung === 'No'}
                  onPress={setTelekung}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={19}
                  disabled={isPending}
                />
                <StatusOption
                  label="Unknown"
                  value="Unknown"
                  isSelected={telekung === 'Unknown'}
                  onPress={setTelekung}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  index={20}
                  disabled={isPending}
                />
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View
            style={[
              styles.actionsSection,
              { borderTopColor: `${theme.colors.text.muted}20` },
            ]}
          >
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
                    backgroundColor: hasChanges
                      ? theme.colors.accent
                      : theme.colors.text.muted,
                    opacity: isPending ? 0.6 : 1,
                  },
                ]}
              >
                <FontAwesome6 name="paper-plane" size={16} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {isPending ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                disabled={isPending}
                style={styles.cancelButton}
              >
                <Text
                  style={[
                    styles.cancelText,
                    { color: theme.colors.text.secondary },
                  ]}
                >
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
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
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl * 2,
  },
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
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
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

export default MusollahReportStatusSheet;
