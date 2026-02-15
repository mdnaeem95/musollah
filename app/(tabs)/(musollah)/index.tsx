/**
 * Musollah Screen (MODERN DESIGN v2.0)
 * 
 * Premium prayer facility finder with:
 * - Glassmorphism UI
 * - Staggered animations
 * - Haptic feedback
 * - Islamic design elements
 * - Prayer-aware content
 * 
 * @version 2.0
 * @updated December 2025
 */

import React, { useEffect, useCallback, memo, useMemo, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, TextInput, Platform, Animated, Easing } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import Map from '../../../components/musollah/Map';
import { createLogger } from '../../../services/logging/logger';
import { useLocationStore } from '../../../stores/useLocationStore';
import { MosqueLocation, LocationUnion } from '../../../api/services/musollah';
import BidetSheet from './BidetSheet';
import MosqueSheet from './MosqueSheet';
import MusollahSheet from './MusollahSheet';
import { useLocationsTab, isBidetLocation, isMusollahLocation, isMosqueLocation} from '../../../hooks/locations/useLocationsTab';
import AddLocationSheet from '../../../components/musollah/AddLocationSheet';
import { enter } from '../../../utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOCATION_TYPES = ['Bidets', 'Musollahs', 'Mosques'] as const;

const LOCATION_ICONS: Record<string, string> = {
  Bidets: 'toilet',
  Musollahs: 'person-praying',
  Mosques: 'mosque',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// ============================================================================
// CUSTOM SEARCH BAR (Glassmorphism)
// ============================================================================

interface CustomSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder: string;
  theme: any;
  isDarkMode: boolean;
}

const CustomSearchBar = memo(function CustomSearchBar({
  value,
  onChangeText,
  onClear,
  placeholder,
  theme,
  isDarkMode,
}: CustomSearchBarProps) {
  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClear();
  }, [onClear]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.searchContainer, { backgroundColor: theme.colors.secondary }]}
      >
        {/* Search Icon */}
        <View style={[styles.searchIconContainer, { backgroundColor: theme.colors.accent }]}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#fff" />
        </View>

        {/* Input */}
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.muted}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <FontAwesome6 name="circle-xmark" size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </BlurView>
    </MotiView>
  );
});

// ============================================================================
// CUSTOM SEGMENTED CONTROL (Premium Pills)
// ============================================================================

interface PremiumSegmentedControlProps {
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  theme: any;
  isDarkMode: boolean;
}

const PremiumSegmentedControl = memo(function PremiumSegmentedControl({
  selectedIndex,
  onIndexChange,
  theme,
  isDarkMode,
}: PremiumSegmentedControlProps) {
  const handlePress = useCallback(
    (index: number) => {
      if (index !== selectedIndex) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onIndexChange(index);
      }
    },
    [selectedIndex, onIndexChange]
  );

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
    >
      <BlurView
        intensity={15}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.segmentedContainer, { backgroundColor: theme.colors.secondary }]}
      >
        {LOCATION_TYPES.map((type, index) => {
          const isSelected = index === selectedIndex;
          const icon = LOCATION_ICONS[type];

          return (
            <AnimatedSegmentButton
              key={type}
              type={type}
              icon={icon}
              isSelected={isSelected}
              onPress={() => handlePress(index)}
              accentColor={theme.colors.accent}
              textSecondary={theme.colors.text.secondary}
            />
          );
        })}
      </BlurView>
    </MotiView>
  );
});

interface AnimatedSegmentButtonProps {
  type: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
  accentColor: string;
  textSecondary: string;
}

