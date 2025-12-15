/**
 * MosqueSheet v2.0 - Modern Bottom Sheet for Mosque Details
 * 
 * Displays mosque information with glassmorphism, animations, and haptics.
 * Simplified design (no amenities/status reporting like Bidet/Musollah sheets).
 * 
 * Features:
 * - Distance badge showing proximity from user
 * - Shia indicator badge (when applicable)
 * - Side-by-side action buttons (Open in Maps, Share)
 * - Staggered entrance animations
 * - Haptic feedback on interactions
 * - Glassmorphism cards with BlurView
 * 
 * @version 2.0.0
 * @updated 2025-12-11
 */

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { MosqueLocation } from '../../../api/services/musollah';
import { enter } from '../../../utils';

// ===================================================================
// CONSTANTS
// ===================================================================

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const COLORS = {
  success: '#4CAF50',
  info: '#2196F3',
  warning: '#FFC107',
};

// ===================================================================
// INTERFACES
// ===================================================================

interface MosqueSheetProps {
  location: MosqueLocation | null;
  visible: boolean;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary';
  theme: any;
}

interface DistanceBadgeProps {
  distance: number;
  theme: any;
}

interface ShiaBadgeProps {
  theme: any;
}

// ===================================================================
// UTILITY: Distance Calculation
// ===================================================================

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ===================================================================
// MEMOIZED COMPONENTS
// ===================================================================

const DistanceBadge = React.memo(({ distance, theme }: DistanceBadgeProps) => {
  const distanceText =
    distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
    >
      <BlurView
        intensity={20}
        tint={theme.isDarkMode ? 'dark' : 'light'}
        style={[styles.distanceBadge, { backgroundColor: theme.colors.accent + '15' }]}
      >
        <FontAwesome6 name="location-dot" size={14} color={theme.colors.accent} solid />
        <Text style={[styles.distanceText, { color: theme.colors.accent }]}>
          {distanceText} away
        </Text>
      </BlurView>
    </MotiView>
  );
});

const ShiaBadge = React.memo(({ theme }: ShiaBadgeProps) => (
  <MotiView
    from={{ opacity: 0, translateY: 10 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={enter(0)}
  >
    <BlurView
      intensity={20}
      tint={theme.isDarkMode ? 'dark' : 'light'}
      style={[styles.shiaBadge, { backgroundColor: COLORS.info + '15' }]}
    >
      <View style={[styles.shiaIconCircle, { backgroundColor: COLORS.info + '20' }]}>
        <FontAwesome6 name="circle-info" size={18} color={COLORS.info} solid />
      </View>
      <View style={styles.shiaTextContainer}>
        <Text style={[styles.shiaTitle, { color: theme.colors.text.primary }]}>
          Shia Mosque
        </Text>
        <Text style={[styles.shiaSubtitle, { color: theme.colors.text.secondary }]}>
          This mosque follows Shia traditions
        </Text>
      </View>
    </BlurView>
  </MotiView>
));

const ActionButton = React.memo(
  ({ icon, label, onPress, variant, theme }: ActionButtonProps) => {
    const handlePress = () => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    };

    const isPrimary = variant === 'primary';

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.actionButton,
          isPrimary
            ? { backgroundColor: theme.colors.accent }
            : [styles.secondaryButton, { borderColor: theme.colors.accent }],
        ]}
        activeOpacity={0.8}
      >
        <FontAwesome6
          name={icon}
          size={16}
          color={isPrimary ? '#fff' : theme.colors.accent}
          solid
        />
        <Text
          style={[
            styles.actionButtonText,
            { color: isPrimary ? '#fff' : theme.colors.accent },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
);

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export default function MosqueSheet({
  location,
  onClose,
  visible,
  userLocation,
}: MosqueSheetProps) {
  const { theme } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['45%', '75%'], []);

  // ===================================================================
  // EFFECTS
  // ===================================================================

  useEffect(() => {
    if (!sheetRef.current) return;

    if (visible && location) {
      sheetRef.current.snapToIndex(0);
    } else {
      sheetRef.current.close();
    }
  }, [visible, location]);

  // ===================================================================
  // HANDLERS
  // ===================================================================

  const handleClose = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  const openMaps = useCallback(() => {
    if (!location) return;

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location.building}, ${location.address}`
    )}`;
    Linking.openURL(url);
  }, [location]);

  const shareLocation = useCallback(async () => {
    if (!location) return;

    try {
      await Share.share({
        message: `${location.building}\n${location.address}\n\nhttps://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${location.building}, ${location.address}`
        )}`,
        title: location.building,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [location]);

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================

  const distance = useMemo(() => {
    if (!location || !userLocation) return null;
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      location.coordinates.latitude,
      location.coordinates.longitude
    );
  }, [location, userLocation]);

  const isShia = location?.shia?.toLowerCase() === 'yes';

  // ===================================================================
  // RENDER
  // ===================================================================

  if (!location) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible && location ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={{ backgroundColor: theme.colors.primary }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.text.secondary }}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Close Button */}
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary} solid />
        </TouchableOpacity>

        {/* Mosque Name */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
          style={styles.headerContainer}
        >
          <FontAwesome6 name="mosque" size={24} color={theme.colors.accent} solid />
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {location.building}
          </Text>
        </MotiView>

        {/* Address */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300, delay: 50 }}
        >
          <Text style={[styles.address, { color: theme.colors.text.secondary }]}>
            {location.address}
          </Text>
        </MotiView>

        {/* Distance Badge */}
        {distance !== null && <DistanceBadge distance={distance} theme={theme} />}

        {/* Section Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.text.muted + '20' }]} />

        {/* Shia Badge (if applicable) */}
        {isShia && (
          <>
            <ShiaBadge theme={theme} />
            <View
              style={[styles.divider, { backgroundColor: theme.colors.text.muted + '20' }]}
            />
          </>
        )}

        {/* Action Buttons */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
          style={styles.actionsContainer}
        >
          <ActionButton
            icon="location-dot"
            label="Open in Maps"
            onPress={openMaps}
            variant="primary"
            theme={theme}
          />
          <ActionButton
            icon="share-nodes"
            label="Share"
            onPress={shareLocation}
            variant="secondary"
            theme={theme}
          />
        </MotiView>
      </BottomSheetView>
    </BottomSheet>
  );
}

// ===================================================================
// STYLES
// ===================================================================

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },
  address: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  distanceText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.lg,
  },
  shiaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  shiaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiaTextContainer: {
    flex: 1,
  },
  shiaTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 2,
  },
  shiaSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
});