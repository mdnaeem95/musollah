/**
 * Bidet Sheet (MODERN DESIGN v2.0)
 * 
 * Premium bottom sheet with:
 * - Glassmorphism UI
 * - Staggered animations
 * - Haptic feedback
 * - Status badges
 * - Premium buttons
 * 
 * @version 2.0
 * @updated December 2025
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';

import { useTheme } from '../../../context/ThemeContext';
import { createLogger } from '../../../services/logging/logger';
import { formatTimeAgo, getStatusColor } from '../../../utils/musollah';
import BidetReportStatusSheet from './BidetReportStatusSheet';
import { BidetLocation, useUpdateBidetStatus, useUpdateLocationStatus } from '../../../api/services/musollah';
import Toast from 'react-native-toast-message';
import { enter } from '../../../utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// ============================================================================
// TYPES
// ============================================================================

interface BidetSheetProps {
  locationId: string | null;
  visible: boolean;
  onClose: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================
type GenderStatus = 'Yes' | 'No' | 'Unknown';

const normalizeGenderStatus = (value?: string | null): GenderStatus => {
  if (!value) return 'Unknown';

  const v = value.toString().trim().toLowerCase();

  if (v === 'yes') return 'Yes';
  if (v === 'no') return 'No';

  // Anything else becomes Unknown
  return 'Unknown';
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Status Badge Component
 */
interface StatusBadgeProps {
  status: string;
  lastUpdated: number | null;
  theme: any;
  isDarkMode: boolean;
}

const StatusBadge = ({ status, lastUpdated, theme, isDarkMode }: StatusBadgeProps) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'Available':
        return { color: '#4CAF50', icon: 'circle-check', label: 'Available' };
      case 'Unavailable':
        return { color: '#ff6b6b', icon: 'circle-xmark', label: 'Unavailable' };
      default:
        return { color: '#9CA3AF', icon: 'circle-question', label: 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
    >
      <BlurView
        intensity={15}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.statusCard, { backgroundColor: theme.colors.secondary }]}
      >
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
          <FontAwesome6 name={statusInfo.icon} size={16} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {lastUpdated && (
          <Text style={[styles.lastUpdated, { color: theme.colors.text.muted }]}>
            Updated {formatTimeAgo(lastUpdated)}
          </Text>
        )}
      </BlurView>
    </MotiView>
  );
};

/**
 * Gender Availability Item (Enhanced)
 * Now handles:
 * - "Yes" → Shows green checkmark
 * - "No" → Shows red X
 * - "Level 4R" (descriptive) → Shows info badge with location details
 */
interface GenderAvailabilityProps {
  label: string;
  value: string;
  icon: string;
  index: number;
  theme: any;
  isDarkMode: boolean;
}

const GenderAvailability = ({
  label,
  value,
  icon,
  index,
  theme,
  isDarkMode,
}: GenderAvailabilityProps) => {
  // Determine the type of value we have
  const normalizedValue = value?.toString().trim().toLowerCase() || '';
  const isYes = normalizedValue === 'yes';
  const isNo = normalizedValue === 'no';
  const hasLocationDetails = !isYes && !isNo && normalizedValue.length > 0;

  // Determine display properties
  const getDisplayInfo = () => {
    if (isYes) {
      return {
        statusIcon: 'check',
        statusColor: '#4CAF50',
        statusBgColor: '#4CAF50' + '15',
        showDetails: false,
        detailsText: null,
      };
    } else if (isNo) {
      return {
        statusIcon: 'xmark',
        statusColor: '#ff6b6b',
        statusBgColor: '#ff6b6b' + '15',
        showDetails: false,
        detailsText: null,
      };
    } else if (hasLocationDetails) {
      return {
        statusIcon: 'location-dot',
        statusColor: '#2196F3', // Blue for info
        statusBgColor: '#2196F3' + '15',
        showDetails: true,
        detailsText: value.trim(),
      };
    } else {
      return {
        statusIcon: 'question',
        statusColor: '#9CA3AF',
        statusBgColor: '#9CA3AF' + '15',
        showDetails: false,
        detailsText: null,
      };
    }
  };

  const displayInfo = getDisplayInfo();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(index * 50)}
      style={styles.genderItem}
    >
      <BlurView
        intensity={15}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.genderCard, { backgroundColor: theme.colors.secondary }]}
      >
        {/* Main Content Container */}
        <View style={styles.genderCardContent}>
          {/* Icon Circle */}
          <View style={[styles.genderIconContainer, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6 name={icon} size={20} color={theme.colors.accent} />
          </View>

          {/* Label */}
          <Text style={[styles.genderLabel, { color: theme.colors.text.primary }]}>
            {label}
          </Text>

          {/* Status Icon (checkmark, X, or location pin) */}
          <View style={[styles.genderStatus, { backgroundColor: displayInfo.statusBgColor }]}>
            <FontAwesome6 name={displayInfo.statusIcon} size={14} color={displayInfo.statusColor} />
          </View>
        </View>

        {/* Location Details Badge (if available) - Fixed height container */}
        <View style={styles.detailsBadgeContainer}>
          {displayInfo.showDetails && displayInfo.detailsText ? (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 100 + index * 50 }}
            >
              <View style={[styles.detailsBadge, { backgroundColor: displayInfo.statusBgColor }]}>
                <Text
                  style={[styles.detailsText, { color: displayInfo.statusColor }]}
                  numberOfLines={2}
                >
                  {displayInfo.detailsText}
                </Text>
              </View>
            </MotiView>
          ) : (
            <View style={styles.detailsPlaceholder} />
          )}
        </View>
      </BlurView>
    </MotiView>
  );
};

