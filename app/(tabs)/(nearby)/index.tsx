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
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Platform, Animated, Easing, FlatList } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import Map, { MapMarkerLike, MarkerKind } from '../../../components/musollah/Map';
import { createLogger } from '../../../services/logging/logger';
import { useLocationStore } from '../../../stores/useLocationStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useNearbyFocusStore, NearbyFocusKind } from '../../../stores/useNearbyFocusStore';
import { useAccent } from '../../../hooks/useAccent';
import { MosqueLocation, LocationUnion } from '../../../api/services/musollah';
import { useFoodTab } from '../../../hooks/food/useFoodTab';
import {
  useUserFavorites,
  useToggleFavorite,
  calculateDistance,
  Restaurant,
} from '../../../api/services/food';
import RestaurantCard from '../../../components/food/RestaurantCard';
import CategoryPill from '../../../components/food/CategoryPill';
import SignInModal from '../../../components/SignInModal';
import BidetSheet from './BidetSheet';
import MosqueSheet from './MosqueSheet';
import MusollahSheet from './MusollahSheet';
import { useLocationsTab, isBidetLocation, isMusollahLocation, isMosqueLocation} from '../../../hooks/locations/useLocationsTab';
import AddLocationSheet from '../../../components/musollah/AddLocationSheet';
import { enter } from '../../../utils';

// ============================================================================
// CONSTANTS
// ============================================================================

// Layer order MUST match INDEX_TO_TYPE in useLocationsTab.
const LOCATION_TYPES = ['All', 'Food', 'Musollahs', 'Mosques', 'Bidets'] as const;

const LOCATION_ICONS: Record<string, string> = {
  All: 'layer-group',
  Food: 'utensils',
  Bidets: 'toilet',
  Musollahs: 'person-praying',
  Mosques: 'mosque',
};

// Per-kind metadata for the combined "All" list rows + cluster colours.
const KIND_META: Record<MarkerKind, { icon: string; label: string; color: string }> = {
  food: { icon: 'utensils', label: 'Halal Food', color: '#F97316' },
  musollah: { icon: 'person-praying', label: 'Musollah', color: '#22C55E' },
  mosque: { icon: 'mosque', label: 'Mosque', color: '#0EA5E9' },
  bidet: { icon: 'toilet', label: 'Bidet', color: '#8B5CF6' },
};

// Cluster bubble colour per single-type layer (the 'All' layer uses the accent).
const CLUSTER_COLORS: Record<string, string> = {
  food: '#F97316',
  musollah: '#22C55E',
  mosque: '#0EA5E9',
  bidet: '#8B5CF6',
};

// A row in the combined "All" list.
interface AllListItem {
  kind: MarkerKind;
  id: string;
  title: string;
  subtitle: string;
  distanceKm: number;
  image?: string;
  raw: Restaurant | LocationUnion;
}

// Food layer sort options (parity with the old Food tab).
type FoodSortOption = 'distance' | 'rating' | 'name';

const FOOD_SORTS: { key: FoodSortOption; label: string; icon: string }[] = [
  { key: 'distance', label: 'Distance', icon: 'location-arrow' },
  { key: 'rating', label: 'Rating', icon: 'star' },
  { key: 'name', label: 'Name', icon: 'arrow-down-a-z' },
];

