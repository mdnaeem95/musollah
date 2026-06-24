/**
 * Musollah Sheet (MODERN DESIGN v2.0)
 * 
 * Premium bottom sheet with:
 * - Glassmorphism UI
 * - Staggered animations
 * - Haptic feedback
 * - Amenities grid
 * - Expandable directions
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
import { formatTimeAgo, getStatusColor } from '../../../utils/musollah';
import MusollahReportStatusSheet from './MusollahReportStatusSheet';
import RateLocationSheet from './RateLocationSheet';
import {
  MusollahLocation,
  useUpdateMusollahStatus,
  useUserRating,
  useSubmitCleanlinessRating,
  useConfirmLocationStatus,
  isLocationVerified,
  isStatusStale,
} from '../../../api/services/musollah';
import { useAuthStore } from '../../../stores/useAuthStore';
import SignInModal from '../../../components/SignInModal';
import LocationPhotos from '../../../components/musollah/LocationPhotos';
import { useIsFavorite, useLocationFavoritesStore } from '../../../stores/useLocationFavoritesStore';
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

interface MusollahSheetProps {
  locationId: string | null;
  visible: boolean;
  onClose: () => void;
}

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

// Status Badge Component
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

// Amenity Card Component (Match BidetSheet style)
const AmenityCard = React.memo(
  ({ icon, label, available, theme, isDarkMode, index }: any) => {
    const isYes = available?.toLowerCase() === 'yes';
    const statusColor = isYes ? '#4CAF50' : '#ff6b6b';

    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={enter(0)}
        style={styles.amenityCardWrapper}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.amenityCard, {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          }]}
        >
          {/* Icon Circle - Larger like BidetSheet */}
          <View
            style={[
              styles.amenityIconContainer,
              { backgroundColor: `${theme.colors.accent}15` },
            ]}
          >
            <FontAwesome6 name={icon} size={24} color={theme.colors.accent} />
          </View>

          {/* Label */}
          <Text
            style={[styles.amenityLabel, { color: theme.colors.text.primary }]}
            numberOfLines={2}
          >
            {label}
          </Text>

          {/* Status Icon - Larger like BidetSheet */}
          <View style={[styles.amenityStatus, { backgroundColor: `${statusColor}15` }]}>
            <FontAwesome6
              name={isYes ? 'check' : 'xmark'}
              size={18}
              color={statusColor}
            />
          </View>
        </BlurView>
      </MotiView>
    );
  }
);

// Directions Section Component
const DirectionsSection = React.memo(
  ({ directions, expanded, onToggle, theme, isDarkMode }: any) => {
    const handleToggle = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle();
    }, [onToggle]);

    const directionSteps = directions?.split('. ').filter((step: string) => step.trim().length > 0) || [];

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(0)}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.directionsCard, {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          }]}
        >
          <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
            <View style={styles.directionsHeader}>
              <View style={styles.directionsHeaderLeft}>
                <View
                  style={[
                    styles.directionsIcon,
                    { backgroundColor: `${theme.colors.accent}20` },
                  ]}
                >
                  <FontAwesome6 name="route" size={16} color={theme.colors.accent} />
                </View>
                <Text style={[styles.directionsTitle, { color: theme.colors.text.primary }]}>
                  Directions
                </Text>
              </View>
              <FontAwesome6
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.text.secondary}
              />
            </View>
          </TouchableOpacity>

          {expanded && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.directionsContent}
            >
              {directionSteps.map((step: string, i: number) => (
                <View key={i} style={styles.directionStep}>
                  <View
                    style={[
                      styles.stepNumber,
                      { backgroundColor: theme.colors.accent },
                    ]}
                  >
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: theme.colors.text.secondary }]}>
                    {step.trim()}
                  </Text>
                </View>
              ))}
            </MotiView>
          )}
        </BlurView>
      </MotiView>
    );
  }
);

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

const logger = createLogger('Musollah Sheet');

