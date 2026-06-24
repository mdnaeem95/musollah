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

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';

import { useTheme } from '../../../context/ThemeContext';
import { createLogger } from '../../../services/logging/logger';
import { formatTimeAgo } from '../../../utils/musollah';
import BidetReportStatusSheet from './BidetReportStatusSheet';
import RateLocationSheet from './RateLocationSheet';
import {
  BidetLocation,
  useUpdateBidetStatus,
  useUserRating,
  useSubmitCleanlinessRating,
  useConfirmLocationStatus,
  isLocationVerified,
  isStatusStale,
} from '../../../api/services/musollah';
import { useAuthStore } from '../../../stores/useAuthStore';
import SignInModal from '../../../components/SignInModal';
import LocationPhotos from '../../../components/musollah/LocationPhotos';
import Toast from 'react-native-toast-message';
import { enter } from '../../../utils';

const STAR_COLOR = '#FFC107';

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
  reason?: string;
  lastUpdated: number | null;
  verified: boolean;
  stale: boolean;
  theme: any;
  isDarkMode: boolean;
}

const StatusBadge = ({ status, reason, lastUpdated, verified, stale, theme, isDarkMode }: StatusBadgeProps) => {
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
        style={[styles.statusCard, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
            <FontAwesome6 name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
              {status === 'Unavailable' && reason ? ` · ${reason}` : ''}
            </Text>
          </View>
          {verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: '#0EA5E915' }]}>
              <FontAwesome6 name="circle-check" size={11} color="#0EA5E9" solid />
              <Text style={styles.verifiedText}>Community verified</Text>
            </View>
          )}
        </View>

        {lastUpdated && (
          <Text style={[styles.lastUpdated, { color: stale ? '#F59E0B' : theme.colors.text.muted }]}>
            {stale ? 'Last confirmed ' : 'Updated '}
            {formatTimeAgo(lastUpdated)}
            {stale ? ' · may be outdated' : ''}
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
        style={[styles.genderCard, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
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
          isPrimary
            ? { backgroundColor: theme.colors.accent }
            : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.accent },
        ]}
      >
        <FontAwesome6
          name={icon}
          size={18}
          color={isPrimary ? '#fff' : theme.colors.accent}
        />
        <Text
          style={[
            styles.actionButtonText,
            {
              color: isPrimary ? '#fff' : theme.colors.accent,
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
  const [showRateSheet, setShowRateSheet] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [location, setLocation] = useState<BidetLocation | null>(null);

  const { user } = useAuthStore();

  // Mutation for updating location status
  const { mutate: updateStatus } = useUpdateBidetStatus();
  const { mutate: confirmStatus, isPending: isConfirming } = useConfirmLocationStatus();

  const handleConfirm = useCallback(() => {
    if (!locationId) return;
    if (!user) {
      setShowSignIn(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    confirmStatus(
      { type: 'bidet', id: locationId, userId: user.uid },
      {
        onSuccess: () =>
          Toast.show({ type: 'success', text1: 'Thanks!', text2: 'You helped keep this fresh.' }),
      }
    );
  }, [locationId, user, confirmStatus]);

  // Cleanliness rating
  const { data: userRating } = useUserRating('bidet', locationId, user?.uid ?? null);
  const { mutate: submitRating, isPending: isRatingSubmitting } = useSubmitCleanlinessRating();

  const ratingCount = location?.cleanlinessCount ?? 0;
  const ratingAvg = ratingCount > 0 ? (location!.cleanlinessSum ?? 0) / ratingCount : 0;

  const handleOpenRate = () => {
    if (!user) {
      setShowSignIn(true);
      return;
    }
    setShowRateSheet(true);
  };

  const handleSubmitRating = (rating: number, note: string) => {
    if (!user || !location) return;
    submitRating(
      { type: 'bidet', id: location.id, userId: user.uid, rating, note },
      {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: 'Thanks for rating!', text2: 'Your cleanliness rating helps the community.' });
          setShowRateSheet(false);
        },
        onError: () => {
          Toast.show({ type: 'error', text1: 'Could not submit', text2: 'Please try again later' });
        },
      }
    );
  };

  // Handle status update from ReportStatusSheet
  const handleStatusUpdate = async (updates: {
    status: 'Available' | 'Unavailable' | 'Unknown';
    statusReason?: string;
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
          statusReason: updates.statusReason,
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
            statusReason: data.statusReason || '',
            lastUpdated: data.lastUpdated || null,
            verifiedBy: data.verifiedBy || [],
            coordinates: data.Coordinates || { latitude: 0, longitude: 0 },
            cleanlinessSum: data.cleanlinessSum || 0,
            cleanlinessCount: data.cleanlinessCount || 0,
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
        backgroundStyle={{ backgroundColor: isDarkMode ? '#080F1E' : '#E8EFFF' }}
        handleIndicatorStyle={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.20)' }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Close Button */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={enter(0)}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
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
            reason={location.statusReason}
            lastUpdated={location.lastUpdated!}
            verified={isLocationVerified(location.verifiedBy)}
            stale={isStatusStale(location.lastUpdated)}
            theme={theme}
            isDarkMode={isDarkMode}
          />

          {/* Still here? — one-tap freshness confirmation */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={isConfirming}
            activeOpacity={0.8}
            style={[styles.confirmBtn, { borderColor: theme.colors.muted }]}
          >
            <FontAwesome6
              name={isConfirming ? 'spinner' : 'circle-check'}
              size={14}
              color={theme.colors.text.success}
            />
            <Text style={[styles.confirmBtnText, { color: theme.colors.text.primary }]}>
              Still here &amp; accurate?
            </Text>
            <Text style={[styles.confirmBtnCta, { color: theme.colors.text.success }]}>Confirm</Text>
          </TouchableOpacity>

          {/* Cleanliness rating */}
          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={enter(0)}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleOpenRate}>
              <BlurView
                intensity={15}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[styles.cleanlinessCard, {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
                }]}
              >
                <View style={styles.cleanlinessLeft}>
                  <FontAwesome6 name="star" size={18} solid color={STAR_COLOR} />
                  {ratingCount > 0 ? (
                    <Text style={[styles.cleanlinessValue, { color: theme.colors.text.primary }]}>
                      {ratingAvg.toFixed(1)}
                      <Text style={[styles.cleanlinessCount, { color: theme.colors.text.muted }]}>
                        {`  ·  ${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`}
                      </Text>
                    </Text>
                  ) : (
                    <Text style={[styles.cleanlinessCount, { color: theme.colors.text.secondary }]}>
                      No cleanliness ratings yet
                    </Text>
                  )}
                </View>
                <View style={[styles.cleanlinessCta, { backgroundColor: theme.colors.accent + '15' }]}>
                  <Text style={[styles.cleanlinessCtaText, { color: theme.colors.accent }]}>
                    {userRating ? 'Edit' : 'Rate'}
                  </Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          </MotiView>

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

          {/* Community Photos */}
          <View style={{ marginTop: 20 }}>
            <LocationPhotos
              type="bidet"
              locationId={location.id}
              onRequireSignIn={() => setShowSignIn(true)}
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
                style={[styles.creditCard, {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
              }]}
              >
                <View style={styles.creditContent}>
                  <Text style={[styles.creditText, { color: theme.colors.text.secondary }]}>
                    Data provided by{' '}
                    <Text style={[styles.creditHandle, { color: theme.colors.accent }]}>
                      @toiletswithbidetsg
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
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Report Status Modal */}
      <BidetReportStatusSheet
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        type="bidet"
        locationId={location.id}
        currentStatus={location.status || 'Unknown'}
        currentStatusReason={location.statusReason || ''}
        currentMale={location.male || 'Unknown'}        // Preserves "Level 4R"
        currentFemale={location.female || 'Unknown'}
        currentHandicap={location.handicap || 'Unknown'}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Cleanliness Rating Modal */}
      <RateLocationSheet
        visible={showRateSheet}
        onClose={() => setShowRateSheet(false)}
        locationName={location.building}
        currentRating={userRating?.rating ?? 0}
        currentNote={userRating?.note ?? ''}
        isSubmitting={isRatingSubmitting}
        onSubmit={handleSubmitRating}
      />

      {/* Sign-in prompt (rating needs an account) */}
      <SignInModal visible={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: 100,
    flexGrow: 1,
  },

  // Cleanliness rating
  cleanlinessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  cleanlinessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  cleanlinessValue: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  cleanlinessCount: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  cleanlinessCta: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cleanlinessCtaText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: '#0EA5E9',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  confirmBtnText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  confirmBtnCta: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
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