/**
 * Action Button Component
 */
interface ActionButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  theme: any;
  index: number;
}

const ActionButton = ({
  label,
  icon,
  onPress,
  variant = 'primary',
  theme,
  index,
}: ActionButtonProps) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const isPrimary = variant === 'primary';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.actionButton,
          {
            backgroundColor: isPrimary ? theme.colors.accent : theme.colors.secondary,
          },
        ]}
      >
        <FontAwesome6
          name={icon}
          size={18}
          color={isPrimary ? '#fff' : theme.colors.text.primary}
        />
        <Text
          style={[
            styles.actionButtonText,
            {
              color: isPrimary ? '#fff' : theme.colors.text.primary,
              fontFamily: isPrimary ? 'Outfit_600SemiBold' : 'Outfit_500Medium',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </MotiView>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const logger = createLogger('Bidet Sheet');

export default function BidetSheet({ onClose, visible, locationId }: BidetSheetProps) {
  logger.debug('locationId:', { locationId });
  const { theme, isDarkMode } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '85%'], []);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [location, setLocation] = useState<BidetLocation | null>(null);

  // Mutation for updating location status
  const { mutate: updateStatus } = useUpdateBidetStatus();

  // Handle status update from ReportStatusSheet
  const handleStatusUpdate = async (updates: {
    status: 'Available' | 'Unavailable' | 'Unknown';
    male?: string;
    female?: string;
    handicap?: string;
  }) => {
    if (!location) return;

    try {
      updateStatus(
        {
          id: location.id,
          status: updates.status,
          male: updates.male,
          female: updates.female,
          handicap: updates.handicap,
        },
        {
          onSuccess: () => {
            Toast.show({
              type: 'success',
              text1: 'Status Updated',
              text2: 'Thank you for keeping the community informed!',
            });
            setShowReportSheet(false);
          },
          onError: (error) => {
            logger.error('Failed to update status:', error);
            Toast.show({
              type: 'error',
              text1: 'Update Failed',
              text2: 'Please try again later',
            });
          },
        }
      );
    } catch (error) {
      logger.error('Error updating status:', error as Error);
    }
  };

  // Fetch location data
  useEffect(() => {
    if (!locationId || !visible) return;

    const unsubscribe = firestore()
      .collection('Bidets')
      .doc(locationId)
      .onSnapshot((doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (!data) return;
          const normalized: BidetLocation = {
            id: doc.id,
            address: data.Address || '',
            building: data.Building || '',
            postal: data.Postal || '',
            male: data.Male || 'Unknown',
            female: data.Female || 'Unknown',
            handicap: data.Handicap || 'Unknown',
            status: data.status || 'Unknown',
            lastUpdated: data.lastUpdated || null,
            coordinates: data.Coordinates || { latitude: 0, longitude: 0 },
          };
          setLocation(normalized);
        }
      });

    return () => unsubscribe();
  }, [locationId, visible]);

  // Control sheet visibility
  useEffect(() => {
    if (!sheetRef.current) return;

    if (visible && location) {
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 10);
    } else {
      sheetRef.current?.close();
    }
  }, [visible, location]);

  // Handle close with haptic
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Open in maps
  const openMaps = () => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location.building}, ${location.address}`
    )}`;
    Linking.openURL(url);
  };

  // Render backdrop
  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  );

  if (!location) return null;

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        index={visible && location ? 0 : -1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={handleClose}
        backgroundStyle={{ backgroundColor: theme.colors.primary }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.text.muted }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.contentContainer}>
          {/* Close Button */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={enter(0)}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.colors.secondary }]}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary} solid />
            </TouchableOpacity>
          </MotiView>

          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={enter(0)}
          >
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {location.building}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {location.address}, S{location.postal}
            </Text>
          </MotiView>

          {/* Status Badge */}
          <StatusBadge
            status={location.status || 'Unknown'}
            lastUpdated={location.lastUpdated!}
            theme={theme}
            isDarkMode={isDarkMode}
          />

          {/* Gender Availability Section */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 150 }}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Availability
            </Text>
          </MotiView>

          <View style={styles.genderRow}>
            <GenderAvailability
              label="Male"
              value={location.male}
              icon="person"
              index={0}
              theme={theme}
              isDarkMode={isDarkMode}
            />
            <GenderAvailability
              label="Female"
              value={location.female}
              icon="person-dress"
              index={1}
              theme={theme}
              isDarkMode={isDarkMode}
            />
            <GenderAvailability
              label="Accessible"
              value={location.handicap}
              icon="wheelchair"
              index={2}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <ActionButton
              label="Open in Maps"
              icon="location-dot"
              onPress={openMaps}
              variant="primary"
              theme={theme}
              index={0}
            />
            <ActionButton
              label="Report Status"
              icon="flag"
              onPress={() => setShowReportSheet(true)}
              variant="secondary"
              theme={theme}
              index={1}
            />
          </View>

          {/* Data Attribution */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 400,
              delay: 400,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL('https://www.instagram.com/toiletswithbidetssg/').catch((err) =>
                  logger.error('Error opening Instagram:', err)
                );
              }}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={10}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[styles.creditCard, { backgroundColor: theme.colors.secondary }]}
              >
                <View style={styles.creditContent}>
                  <FontAwesome6 
                    name="heart" 
                    size={14} 
                    color={theme.colors.accent}
                    solid
                  />
                  <Text style={[styles.creditText, { color: theme.colors.text.secondary }]}>
                    Data provided by{' '}
                    <Text style={[styles.creditHandle, { color: theme.colors.accent }]}>
                      @toiletswithbidetssg
                    </Text>
                  </Text>
                  <FontAwesome6 
                    name="arrow-up-right-from-square" 
                    size={12} 
                    color={theme.colors.text.muted}
                  />
                </View>
              </BlurView>
            </TouchableOpacity>
          </MotiView>
        </BottomSheetView>
      </BottomSheet>

      {/* Report Status Modal */}
      <BidetReportStatusSheet
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        type="bidet"
        locationId={location.id}
        currentStatus={location.status || 'Unknown'}
        currentMale={location.male || 'Unknown'}        // Preserves "Level 4R"
        currentFemale={location.female || 'Unknown'}
        currentHandicap={location.handicap || 'Unknown'}
        onStatusUpdate={handleStatusUpdate}
      />
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },

  // Close Button
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  // Header
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },

  // Status Card
  statusCard: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: SPACING.md,
  },

  // Gender Availability
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  genderItem: {
    flex: 1,
  },
  genderCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 160, // Fixed minimum height for consistency
    justifyContent: 'space-between', // Distribute content evenly
  },
  genderCardContent: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  genderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  genderStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBadgeContainer: {
    marginTop: SPACING.sm,
    width: '100%',
    minHeight: 40, // Reserve space for badge or placeholder
  },
  detailsPlaceholder: {
    height: 40, // Same as badge height to maintain consistency
  },
  detailsBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Action Buttons
  actionsContainer: {
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
  },

  // Data Attribution
  creditCard: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  creditContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  creditText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  creditHandle: {
    fontFamily: 'Outfit_600SemiBold',
  },
});