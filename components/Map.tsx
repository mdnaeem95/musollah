import { View, Text, TouchableOpacity, Platform } from 'react-native'
import React from 'react'
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export interface Region {
    latitude: number,
    longitude: number,
    latitudeDelta: number,
    longitudeDelta: number,
}

interface MapProps {
    region: Region | undefined,
    bidetLocations: BidetLocation[],
    onMarkerPress: (location: BidetLocation) => void,
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

const Map = ({ region, bidetLocations, onMarkerPress, onRegionChangeComplete, shouldFollowUserLocation, onRefocusPress }: MapProps) => {
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
        {bidetLocations.map((bidet) => (
          <Marker 
            key={bidet.id}
            coordinate={{
              latitude: bidet.coordinates.latitude,
              longitude: bidet.coordinates.longitude,
            }}
            title={bidet.building}
            description={`${bidet.address}, Singapore ${bidet.postal}`}
            onPress={() => onMarkerPress(bidet)}
          />
        ))}
      </MapView>
      <TouchableOpacity 
        style={{ position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 25, padding: 10 }}
        onPress={onRefocusPress}
      >
        <Ionicons name='locate' size={24} color="white" />
      </TouchableOpacity>
    </View>
  )
}

export default Map