/**
 * Map Component (MODERN DESIGN v2.1)
 * 
 * Premium map interface with:
 * - Glassmorphism controls
 * - Custom marker callouts
 * - Haptic feedback
 * - Smooth animations
 * - Add Location button ✅ NEW
 * 
 * @version 2.1
 * @updated December 2025
 */

import React, { useRef, useCallback, useState } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import {
  Region,
  BidetLocation,
  MosqueLocation,
  MusollahLocation,
} from '../../api/services/musollah';
import { enter } from '../../utils';

// ============================================================================
// MARKER IMAGES
// ============================================================================

const BidetMarker = require('../../assets/bidetMarker.png') as number;
const MusollahMarker = require('../../assets/musollahMarker.png') as number;
const MosqueMarker = require('../../assets/mosqueMarker.png') as number;

// ============================================================================
// TYPES
// ============================================================================

interface MapProps {
  region: Region | undefined;
  markerLocations: (BidetLocation | MosqueLocation | MusollahLocation)[];
  onMarkerPress: (location: BidetLocation | MosqueLocation | MusollahLocation) => void;
  shouldFollowUserLocation: boolean;
  onRegionChangeComplete: () => void;
  onRefocusPress: () => void;
  onAddLocationPress: () => void; // ✅ NEW
  locationType: string;
}

// ============================================================================
// CUSTOM CALLOUT (Premium Design)
// ============================================================================

interface CustomCalloutProps {
  location: BidetLocation | MosqueLocation | MusollahLocation;
  onPress: () => void;
}

const CustomCallout = ({ location, onPress }: CustomCalloutProps) => {
  const { theme, isDarkMode } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  // Get status info for bidets/musollahs
  const getStatusBadge = () => {
    if ('status' in location) {
      switch (location.status) {
        case 'Available':
          return { color: '#4CAF50', icon: 'circle-check', label: 'Available' };
        case 'Unavailable':
          return { color: '#ff6b6b', icon: 'circle-xmark', label: 'Unavailable' };
        default:
          return { color: '#9CA3AF', icon: 'circle-question', label: 'Unknown' };
      }
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <Callout tooltip onPress={handlePress}>
      <BlurView
        intensity={30}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.calloutContainer, { backgroundColor: theme.colors.secondary }]}
      >
        {/* Building Name */}
        <Text
          style={[styles.calloutTitle, { color: theme.colors.text.primary }]}
          numberOfLines={1}
        >
          {location.building}
        </Text>

        {/* Address */}
        <Text
          style={[styles.calloutAddress, { color: theme.colors.text.secondary }]}
          numberOfLines={2}
        >
          {'postal' in location
            ? `${location.address}, S${location.postal}`
            : location.address}
        </Text>

        {/* Status Badge (if applicable) */}
        {statusBadge && (
          <View style={[styles.calloutBadge, { backgroundColor: statusBadge.color + '15' }]}>
            <FontAwesome6 name={statusBadge.icon} size={10} color={statusBadge.color} />
            <Text style={[styles.calloutBadgeText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        )}

        {/* Tap to View */}
        <View style={[styles.calloutFooter, { borderTopColor: theme.colors.text.muted + '20' }]}>
          <Text style={[styles.calloutCTA, { color: theme.colors.accent }]}>
            Tap to view details
          </Text>
          <FontAwesome6 name="chevron-right" size={12} color={theme.colors.accent} />
        </View>
      </BlurView>
    </Callout>
  );
};

// ============================================================================
// MAP CONTROLS (Glassmorphism) - ✅ UPDATED WITH ADD BUTTON
// ============================================================================

interface MapControlsProps {
  onRefocusPress: () => void;
  onAddLocationPress: () => void; // ✅ NEW
}

const MapControls = ({ onRefocusPress, onAddLocationPress }: MapControlsProps) => {
  const { theme, isDarkMode } = useTheme();

  const handleRefocus = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRefocusPress();
  }, [onRefocusPress]);

  const handleAddLocation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddLocationPress();
  }, [onAddLocationPress]);

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={enter(0)}
      style={styles.controlsContainer}
    >
      {/* Refocus Button */}
      <TouchableOpacity onPress={handleRefocus} activeOpacity={0.8} style={styles.controlWrapper}>
        <BlurView
          intensity={30}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.controlButton, { backgroundColor: theme.colors.secondary }]}
        >
          <FontAwesome6 name="location-crosshairs" size={20} color={theme.colors.accent} />
        </BlurView>
      </TouchableOpacity>

      {/* Add Location Button - ✅ NEW */}
      <TouchableOpacity onPress={handleAddLocation} activeOpacity={0.8} style={styles.controlWrapper}>
        <BlurView
          intensity={30}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.controlButton, { backgroundColor: theme.colors.accent }]}
        >
          <FontAwesome6 name="plus" size={22} color="#fff" solid />
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
};

// ============================================================================
// MAIN MAP COMPONENT
// ============================================================================

const Map = ({
  region,
  markerLocations,
  onMarkerPress,
  onRegionChangeComplete,
  shouldFollowUserLocation,
  onRefocusPress,
  onAddLocationPress, // ✅ NEW
  locationType,
}: MapProps) => {
  const mapRef = useRef<MapView>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Get marker icon based on location type
  const getMarkerIcon = useCallback((locationType: string) => {
    switch (locationType) {
      case 'Bidets':
        return BidetMarker;
      case 'Mosques':
        return MosqueMarker;
      case 'Musollahs':
        return MusollahMarker;
      default:
        return MusollahMarker;
    }
  }, []);

  // Handle marker press
  const handleMarkerPress = useCallback(
    (location: BidetLocation | MosqueLocation | MusollahLocation) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedMarkerId(location.id);
    },
    []
  );

  // Handle callout press
  const handleCalloutPress = useCallback(
    (location: BidetLocation | MosqueLocation | MusollahLocation) => {
      onMarkerPress(location);
      setSelectedMarkerId(null);
    },
    [onMarkerPress]
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false} // We have custom button
        followsUserLocation={shouldFollowUserLocation}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        onRegionChangeComplete={onRegionChangeComplete}
        mapPadding={{
          top: 100,
          right: 20,
          bottom: 400, // Account for bottom sheet
          left: 20,
        }}
      >
        {markerLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.coordinates.latitude,
              longitude: location.coordinates.longitude,
            }}
            image={getMarkerIcon(locationType)}
            onPress={() => handleMarkerPress(location)}
            // Add subtle animation on press
            tracksViewChanges={selectedMarkerId === location.id}
          >
            {/* Custom Callout */}
            <CustomCallout
              location={location}
              onPress={() => handleCalloutPress(location)}
            />
          </Marker>
        ))}
      </MapView>

      {/* Map Controls - ✅ UPDATED */}
      <MapControls 
        onRefocusPress={onRefocusPress}
        onAddLocationPress={onAddLocationPress}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Custom Callout
  calloutContainer: {
    width: 240,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 18,
    marginBottom: 12,
  },
  calloutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  calloutBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  calloutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  calloutCTA: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Map Controls - ✅ UPDATED for vertical stacking
  controlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 130 : 120,
    left: 16,
    gap: 12, // ✅ NEW: Space between buttons
  },
  controlWrapper: {
    // ✅ NEW: Individual button wrapper
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default Map;