const AnimatedSegmentButton = memo(function AnimatedSegmentButton({
  type,
  icon,
  isSelected,
  onPress,
  accentColor,
  textSecondary,
}: AnimatedSegmentButtonProps) {
  // Animated value for background color
  const animatedBg = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  
  // Animated value for text/icon opacity (for smooth color transition)
  const animatedColor = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedBg, {
        toValue: isSelected ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // backgroundColor doesn't support native driver
      }),
      Animated.timing(animatedColor, {
        toValue: isSelected ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [isSelected, animatedBg, animatedColor]);

  // Interpolate background color
  const backgroundColor = animatedBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', accentColor],
  });

  // Interpolate text color
  const color = animatedColor.interpolate({
    inputRange: [0, 1],
    outputRange: [textSecondary, '#FFFFFF'],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.segmentButton}
    >
      <Animated.View
        style={[
          styles.segmentInner,
          { backgroundColor },
        ]}
      >
        <Animated.Text style={{ color }}>
          <FontAwesome6
            name={icon}
            size={14}
            color={isSelected ? '#FFFFFF' : textSecondary}
          />
        </Animated.Text>
        <Animated.Text
          style={[
            styles.segmentText,
            {
              color,
              fontFamily: isSelected ? 'Outfit_600SemiBold' : 'Outfit_500Medium',
            },
            isSelected && styles.segmentTextActive,
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {type}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ============================================================================
// LOCATION ITEM (Glassmorphism Card)
// ============================================================================

interface LocationItemProps {
  item: LocationUnion;
  index: number;
  onPress: (location: LocationUnion) => void;
  theme: any;
  isDarkMode: boolean;
}

const LocationItem = memo(function LocationItem({
  item,
  index,
  onPress,
  theme,
  isDarkMode,
}: LocationItemProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(item);
  }, [item, onPress]);

  // Get status color for bidets/musollahs
  const statusInfo = useMemo(() => {
    if ('status' in item) {
      switch (item.status) {
        case 'Available':
          return { color: '#4CAF50', label: 'Available', icon: 'circle-check' };
        case 'Unavailable':
          return { color: '#ff6b6b', label: 'Unavailable', icon: 'circle-xmark' };
        default:
          return { color: '#9CA3AF', label: 'Unknown', icon: 'circle-question' };
      }
    }
    return null;
  }, [item]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.locationCard, { backgroundColor: theme.colors.secondary }]}
        >
          <View style={styles.locationCardContent}>
            {/* Left: Info */}
            <View style={styles.locationInfo}>
              <Text
                style={[styles.locationName, { color: theme.colors.text.primary }]}
                numberOfLines={1}
              >
                {item.building || 'Unknown Location'}
              </Text>
              <Text
                style={[styles.locationAddress, { color: theme.colors.text.secondary }]}
                numberOfLines={1}
              >
                {item.address || 'No address'}
              </Text>

              {/* Status Badge (if applicable) */}
              {statusInfo && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusInfo.color + '15' },
                  ]}
                >
                  <FontAwesome6
                    name={statusInfo.icon}
                    size={10}
                    color={statusInfo.color}
                  />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Right: Distance + Arrow */}
            <View style={styles.locationMeta}>
              <View style={[styles.distanceBadge, { backgroundColor: theme.colors.accent }]}>
                <FontAwesome6 name="location-dot" size={12} color="#fff" />
                <Text style={styles.distanceText}>
                  {item.distance !== undefined
                    ? item.distance < 1
                      ? `${Math.round(item.distance * 1000)}m`
                      : `${item.distance.toFixed(1)} km`
                    : '--'}
                </Text>
              </View>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
});

// ============================================================================
// STATS HEADER (Quick Info)
// ============================================================================

interface StatsHeaderProps {
  locationCount: number;
  nearestDistance?: number;
  theme: any;
  isDarkMode: boolean;
}

const StatsHeader = memo(function StatsHeader({
  locationCount,
  nearestDistance,
  theme,
  isDarkMode,
}: StatsHeaderProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
      style={styles.statsContainer}
    >
      <BlurView
        intensity={15}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.statCard, { backgroundColor: theme.colors.secondary }]}
      >
        <FontAwesome6 name="location-dot" size={16} color={theme.colors.accent} />
        <View>
          <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
            {locationCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
            Found
          </Text>
        </View>
      </BlurView>

      {nearestDistance !== undefined && (
        <BlurView
          intensity={15}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.statCard, { backgroundColor: theme.colors.secondary }]}
        >
          <FontAwesome6 name="bullseye" size={16} color={theme.colors.accent} />
          <View>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {nearestDistance < 1
                ? `${Math.round(nearestDistance * 1000)}m`
                : `${nearestDistance.toFixed(1)}km`}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Nearest
            </Text>
          </View>
        </BlurView>
      )}
    </MotiView>
  );
});

// ============================================================================
// EMPTY STATE (Premium)
// ============================================================================

interface EmptyStateProps {
  type: string;
  isSearching: boolean;
  theme: any;
}