// Maps a facility focus (from unified search) to its segmented-control layer.
const FOCUS_KIND_TO_TYPE: Record<NearbyFocusKind, typeof LOCATION_TYPES[number]> = {
  musollah: 'Musollahs',
  mosque: 'Mosques',
  bidet: 'Bidets',
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
        style={[styles.segmentedContainer, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
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
  // Animated background fill for the active pill.
  const animatedBg = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedBg, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // backgroundColor doesn't support native driver
    }).start();
  }, [isSelected, animatedBg]);

  const backgroundColor = animatedBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', accentColor],
  });

  // Only the active segment shows its label; the rest stay icon-only. The
  // active pill grows wider so the whole bar never crowds four labels in a row.
  return (
    <MotiView
      animate={{ flex: isSelected ? 2.3 : 1 }}
      transition={{ type: 'timing', duration: 240 }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.segmentButton}
      >
        <Animated.View style={[styles.segmentInner, { backgroundColor }]}>
          <FontAwesome6
            name={icon}
            size={15}
            color={isSelected ? '#FFFFFF' : textSecondary}
          />
          {isSelected && (
            <MotiView
              from={{ opacity: 0, translateX: -6 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 200 }}
            >
              <Text
                style={[styles.segmentText, styles.segmentTextActive, {
                  color: '#FFFFFF',
                  fontFamily: 'Outfit_600SemiBold',
                }]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {type}
              </Text>
            </MotiView>
          )}
        </Animated.View>
      </TouchableOpacity>
    </MotiView>
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
          style={[styles.locationCard, {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          }]}
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
        style={[styles.statCard, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
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
          style={[styles.statCard, {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          }]}
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
// FOOD FILTER HEADER (category chips + sort — Food layer only)
// ============================================================================

interface FoodFilterHeaderProps {
  categories: string[];
  categoryCounts: Record<string, number>;
  selectedCategories: string[];
  onCategorySelect: (category: string) => void;
  sortBy: FoodSortOption;
  onSortChange: (sort: FoodSortOption) => void;
  theme: any;
  accent: string;
}

const FoodFilterHeader = memo(function FoodFilterHeader({
  categories,
  categoryCounts,
  selectedCategories,
  onCategorySelect,
  sortBy,
  onSortChange,
  theme,
  accent,
}: FoodFilterHeaderProps) {
  const renderChip = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <CategoryPill
        category={item}
        count={categoryCounts[item] ?? 0}
        isSelected={selectedCategories.includes(item)}
        onPress={() => onCategorySelect(item)}
        index={index}
      />
    ),
    [categoryCounts, selectedCategories, onCategorySelect]
  );

  return (
    <View style={styles.foodFilterHeader}>
      {categories.length > 0 && (
        <FlatList
          data={categories}
          horizontal
          keyExtractor={(c) => c}
          renderItem={renderChip}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foodChipsContent}
          style={styles.foodChipsList}
        />
      )}

      <View style={styles.foodSortRow}>
        {FOOD_SORTS.map(({ key, label, icon }) => {
          const active = sortBy === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSortChange(key);
              }}
              activeOpacity={0.7}
              style={[
                styles.foodSortBtn,
                {
                  backgroundColor: active ? accent + '20' : 'transparent',
                  borderColor: active ? accent : theme.colors.muted,
                },
              ]}
            >
              <FontAwesome6
                name={icon}
                size={12}
                color={active ? accent : theme.colors.text.secondary}
              />
              <Text
                style={[
                  styles.foodSortText,
                  { color: active ? accent : theme.colors.text.secondary },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

// ============================================================================
// ALL-LAYER LIST ROW (mixed food + facilities)
// ============================================================================

interface AllPlaceRowProps {
  item: AllListItem;
  onPress: () => void;
  theme: any;
  isDarkMode: boolean;
}

const AllPlaceRow = memo(function AllPlaceRow({ item, onPress, theme, isDarkMode }: AllPlaceRowProps) {
  const meta = KIND_META[item.kind];
  const distanceLabel =
    isFinite(item.distanceKm)
      ? item.distanceKm < 1
        ? `${Math.round(item.distanceKm * 1000)}m`
        : `${item.distanceKm.toFixed(1)}km`
      : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.allRow, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
      >
        <View style={[styles.allIconTile, { backgroundColor: meta.color + '1A' }]}>
          <FontAwesome6 name={meta.icon} size={18} color={meta.color} />
        </View>

        <View style={styles.allRowInfo}>
          <Text style={[styles.allRowTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.allKindBadge, { backgroundColor: meta.color + '18' }]}>
            <Text style={[styles.allKindBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {distanceLabel && (
          <View style={[styles.allDistanceBadge, { backgroundColor: meta.color }]}>
            <FontAwesome6 name="location-dot" size={10} color="#fff" />
            <Text style={styles.allDistanceText}>{distanceLabel}</Text>
          </View>
        )}
      </BlurView>
    </TouchableOpacity>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const logger = createLogger('Nearby');

export default function NearbyScreen() {
  const { theme, isDarkMode } = useTheme();
  const { accent } = useAccent();
  const router = useRouter();
  const { user } = useAuthStore();
  const { userLocation, fetchLocation, isLoading: locationLoading } = useLocationStore();
  const [isAddLocationSheetVisible, setIsAddLocationSheetVisible] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleOpenAddLocation = () => {
    setIsAddLocationSheetVisible(true);
  };

  const {
    selectedIndex,
    setSelectedIndex,
    searchQuery,
    filteredLocations,
    region,
    selectedLocation,
    isSheetVisible,
    handleSelectLocation,
    handleCloseSheet,
    isLoading,
    isError,
    error,
    locationCount,
    locationType,
    allFacilities,
  } = useLocationsTab(userLocation);

  // Unified-search hand-off: when a facility is picked in the search modal,
  // switch to its layer and open its sheet once the layer's data is active.
  const focus = useNearbyFocusStore((s) => s.focus);
  const clearFocus = useNearbyFocusStore((s) => s.clearFocus);
  useEffect(() => {
    if (!focus) return;
    const targetIndex = LOCATION_TYPES.indexOf(FOCUS_KIND_TO_TYPE[focus.kind]);
    if (targetIndex < 0) {
      clearFocus();
      return;
    }
    if (selectedIndex !== targetIndex) {
      setSelectedIndex(targetIndex);
      return; // wait for the layer's data to become active
    }
    const loc = filteredLocations.find((l) => l.id === focus.id);
    if (loc) {
      handleSelectLocation(loc);
      clearFocus();
    } else if (!isLoading) {
      clearFocus(); // stale id or filtered out — give up quietly
    }
  }, [focus, selectedIndex, filteredLocations, handleSelectLocation, setSelectedIndex, isLoading, clearFocus]);

  // Food layer (its own data source — restaurants, distance, favourites).
  const {
    restaurants,
    categories,
    categoryCounts,
    selectedCategories,
    handleCategorySelect,
    getRestaurantDistance,
    userCoords,
    isLoading: foodLoading,
  } = useFoodTab();
  const { data: favorites = [] } = useUserFavorites(user?.uid || null);
  const { mutate: toggleFavorite } = useToggleFavorite();

  const [foodSortBy, setFoodSortBy] = useState<FoodSortOption>('distance');

  const isFood = locationType === 'food';
  const isAll = locationType === 'all';

  // Food list filtered by the shared search query (categories already applied
  // upstream by useFoodTab).
  const foodFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) =>
      r.name?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q) ||
      r.categories?.some((c) => c.toLowerCase().includes(q)));
  }, [restaurants, searchQuery]);

  // Distance-sorted copy — drives the map pins + "nearest" stat regardless of
  // the list's chosen sort.
  const foodByDistance = useMemo(
    () =>
      [...foodFiltered].sort(
        (a, b) =>
          calculateDistance(userCoords, a.coordinates) -
          calculateDistance(userCoords, b.coordinates)
      ),
    [foodFiltered, userCoords]
  );

  // List order honours the selected sort (distance / rating / name).
  const foodSorted = useMemo(() => {
    switch (foodSortBy) {
      case 'rating':
        return [...foodFiltered].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'name':
        return [...foodFiltered].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return foodByDistance;
    }
  }, [foodFiltered, foodByDistance, foodSortBy]);

  // Food restaurants as map markers (clustering handles density — no cap).
  const foodMarkers = useMemo<MapMarkerLike[]>(
    () =>
      foodByDistance.map((r) => ({
        id: r.id,
        coordinates: r.coordinates,
        building: r.name,
        address: r.address ?? '',
        kind: 'food' as MarkerKind,
      })),
    [foodByDistance]
  );

  const facilityKind = useCallback((f: LocationUnion): MarkerKind => {
    if (isBidetLocation(f)) return 'bidet';
    if (isMosqueLocation(f)) return 'mosque';
    return 'musollah';
  }, []);

  // "All" layer: facilities (full objects, kept whole so tap can open a sheet)
  // + food markers, all kind-tagged so each pin renders its own icon.
  const allMarkers = useMemo<MapMarkerLike[]>(() => {
    const facilityMarkers = allFacilities.map((f) => ({
      ...f,
      kind: facilityKind(f),
    })) as MapMarkerLike[];
    return [...facilityMarkers, ...foodMarkers];
  }, [allFacilities, foodMarkers, facilityKind]);

  // Combined, distance-sorted list for the "All" layer.
  const allList = useMemo<AllListItem[]>(() => {
    const facItems: AllListItem[] = allFacilities.map((f) => ({
      kind: facilityKind(f),
      id: f.id,
      title: f.building || 'Unknown',
      subtitle: f.address || '',
      distanceKm: f.distance ?? Infinity,
      raw: f,
    }));
    const foodItems: AllListItem[] = foodByDistance.map((r) => ({
      kind: 'food',
      id: r.id,
      title: r.name,
      subtitle: r.address || '',
      distanceKm: calculateDistance(userCoords, r.coordinates),
      image: r.image,
      raw: r,
    }));
    return [...facItems, ...foodItems].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [allFacilities, foodByDistance, userCoords, facilityKind]);

  // Markers + counts switch by active layer.
  const markerLocations: MapMarkerLike[] = isAll
    ? allMarkers
    : isFood
    ? foodMarkers
    : (filteredLocations as MapMarkerLike[]);

  const clusterColor = CLUSTER_COLORS[locationType] ?? accent;

  const layerCount = isAll ? allList.length : isFood ? foodSorted.length : locationCount;
  const showLoading = isAll ? foodLoading || isLoading : isFood ? foodLoading : isLoading;

  // Calculate nearest distance for the active layer
  const nearestDistance = useMemo(() => {
    if (isAll) {
      const d = allList[0]?.distanceKm;
      return d !== undefined && isFinite(d) ? d : undefined;
    }
    if (isFood) {
      return foodSorted.length > 0
        ? calculateDistance(userCoords, foodSorted[0].coordinates)
        : undefined;
    }
    if (filteredLocations.length > 0 && filteredLocations[0].distance !== undefined) {
      return filteredLocations[0].distance;
    }
    return undefined;
  }, [isAll, allList, isFood, foodSorted, userCoords, filteredLocations]);

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

  // Marker tap: food routes to detail; facilities open their sheet. Routing is
  // by marker.kind so it works in every layer (incl. the mixed "All" layer).
  const handleMarkerPress = useCallback(
    (marker: MapMarkerLike) => {
      if (marker.kind === 'food') {
        router.push(`/${marker.id}`);
        return;
      }
      handleSelectLocation(marker as unknown as LocationUnion);
    },
    [router, handleSelectLocation]
  );

  // "All" list row tap — same routing by kind.
  const handleAllItemPress = useCallback(
    (item: AllListItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (item.kind === 'food') {
        router.push(`/${item.id}`);
      } else {
        handleSelectLocation(item.raw as LocationUnion);
      }
    },
    [router, handleSelectLocation]
  );

  // Favourite toggle (food) — gated by sign-in like the old Food tab.
  const handleToggleFavorite = useCallback(
    (restaurantId: string, currentlyFavorited: boolean) => {
      if (!user) {
        setShowSignInModal(true);
        return;
      }
      toggleFavorite({ userId: user.uid, restaurantId, isFavorited: !currentlyFavorited });
    },
    [user, toggleFavorite]
  );

  // Render facility list item
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

  // Render food (restaurant) list item
  const renderFoodItem = useCallback(
    ({ item, index }: { item: Restaurant; index: number }) => {
      const isFavorited = favorites.includes(item.id);
      return (
        <View style={styles.foodCardWrap}>
          <RestaurantCard
            restaurant={item}
            distance={getRestaurantDistance(item)}
            isFavorited={isFavorited}
            onToggleFavorite={() => handleToggleFavorite(item.id, isFavorited)}
            index={index}
          />
        </View>
      );
    },
    [favorites, getRestaurantDistance, handleToggleFavorite]
  );

  // Render combined "All" list row
  const renderAllItem = useCallback(
    ({ item }: { item: AllListItem }) => (
      <AllPlaceRow
        item={item}
        onPress={() => handleAllItemPress(item)}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    ),
    [handleAllItemPress, theme, isDarkMode]
  );

  // Key extractor (shared — every item has a string id)
  const keyExtractor = useCallback((item: { id: string }) => item.id, []);
  const allKeyExtractor = useCallback((item: AllListItem) => `${item.kind}-${item.id}`, []);

  // Food filter chips + sort (stable element so the list header doesn't remount)
  const foodListHeader = useMemo(
    () => (
      <FoodFilterHeader
        categories={categories}
        categoryCounts={categoryCounts}
        selectedCategories={selectedCategories}
        onCategorySelect={handleCategorySelect}
        sortBy={foodSortBy}
        onSortChange={setFoodSortBy}
        theme={theme}
        accent={accent}
      />
    ),
    [categories, categoryCounts, selectedCategories, handleCategorySelect, foodSortBy, theme, accent]
  );

  // Main render
  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF' }]}>
      <View style={styles.content}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <Map
            region={region}
            markerLocations={markerLocations}
            onMarkerPress={handleMarkerPress}
            onAddLocationPress={handleOpenAddLocation}
            showAddButton={!isFood && !isAll}
            clusterColor={clusterColor}
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

        {/* Search Bar Overlay — opens the unified cross-layer search */}
        <View
          pointerEvents={isSheetVisible ? 'none' : 'auto'}
          style={[
            styles.searchOverlay,
            isSheetVisible && styles.searchOverlayBehind,
          ]}
        >
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={enter(0)}
          >
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/search')}>
              <BlurView
                intensity={20}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[styles.searchContainer, {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.90)',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
                }]}
              >
                <View style={[styles.searchIconContainer, { backgroundColor: accent }]}>
                  <FontAwesome6 name="magnifying-glass" size={16} color="#fff" />
                </View>
                <Text style={[styles.searchInput, { color: theme.colors.text.muted }]} numberOfLines={1}>
                  Search food, musollahs, mosques…
                </Text>
              </BlurView>
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* Bottom Sheet Container */}
        <View style={styles.bottomSheet}>
          <BlurView
            intensity={40}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.bottomSheetInner, {
              backgroundColor: isDarkMode ? 'rgba(6,11,24,0.94)' : 'rgba(238,242,255,0.94)',
            }]}
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
              locationCount={layerCount}
              nearestDistance={nearestDistance}
              theme={theme}
              isDarkMode={isDarkMode}
            />

            {/* Content */}
            {isError && !isFood ? (
              <ErrorState error={error} onRetry={handleRetry} theme={theme} />
            ) : showLoading ? (
              <View style={styles.listLoadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
              </View>
            ) : layerCount === 0 ? (
              <EmptyState
                type={LOCATION_TYPES[selectedIndex]}
                isSearching={searchQuery.length > 0}
                theme={theme}
              />
            ) : isAll ? (
              <FlashList
                data={allList}
                renderItem={renderAllItem}
                keyExtractor={allKeyExtractor}
                contentContainerStyle={styles.flashListContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : isFood ? (
              <FlashList
                data={foodSorted}
                renderItem={renderFoodItem}
                keyExtractor={keyExtractor}
                ListHeaderComponent={foodListHeader}
                contentContainerStyle={styles.flashListContent}
                showsVerticalScrollIndicator={false}
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

      {/* Detail Sheets — keyed off the selected location's type (mutually
          exclusive guards) so they work in any layer, including "All". Food
          has no sheet; it routes to its detail page. */}
      {selectedLocation && isBidetLocation(selectedLocation) && (
        <BidetSheet
          locationId={selectedLocation.id}
          visible={isSheetVisible}
          onClose={handleCloseSheet}
        />
      )}

      {selectedLocation && isMusollahLocation(selectedLocation) && (
        <MusollahSheet
          locationId={selectedLocation.id}
          visible={isSheetVisible}
          onClose={handleCloseSheet}
        />
      )}

      {selectedLocation && isMosqueLocation(selectedLocation) && (
        <MosqueSheet
          location={selectedLocation as MosqueLocation}
          visible={isSheetVisible}
          onClose={handleCloseSheet}
        />
      )}

      {/* Sign-in prompt for favouriting restaurants */}
      <SignInModal visible={showSignInModal} onClose={() => setShowSignInModal(false)} />
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
    width: '100%',
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
  foodCardWrap: {
    paddingHorizontal: SPACING.xl,
  },

  // All-layer combined row
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  allIconTile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allRowInfo: {
    flex: 1,
    gap: 5,
  },
  allRowTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  allKindBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  allKindBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  allDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
  },
  allDistanceText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
  },

  // Food filter header (chips + sort)
  foodFilterHeader: {
    marginBottom: SPACING.md,
  },
  foodChipsList: {
    marginBottom: SPACING.md,
  },
  foodChipsContent: {
    paddingHorizontal: SPACING.xl,
  },
  foodSortRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  foodSortBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  foodSortText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
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