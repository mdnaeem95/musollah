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

import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Callout, Region as MapRegion, PROVIDER_GOOGLE } from 'react-native-maps';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Supercluster from 'supercluster';

import { useTheme } from '../../context/ThemeContext';
import {
  Region,
  Coordinates,
} from '../../api/services/musollah';
import { enter } from '../../utils';

// ============================================================================
// MARKER STYLING
// ============================================================================

// One standardised marker design for every layer: a coloured pin carrying the
// same FontAwesome6 icon used in the segmented filter bar. Keep these in sync
// with KIND_META / LOCATION_ICONS in app/(tabs)/(nearby)/index.tsx.
const KIND_MARKER_META: Record<MarkerKind, { icon: string; color: string }> = {
  food: { icon: 'bowl-food', color: '#F97316' },
  musollah: { icon: 'person-praying', color: '#22C55E' },
  mosque: { icon: 'mosque', color: '#0EA5E9' },
  bidet: { icon: 'toilet', color: '#8B5CF6' },
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Minimal shape the map needs to render any marker. Facility locations
 * (Bidet/Mosque/Musollah) and food-derived markers all satisfy this, so the
 * one map can render every layer.
 */
export type MarkerKind = 'food' | 'musollah' | 'mosque' | 'bidet';

export interface MapMarkerLike {
  id: string;
  coordinates: Coordinates;
  building: string;
  address: string;
  postal?: number | string;
  status?: 'Available' | 'Unavailable' | 'Unknown';
  /** Set on the "All" layer so each pin renders its own icon; per-layer pins
   *  derive the kind from locationType. */
  kind?: MarkerKind;
}

const KIND_FROM_TYPE: Record<string, MarkerKind> = {
  Food: 'food',
  Bidets: 'bidet',
  Mosques: 'mosque',
  Musollahs: 'musollah',
};

interface MapProps {
  region: Region | undefined;
  markerLocations: MapMarkerLike[];
  onMarkerPress: (location: MapMarkerLike) => void;
  shouldFollowUserLocation: boolean;
  onRegionChangeComplete: () => void;
  onRefocusPress: () => void;
  onAddLocationPress: () => void;
  showAddButton?: boolean; // hidden for the Food layer (no community-add)
  clusterColor?: string;   // cluster bubble colour (per active layer)
  locationType: string;
}

// ============================================================================
// CLUSTERING
// ============================================================================

const DEFAULT_CLUSTER_COLOR = '#3B82F6';

/** Cluster bubble. Manages tracksViewChanges so the custom view renders on iOS
 * then stops re-rendering for performance. */
const ClusterMarker = ({
  longitude,
  latitude,
  count,
  color,
  onPress,
}: {
  longitude: number;
  latitude: number;
  count: number;
  color: string;
  onPress: () => void;
}) => {
  const [track, setTrack] = useState(true);
  useEffect(() => {
    setTrack(true);
    const t = setTimeout(() => setTrack(false), 600);
    return () => clearTimeout(t);
  }, [count]);

  const size = count < 10 ? 38 : count < 100 ? 46 : 54;

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={onPress}
      tracksViewChanges={track}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.clusterOuter, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, backgroundColor: color + '33' }]}>
        <View style={[styles.clusterInner, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
          <Text style={styles.clusterText}>{count}</Text>
        </View>
      </View>
    </Marker>
  );
};

const zoomForRegion = (longitudeDelta: number): number => {
  const z = Math.round(Math.log2(360 / Math.max(longitudeDelta, 1e-6)));
  return Math.max(1, Math.min(20, z));
};

// ============================================================================
// LEAF MARKER (standardised icon pin)
// ============================================================================

/** A single facility/food pin. Renders a custom view (coloured bubble + the
 *  layer's FontAwesome6 icon + a downward pointer), so all layers share one
 *  look. Manages tracksViewChanges so the custom view rasterises on iOS then
 *  stops re-rendering for performance (same trick as ClusterMarker). */
const LeafMarker = ({
  location,
  kind,
  selected,
  onPress,
  onCalloutPress,
}: {
  location: MapMarkerLike;
  kind: MarkerKind;
  selected: boolean;
  onPress: () => void;
  onCalloutPress: () => void;
}) => {
  const { icon, color } = KIND_MARKER_META[kind];
  const [track, setTrack] = useState(true);
  useEffect(() => {
    setTrack(true);
    const t = setTimeout(() => setTrack(false), 500);
    return () => clearTimeout(t);
  }, [icon, color]);

  return (
    <Marker
      coordinate={{
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      onPress={onPress}
      tracksViewChanges={track || selected}
    >
      <View style={styles.pinWrap}>
        <View style={[styles.pinBubble, { backgroundColor: color }]}>
          <FontAwesome6 name={icon} size={15} color="#fff" solid />
        </View>
        <View style={[styles.pinPointer, { borderTopColor: color }]} />
      </View>
      <CustomCallout location={location} onPress={onCalloutPress} />
    </Marker>
  );
};

// ============================================================================
// CUSTOM CALLOUT (Premium Design)
// ============================================================================

interface CustomCalloutProps {
  location: MapMarkerLike;
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
  onAddLocationPress: () => void;
  showAddButton?: boolean;
}

const MapControls = ({ onRefocusPress, onAddLocationPress, showAddButton = true }: MapControlsProps) => {
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

      {/* Add Location Button (hidden for the Food layer) */}
      {showAddButton && (
        <TouchableOpacity onPress={handleAddLocation} activeOpacity={0.8} style={styles.controlWrapper}>
          <BlurView
            intensity={30}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.controlButton, { backgroundColor: theme.colors.accent }]}
          >
            <FontAwesome6 name="plus" size={22} color="#fff" solid />
          </BlurView>
        </TouchableOpacity>
      )}
    </MotiView>
  );
};