const EmptyState = memo(function EmptyState({ type, isSearching, theme }: EmptyStateProps) {
  const icon = LOCATION_ICONS[type] || 'location-dot';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
      style={styles.emptyContainer}
    >
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.accent + '15' }]}>
        <FontAwesome6 name={icon} size={48} color={theme.colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {isSearching ? 'No Results Found' : `No ${type} Nearby`}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {isSearching
          ? 'Try adjusting your search terms'
          : `We couldn't find any ${type.toLowerCase()} in your area`}
      </Text>
    </MotiView>
  );
});

// ============================================================================
// ERROR STATE (Premium)
// ============================================================================

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  theme: any;
}

const ErrorState = memo(function ErrorState({ error, onRetry, theme }: ErrorStateProps) {
  const handleRetry = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onRetry();
  }, [onRetry]);

  return (
    <View style={styles.errorContainer}>
      <View style={[styles.errorIconContainer, { backgroundColor: '#ff6b6b15' }]}>
        <FontAwesome6 name="triangle-exclamation" size={48} color="#ff6b6b" />
      </View>
      <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
        Something Went Wrong
      </Text>
      <Text style={[styles.errorSubtitle, { color: theme.colors.text.secondary }]}>
        {error?.message || 'Unable to load locations'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
        onPress={handleRetry}
      >
        <FontAwesome6 name="arrow-rotate-right" size={14} color="#fff" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
});

// ============================================================================
// LOCATION PERMISSION PROMPT (Premium)
// ============================================================================

interface LocationPermissionPromptProps {
  onRequestPermission: () => void;
  theme: any;
}

