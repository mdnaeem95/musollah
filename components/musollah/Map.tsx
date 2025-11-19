import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Region, BidetLocation, MosqueLocation, MusollahLocation } from '../../api/services/musollah';

const BidetMarker = require('../../assets/bidetMarker.png') as number;
const MusollahMarker = require('../../assets/musollahMarker.png') as number;
const MosqueMarker = require('../../assets/mosqueMarker.png') as number;
interface MapProps {
  region: Region | undefined;
  markerLocations: (BidetLocation | MosqueLocation | MusollahLocation)[];
  onMarkerPress: (location: BidetLocation | MosqueLocation | MusollahLocation) => void;
  shouldFollowUserLocation: boolean;
  onRegionChangeComplete: () => void;
  onRefocusPress: () => void;
  locationType: string;
}

const Map = ({
  region,
  markerLocations,
  onMarkerPress,
  onRegionChangeComplete,
  shouldFollowUserLocation,
  onRefocusPress,
  locationType,
}: MapProps) => {
  const getMarkerIcon = (locationType: string) => {
    switch (locationType) {
      case 'Bidets':
        return BidetMarker;
      case 'Mosques':
        return MosqueMarker;
      case 'Musollahs':
        return MusollahMarker;
      default:
        return MusollahMarker; // Fallback
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation
        followsUserLocation={shouldFollowUserLocation}
        scrollEnabled
        zoomEnabled
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {markerLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.coordinates.latitude,
              longitude: location.coordinates.longitude,
            }}
            title={location.building}
            description={
              'postal' in location
                ? `${location.address}, Singapore ${location.postal}`
                : location.address
            }
            onCalloutPress={() => onMarkerPress(location)}
            image={getMarkerIcon(locationType)}
          />
        ))}
      </MapView>
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 12,
            left: 10,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: 25,
            padding: 10,
          }}
          onPress={onRefocusPress}
        >
          <Ionicons name="locate" size={24} color="black" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Map;