// ============================================================================
// MAIN MAP COMPONENT
// ============================================================================

const Map = ({
  region: initialRegion,
  markerLocations,
  onMarkerPress,
  onRegionChangeComplete,
  shouldFollowUserLocation,
  onRefocusPress,
  onAddLocationPress,
  showAddButton = true,
  clusterColor = DEFAULT_CLUSTER_COLOR,
  locationType,
}: MapProps) => {
  const mapRef = useRef<MapView>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  // Track the visible region so clustering recomputes as the user pans/zooms.
  const [region, setRegion] = useState<MapRegion | undefined>(initialRegion as MapRegion | undefined);
  // Follow the user's location for the initial centering only. As soon as the
  // user pans the map we stop following so it doesn't snap back under them; the
  // refocus button re-enables it on demand. (iOS `followsUserLocation`.)
  const [following, setFollowing] = useState(shouldFollowUserLocation);

  const resolveKind = useCallback(
    (loc: MapMarkerLike): MarkerKind => loc.kind ?? KIND_FROM_TYPE[locationType] ?? 'musollah',
    [locationType]
  );

  // Lookup so a clustered leaf (which only carries an id) maps back to its marker.
  // (Plain record — the component is named `Map`, which shadows the global Map.)
  const markerById = useMemo(() => {
    const m: Record<string, MapMarkerLike> = {};
    for (const loc of markerLocations) m[loc.id] = loc;
    return m;
  }, [markerLocations]);

  // Supercluster index (pure JS) — rebuilt only when the marker set changes.
  // `export =` CJS typing doesn't expose its generic construct signature cleanly,
  // so we cast the ctor and type just the two methods we call.
  const index = useMemo(() => {
    const sc = new (Supercluster as any)({ radius: 50, maxZoom: 18 });
    sc.load(
      markerLocations.map((loc) => ({
        type: 'Feature',
        properties: { markerId: loc.id },
        geometry: {
          type: 'Point',
          coordinates: [loc.coordinates.longitude, loc.coordinates.latitude],
        },
      }))
    );
    return sc as {
      getClusters: (bbox: [number, number, number, number], zoom: number) => any[];
      getClusterExpansionZoom: (clusterId: number) => number;
    };
  }, [markerLocations]);

  const clusters = useMemo(() => {
    if (!region) return [];
    const bbox: [number, number, number, number] = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ];
    return index.getClusters(bbox, zoomForRegion(region.longitudeDelta));
  }, [index, region]);

  const handleRegionChangeComplete = useCallback(
    (r: MapRegion) => {
      setRegion(r);
      onRegionChangeComplete();
    },
    [onRegionChangeComplete]
  );

  // User started dragging — stop following so the map stays where they put it.
  const handlePanDrag = useCallback(() => {
    setFollowing((f) => (f ? false : f));
  }, []);

  // Refocus button: re-center on the user and resume following.
  const handleRefocus = useCallback(() => {
    setFollowing(true);
    if (initialRegion) {
      mapRef.current?.animateToRegion(initialRegion as MapRegion, 400);
    }
    onRefocusPress();
  }, [initialRegion, onRefocusPress]);

  const handleClusterPress = useCallback(
    (clusterId: number, latitude: number, longitude: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 18);
      const delta = 360 / Math.pow(2, expansionZoom);
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: delta, longitudeDelta: delta },
        350
      );
    },
    [index]
  );

  // Handle marker press
  const handleMarkerPress = useCallback(
    (location: MapMarkerLike) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedMarkerId(location.id);
    },
    []
  );

  // Handle callout press
  const handleCalloutPress = useCallback(
    (location: MapMarkerLike) => {
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
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false} // We have custom button
        followsUserLocation={following}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        onPanDrag={handlePanDrag}
        onRegionChangeComplete={handleRegionChangeComplete}
        mapPadding={{
          top: 100,
          right: 20,
          bottom: 400, // Account for bottom sheet
          left: 20,
        }}
      >
        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties as any;

          // Cluster bubble — tap to zoom in.
          if (props.cluster) {
            return (
              <ClusterMarker
                key={`cluster-${props.cluster_id}`}
                longitude={lng}
                latitude={lat}
                count={props.point_count}
                color={clusterColor}
                onPress={() => handleClusterPress(props.cluster_id, lat, lng)}
              />
            );
          }

          // Individual leaf marker.
          const location = markerById[props.markerId];
          if (!location) return null;
          const kind = resolveKind(location);
          return (
            <LeafMarker
              key={location.id}
              location={location}
              kind={kind}
              selected={selectedMarkerId === location.id}
              onPress={() => handleMarkerPress(location)}
              onCalloutPress={() => handleCalloutPress(location)}
            />
          );
        })}
      </MapView>

      {/* Map Controls */}
      <MapControls
        onRefocusPress={handleRefocus}
        onAddLocationPress={onAddLocationPress}
        showAddButton={showAddButton}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Standardised leaf pin (coloured bubble + icon + downward pointer)
  pinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Cluster bubble
  clusterOuter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterInner: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  clusterText: {
    color: '#fff',
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
  },

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