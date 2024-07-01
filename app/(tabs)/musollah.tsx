import { View, Text, SafeAreaView } from 'react-native'
import React, { useEffect, useState } from 'react'
import Map, { Region } from '../../components/Map'
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/locationTask'

import * as Location from 'expo-location'

const defaultRegion: Region = {
  latitude: 1.3521,  // Central location in Singapore
  longitude: 103.8198, // Central location in Singapore
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MusollahTab = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<Region | undefined>(defaultRegion);

  useEffect(() => {
    const getCurrentLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
        });
      }

      if (location) {  
        const region: Region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
        setLocation(region);
      } else {
        setLocation(defaultRegion)
      }
    }

    getCurrentLocation();
    startBackgroundLocationUpdates();

    return () => {
      stopBackgroundLocationUpdates();
    }
  }, [])

  return (
    <View>
      <Map region={location} />
    </View>
  )
}

export default MusollahTab