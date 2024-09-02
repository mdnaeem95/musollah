import { View, Text, TouchableOpacity, Platform } from 'react-native'
import React from 'react'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export interface Region {
    latitude: number,
    longitude: number,
    latitudeDelta: number,
    longitudeDelta: number,
}

interface MapProps {
    region: Region | undefined,
    markerLocations: (BidetLocation | MosqueLocation | MusollahLocation)[],
    onMarkerPress: (location: BidetLocation | MosqueLocation | MusollahLocation) => void,
    shouldFollowUserLocation: boolean,
    onRegionChangeComplete: () => void,
    onRefocusPress: () => void,
}

export interface BidetLocation {
  id: string;
  address: string;
  building: string;
  postal: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  female: string;
  handicap: string;
  male: string;
  distance?: number;
}

export interface MosqueLocation {
  id: string;
  building: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  shia: string;
  distance?: number;
}

export interface MusollahLocation {
  id: string;
  building: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  segregated: string;
  airConditioned: string;
  ablutionArea: string;
  slippers: string;
  prayerMats: string;
  telekung: string;
  directions: string;
  distance?: number;
}

const Map = ({ region, markerLocations, onMarkerPress, onRegionChangeComplete, shouldFollowUserLocation, onRefocusPress }: MapProps) => {
  return (
    <View>
      <MapView 
        style={{ width: '100%', height: '100%' }}
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
            description={'postal' in location ? `${location.address}, Singapore ${location.postal}` : location.address}
            onCalloutPress={() => onMarkerPress(location)}
          />
        ))}
      </MapView>
      <TouchableOpacity 
        style={{ position: 'absolute', top: 50, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 25, padding: 10 }}
        onPress={onRefocusPress}
      >
        <Ionicons name='locate' size={24} color="black" />
      </TouchableOpacity>
    </View>
  )
}

export default Map