const LocationPermissionPrompt = memo(function LocationPermissionPrompt({
  onRequestPermission,
  theme,
}: LocationPermissionPromptProps) {
  const handleRequest = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRequestPermission();
  }, [onRequestPermission]);

  return (
    <View style={styles.permissionContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={enter(0)}
        style={styles.permissionContent}
      >
        <View style={[styles.permissionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name="location-crosshairs" size={48} color={theme.colors.accent} />
        </View>
        <Text style={[styles.permissionTitle, { color: theme.colors.text.primary }]}>
          Location Access Needed
        </Text>
        <Text style={[styles.permissionSubtitle, { color: theme.colors.text.secondary }]}>
          We need your location to find nearby prayer facilities and calculate accurate distances
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.colors.accent }]}
          onPress={handleRequest}
        >
          <FontAwesome6 name="location-dot" size={16} color="#fff" />
          <Text style={styles.permissionButtonText}>Enable Location</Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const logger = createLogger('Musollah');

export default function MusollahScreen() {
  const { theme, isDarkMode } = useTheme();
  const { userLocation, fetchLocation, isLoading: locationLoading } = useLocationStore();
  const [isAddLocationSheetVisible, setIsAddLocationSheetVisible] = useState(false);

  const handleOpenAddLocation = () => {
    setIsAddLocationSheetVisible(true);
  };

  const {
    selectedIndex,
    setSelectedIndex,
    searchQuery,
    setSearchQuery,
    filteredLocations,
    region,
    selectedLocation,
    isSheetVisible,
    handleSelectLocation,
    handleCloseSheet,
    isLoading,
    isError,
    error,
    clearSearch,
    locationCount,
  } = useLocationsTab(userLocation);

  // Calculate nearest distance
  const nearestDistance = useMemo(() => {
    if (filteredLocations.length > 0 && filteredLocations[0].distance !== undefined) {
      return filteredLocations[0].distance;
    }
    return undefined;
  }, [filteredLocations]);

  // Fetch user location on mount
  useEffect(() => {
    if (!userLocation && !locationLoading) {
      logger.info('Requesting user location...');
      fetchLocation();
    }
  }, [userLocation, locationLoading, fetchLocation]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Render location item
  const renderItem = useCallback(
    ({ item, index }: { item: LocationUnion; index: number }) => (
      <LocationItem
        item={item}
        index={index}
        onPress={handleSelectLocation}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    ),
    [handleSelectLocation, theme, isDarkMode]
  );

  // Key extractor
  const keyExtractor = useCallback((item: LocationUnion) => item.id, []);

  // Main render
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <Map
            region={region}
            markerLocations={filteredLocations}
            onMarkerPress={handleSelectLocation}
            onAddLocationPress={handleOpenAddLocation}
            shouldFollowUserLocation
            onRegionChangeComplete={() => {}}
            onRefocusPress={() => {}}
            locationType={LOCATION_TYPES[selectedIndex]}
          />

          <AddLocationSheet
            visible={isAddLocationSheetVisible}
            onClose={() => setIsAddLocationSheetVisible(false)}
          />
        </View>

        {/* Search Bar Overlay */}
        <View
          pointerEvents={isSheetVisible ? 'none' : 'auto'}
          style={[
            styles.searchOverlay,
            isSheetVisible && styles.searchOverlayBehind,
          ]}
        >
          <CustomSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={clearSearch}
            placeholder={`Search ${LOCATION_TYPES[selectedIndex].toLowerCase()}...`}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Bottom Sheet Container */}
        <View style={styles.bottomSheet}>
          <BlurView
            intensity={40}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.bottomSheetInner, { backgroundColor: theme.colors.primary }]}
          >
            {/* Handle Bar */}
            <View style={styles.handleContainer}>
              <View style={[styles.handleBar, { backgroundColor: theme.colors.text.muted }]} />
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentedWrapper}>
              <PremiumSegmentedControl
                selectedIndex={selectedIndex}
                onIndexChange={setSelectedIndex}
                theme={theme}
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Location Banner - shown when using default Singapore location */}
            {!userLocation && !locationLoading && (
              <TouchableOpacity
                style={[styles.locationBanner, { backgroundColor: theme.colors.accent }]}
                onPress={fetchLocation}
                activeOpacity={0.8}
              >
                <FontAwesome6 name="location-crosshairs" size={14} color="#fff" />
                <Text style={styles.locationBannerText}>
                  Showing central Singapore. Tap to enable location.
                </Text>
              </TouchableOpacity>
            )}

            {/* Stats */}
            <StatsHeader
              locationCount={locationCount}
              nearestDistance={nearestDistance}
              theme={theme}
              isDarkMode={isDarkMode}
            />

            {/* Content */}
            {isError ? (
              <ErrorState error={error} onRetry={handleRetry} theme={theme} />
            ) : isLoading ? (
              <View style={styles.listLoadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
              </View>
            ) : filteredLocations.length === 0 ? (
              <EmptyState
                type={LOCATION_TYPES[selectedIndex]}
                isSearching={searchQuery.length > 0}
                theme={theme}
              />
            ) : (
              <FlashList
                data={filteredLocations}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.flashListContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </BlurView>
        </View>
      </View>

      {/* Detail Sheets */}
      {selectedIndex === 0 && selectedLocation && isBidetLocation(selectedLocation) && (
        <BidetSheet
          locationId={selectedLocation.id}
          visible={isSheetVisible}
          onClose={handleCloseSheet}
        />
      )}

      {selectedIndex === 1 && selectedLocation && isMusollahLocation(selectedLocation) && (
        <MusollahSheet
          locationId={selectedLocation.id}
          visible={isSheetVisible}
          onClose={handleCloseSheet}
        />
      )}

      {selectedIndex === 2 && selectedLocation && isMosqueLocation(selectedLocation) && (
        <MosqueSheet
          location={selectedLocation as MosqueLocation}
          visible={isSheetVisible}
          onClose={handleCloseSheet}
        />
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },

  // Location Banner
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
  },
  locationBannerText: {
    flex: 1,
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: '#fff',
  },

  // Search Overlay
  searchOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: SPACING.xl,
    right: SPACING.xl,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  clearButton: {
    padding: SPACING.xs,
  },
  searchOverlayBehind: {
    zIndex: 0,
    elevation: 0,   // Android: critical
    opacity: 0,     // optional: hide it while sheet open
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetInner: {
    flex: 1,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },

  // Segmented Control
  segmentedWrapper: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
  },
  segmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 13,
  },
  segmentTextActive: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Stats Header
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
  },

  // Location Card
  locationCard: {
    marginHorizontal: SPACING.xl,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  locationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  locationInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  locationName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    lineHeight: 22,
  },
  locationAddress: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: SPACING.xs,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  locationMeta: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
  },
  distanceText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
  },

  // List
  separator: {
    height: SPACING.md,
  },
  flashListContent: {
    paddingBottom: 100,
  },
  listLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  loadingText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: SPACING.md,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: SPACING.md,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },

  // Permission Prompt
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionContent: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  permissionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  permissionTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  permissionButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});