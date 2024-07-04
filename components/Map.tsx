import { View, Text } from 'react-native'
import React from 'react'
import MapView, { Marker } from 'react-native-maps'

export interface Region {
    latitude: number,
    longitude: number,
    latitudeDelta: number,
    longitudeDelta: number,
}

interface MapProps {
    region: Region | undefined;
    bidetLocations: BidetLocation[];
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

const Map = ({ region, bidetLocations }: MapProps) => {
  return (
    <View>
      <MapView 
        style={{ width: '100%', height: '100%' }}
        initialRegion={region}
        showsUserLocation
        followsUserLocation
        scrollEnabled
        zoomEnabled
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
          />
        ))}
      </MapView>
    </View>
  )
}

export default Map