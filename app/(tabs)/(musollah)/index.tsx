/**
 * Musollah Screen (Refactored)
 * 
 * Main screen for finding prayer facilities:
 * - Bidets
 * - Musollahs (prayer rooms)
 * - Mosques
 * 
 * Features:
 * - Interactive map with markers
 * - Search filtering
 * - Tab-based navigation
 * - Detail sheets
 * - Error and empty states
 * - Loading skeletons
 */

import React, { useEffect, useCallback, memo } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, RefreshControl } from 'react-native';
import { SearchBar } from '@rneui/themed';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '../../../context/ThemeContext';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';
import Map from '../../../components/musollah/Map';
import { useLocationStore } from '../../../stores/useLocationStore';
import { MosqueLocation, LocationUnion } from '../../../api/services/musollah';
import BidetSheet from './BidetSheet';
import MosqueSheet from './MosqueSheet';
import MusollahSheet from './MusollahSheet';
import { useLocationsTab, isBidetLocation, isMusollahLocation, isMosqueLocation } from '../../../hooks/locations/useLocationsTab';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOCATION_TYPES = ['Bidets', 'Musollahs', 'Mosques'] as const;

const LOCATION_ICONS: Record<string, string> = {
  Bidets: 'toilet',
  Musollahs: 'person-praying',
  Mosques: 'mosque',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface LocationItemProps {
  item: LocationUnion;
  onPress: (location: LocationUnion) => void;
  theme: any;
}

const LocationItem = memo(function LocationItem({ 
  item, 
  onPress, 
  theme 
}: LocationItemProps) {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);
  
  // Get status color for bidets/musollahs
  const getStatusColor = () => {
    if ('status' in item) {
      switch (item.status) {
        case 'Available': return '#22c55e'; // green
        case 'Unavailable': return '#ef4444'; // red
        default: return '#6b7280'; // gray
      }
    }
    return null;
  };
  
  const statusColor = getStatusColor();
  
  return (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: theme.colors.secondary }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemTextContainer}>
          <Text 
            style={[styles.locationText, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {item.building || 'Unknown Location'}
          </Text>
          <Text 
            style={[styles.addressText, { color: theme.colors.text.secondary }]}
            numberOfLines={1}
          >
            {item.address || 'No address'}
          </Text>
        </View>
        
        <View style={styles.itemMeta}>
          {statusColor && (
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          )}
          <Text style={[styles.distanceText, { color: theme.colors.accent }]}>
            {item.distance !== undefined 
              ? `${item.distance.toFixed(1)} km` 
              : '-- km'}
          </Text>
          <FontAwesome6 
            name="chevron-right" 
            size={12} 
            color={theme.colors.text.secondary} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

interface EmptyStateProps {
  type: string;
  isSearching: boolean;
  theme: any;
}

const EmptyState = memo(function EmptyState({ 
  type, 
  isSearching, 
  theme 
}: EmptyStateProps) {
  const icon = LOCATION_ICONS[type] || 'location-dot';
  
  return (
    <View style={styles.emptyContainer}>
      <FontAwesome6 
        name={icon} 
        size={48} 
        color={theme.colors.text.secondary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {isSearching ? 'No Results Found' : `No ${type} Nearby`}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {isSearching 
          ? 'Try a different search term'
          : `We couldn't find any ${type.toLowerCase()} in your area`}
      </Text>
    </View>
  );
});

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  theme: any;
}

const ErrorState = memo(function ErrorState({ 
  error, 
  onRetry, 
  theme 
}: ErrorStateProps) {
  return (
    <View style={styles.errorContainer}>
      <FontAwesome6 
        name="triangle-exclamation" 
        size={48} 
        color="#ef4444" 
      />
      <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
        Something Went Wrong
      </Text>
      <Text style={[styles.errorSubtitle, { color: theme.colors.text.secondary }]}>
        {error?.message || 'Unable to load locations'}
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
        onPress={onRetry}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
});

interface LocationPermissionPromptProps {
  onRequestPermission: () => void;
  theme: any;
}

const LocationPermissionPrompt = memo(function LocationPermissionPrompt({
  onRequestPermission,
  theme,
}: LocationPermissionPromptProps) {
  return (
    <View style={styles.permissionContainer}>
      <FontAwesome6 
        name="location-dot" 
        size={48} 
        color={theme.colors.accent} 
      />
      <Text style={[styles.permissionTitle, { color: theme.colors.text.primary }]}>
        Location Access Needed
      </Text>
      <Text style={[styles.permissionSubtitle, { color: theme.colors.text.secondary }]}>
        We need your location to find nearby prayer facilities
      </Text>
      <TouchableOpacity 
        style={[styles.permissionButton, { backgroundColor: theme.colors.accent }]}
        onPress={onRequestPermission}
      >
        <Text style={styles.permissionButtonText}>Enable Location</Text>
      </TouchableOpacity>
    </View>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MusollahScreen() {
  const { theme, isDarkMode } = useTheme();
  const { userLocation, fetchLocation, isLoading: locationLoading } = useLocationStore();
  
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

  // Fetch user location on mount
  useEffect(() => {
    if (!userLocation && !locationLoading) {
      console.log('📍 Requesting user location...');
      fetchLocation();
    }
  }, [userLocation, locationLoading, fetchLocation]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Render location item
  const renderItem = useCallback(({ item }: { item: LocationUnion }) => (
    <LocationItem 
      item={item} 
      onPress={handleSelectLocation} 
      theme={theme} 
    />
  ), [handleSelectLocation, theme]);

  // Key extractor
  const keyExtractor = useCallback((item: LocationUnion) => item.id, []);

  // Show loading if fetching location
  if (locationLoading && !userLocation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Getting your location...
          </Text>
        </View>
      </View>
    );
  }

  // Show permission prompt if no location
  if (!userLocation && !locationLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <LocationPermissionPrompt 
          onRequestPermission={fetchLocation} 
          theme={theme} 
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {/* Map */}
        <Map
          region={region}
          markerLocations={filteredLocations}
          onMarkerPress={handleSelectLocation}
          onRegionChangeComplete={() => {}}
          onRefocusPress={() => {}}
          shouldFollowUserLocation={true}
          locationType={LOCATION_TYPES[selectedIndex]}
        />

        {/* Overlay UI */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Search Bar */}
          <View style={styles.topOverlay}>
            <SearchBar
              placeholder={`Search ${LOCATION_TYPES[selectedIndex].toLowerCase()}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={clearSearch}
              platform="default"
              round
              lightTheme={!isDarkMode}
              containerStyle={[
                styles.searchBarContainer,
                { backgroundColor: 'transparent' }
              ]}
              inputContainerStyle={{ 
                backgroundColor: theme.colors.secondary,
                borderRadius: 12,
              }}
              inputStyle={{ color: theme.colors.text.primary }}
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          {/* List Container */}
          <View style={[styles.listContainer, { backgroundColor: theme.colors.primary }]}>
            {/* Segmented Control */}
            <SegmentedControl
              style={styles.segmentedControl}
              backgroundColor={theme.colors.secondary}
              tintColor={theme.colors.accent}
              fontStyle={{ 
                color: theme.colors.text.secondary,
                fontFamily: 'Outfit_500Medium',
              }}
              activeFontStyle={{ 
                color: '#fff',
                fontFamily: 'Outfit_600SemiBold',
              }}
              values={LOCATION_TYPES as unknown as string[]}
              selectedIndex={selectedIndex}
              onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}
            />

            {/* Results Count */}
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsCount, { color: theme.colors.text.secondary }]}>
                {isLoading 
                  ? 'Loading...' 
                  : `${locationCount} ${locationCount === 1 ? 'location' : 'locations'} found`}
              </Text>
            </View>

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
                estimatedItemSize={80}
                data={filteredLocations}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.flashListContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
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
  topOverlay: {
    marginTop: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '45%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchBarContainer: {
    marginTop: 30,
    padding: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  segmentedControl: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
  },
  itemContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  locationText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  addressText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distanceText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
  },
  separator: {
    height: 8,
  },
  flashListContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
  listLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 20,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});