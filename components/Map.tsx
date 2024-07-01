import { View, Text } from 'react-native'
import React from 'react'
import MapView from 'react-native-maps'

export interface Region {
    latitude: number,
    longitude: number,
    latitudeDelta: number,
    longitudeDelta: number,
}

interface MapProps {
    region: Region | undefined
}

const Map = ({ region }: MapProps) => {
  return (
    <View>
      <MapView 
        style={{ width: '100%', height: '100%' }}
        initialRegion={region}
        showsUserLocation
        followsUserLocation
        scrollEnabled
        zoomEnabled />
    </View>
  )
}

export default Map