export default function MusollahSheet({ onClose, visible, locationId }: MusollahSheetProps) {
  logger.debug('locationId:', { locationId });
  const { theme, isDarkMode } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '85%'], []);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showRateSheet, setShowRateSheet] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [expandedDirections, setExpandedDirections] = useState(false);
  const [location, setLocation] = useState<MusollahLocation | null>(null);

  const { user } = useAuthStore();

  const isFav = useIsFavorite('musollah', locationId ?? '');
  const toggleFavorite = useLocationFavoritesStore((s) => s.toggleFavorite);

  // Mutation for updating location status
  const { mutate: updateStatus } = useUpdateMusollahStatus();
  const { mutate: confirmStatus, isPending: isConfirming } = useConfirmLocationStatus();

  const handleConfirm = useCallback(() => {
    if (!locationId) return;
    if (!user) {
      setShowSignIn(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    confirmStatus(
      { type: 'musollah', id: locationId, userId: user.uid },
      {
        onSuccess: () =>
          Toast.show({ type: 'success', text1: 'Thanks!', text2: 'You helped keep this fresh.' }),
      }
    );
  }, [locationId, user, confirmStatus]);

  // Cleanliness rating
  const { data: userRating } = useUserRating('musollah', locationId, user?.uid ?? null);
  const { mutate: submitRating, isPending: isRatingSubmitting } = useSubmitCleanlinessRating();

  const ratingCount = location?.cleanlinessCount ?? 0;
  const ratingAvg = ratingCount > 0 ? (location!.cleanlinessSum ?? 0) / ratingCount : 0;

  const handleOpenRate = useCallback(() => {
    if (!user) {
      setShowSignIn(true);
      return;
    }
    setShowRateSheet(true);
  }, [user]);

  const handleSubmitRating = useCallback(
    (rating: number, note: string) => {
      if (!user || !location) return;
      submitRating(
        { type: 'musollah', id: location.id, userId: user.uid, rating, note },
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
    },
    [user, location, submitRating]
  );

  // Handle status update from ReportStatusSheet. Forwards the amenity edits too
  // (they were previously dropped — only status was written).
  const handleStatusUpdate = async (updates: {
    status: 'Available' | 'Unavailable' | 'Unknown';
    statusReason?: string;
    segregated?: any;
    airConditioned?: any;
    ablutionArea?: any;
    slippers?: any;
    prayerMats?: any;
    telekung?: any;
    accessible?: any;
  }) => {
    if (!location) return;

    try {
      updateStatus(
        {
          id: location.id,
          status: updates.status,
          statusReason: updates.statusReason,
          segregated: updates.segregated,
          airConditioned: updates.airConditioned,
          ablutionArea: updates.ablutionArea,
          slippers: updates.slippers,
          prayerMats: updates.prayerMats,
          telekung: updates.telekung,
          accessible: updates.accessible,
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
      .collection('Musollahs')
      .doc(locationId)
      .onSnapshot((doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (!data) return;
          const normalized: MusollahLocation = {
            id: doc.id,
            building: data.Building || '',
            address: data.Address || '',
            segregated: data.Segregated || 'No',
            airConditioned: data.AirConditioned || 'No',
            ablutionArea: data.AblutionArea || 'No',
            slippers: data.Slippers || 'No',
            prayerMats: data.PrayerMats || 'No',
            telekung: data.Telekung || 'No',
            accessible: data.Accessible || 'No',
            directions: data.Directions || '',
            coordinates: data.Coordinates || { latitude: 0, longitude: 0 },
            status: data.status || 'Unknown',
            statusReason: data.statusReason || '',
            lastUpdated: data.lastUpdated || null,
            verifiedBy: data.verifiedBy || [],
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

  // Open in Maps
  const openMaps = useCallback(() => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location.building}, ${location.address}`
    )}`;
    Linking.openURL(url);
  }, [location]);

  // Close with haptic feedback
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
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
        style={{ zIndex: 999 }}  // ✅ Fix: Appear above search bar
      >
        <BottomSheetScrollView  // ✅ Changed from BottomSheetView to enable scrolling
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
              <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </MotiView>

          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={enter(0)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                  {location.building}
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                  {location.address}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleFavorite('musollah', location.id);
                }}
                hitSlop={10}
                style={styles.favBtn}
              >
                <FontAwesome6 name="heart" size={20} color={isFav ? '#ef4444' : theme.colors.text.muted} solid={isFav} />
              </TouchableOpacity>
            </View>
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

          {/* Amenities Section Header */}
          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={enter(0)}
            style={styles.sectionHeaderContainer}
          >
            <View style={[styles.sectionIconCircle, { backgroundColor: `${theme.colors.accent}15` }]}>
              <FontAwesome6 name="mosque" size={16} color={theme.colors.accent} />
            </View>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.text.primary }]}>
              Amenities
            </Text>
          </MotiView>

          {/* Amenities Grid - 2 rows x 3 columns */}
          <View style={styles.amenitiesGrid}>
            {/* Row 1: Segregated, Air Conditioned, Ablution Area */}
            <View style={styles.amenityRow}>
              <AmenityCard
                icon="users"
                label="Segregated"
                available={location.segregated}
                theme={theme}
                isDarkMode={isDarkMode}
                index={0}
              />
              <AmenityCard
                icon="snowflake"
                label="Air Conditioned"
                available={location.airConditioned}
                theme={theme}
                isDarkMode={isDarkMode}
                index={1}
              />
              <AmenityCard
                icon="droplet"
                label="Ablution Area"
                available={location.ablutionArea}
                theme={theme}
                isDarkMode={isDarkMode}
                index={2}
              />
            </View>

            {/* Row 2: Slippers, Prayer Mats, Telekung */}
            <View style={styles.amenityRow}>
              <AmenityCard
                icon="shoe-prints"
                label="Slippers"
                available={location.slippers}
                theme={theme}
                isDarkMode={isDarkMode}
                index={3}
              />
              <AmenityCard
                icon="rug"
                label="Prayer Mats"
                available={location.prayerMats}
                theme={theme}
                isDarkMode={isDarkMode}
                index={4}
              />
              <AmenityCard
                icon="person-dress"
                label="Telekung"
                available={location.telekung}
                theme={theme}
                isDarkMode={isDarkMode}
                index={5}
              />
            </View>

            {/* Row 3: Accessibility */}
            <View style={styles.amenityRow}>
              <AmenityCard
                icon="wheelchair"
                label="Wheelchair"
                available={location.accessible}
                theme={theme}
                isDarkMode={isDarkMode}
                index={6}
              />
            </View>
          </View>

          {/* Directions Section */}
          {location.directions && (
            <DirectionsSection
              directions={location.directions}
              expanded={expandedDirections}
              onToggle={() => setExpandedDirections(!expandedDirections)}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Community Photos */}
          <View style={{ marginTop: 20 }}>
            <LocationPhotos
              type="musollah"
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
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Report Status Modal */}
      <MusollahReportStatusSheet
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        locationId={location.id}
        currentStatus={location.status || 'Unknown'}
        currentStatusReason={location.statusReason || ''}
        currentSegregated={location.segregated as any}
        currentAirConditioned={location.airConditioned as any}
        currentAblutionArea={location.ablutionArea as any}
        currentSlippers={location.slippers as any}
        currentPrayerMats={location.prayerMats as any}
        currentTelekung={location.telekung as any}
        currentAccessible={location.accessible as any}
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
    paddingBottom: 100,  // ✅ Increased from SPACING.xxl (24) to 100 for better spacing
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Header
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    marginBottom: SPACING.xs,
  },
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    marginBottom: SPACING.lg,
  },

  // Status Badge
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

  // Section Header
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Amenities Grid - Match BidetSheet style
  amenitiesGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  amenityRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  amenityCardWrapper: {
    flex: 1,
  },
  amenityCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,  // ✅ Fixed height instead of minHeight for consistency
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  amenityIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  amenityLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 18,
    height: 36,  // ✅ Fixed height to accommodate 2 lines of text
  },
  amenityStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Directions Section
  directionsCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  directionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  directionsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  directionsContent: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  directionStep: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
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
});