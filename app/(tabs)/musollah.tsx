import { View, Text, SafeAreaView, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import Map, { Region, BidetLocation } from '../../components/Map'
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/locationTask'
import { db } from '../../firebaseConfig'
import { getDistanceFromLatLonInKm } from '../../utils/distance'

import * as Location from 'expo-location'
import { collection, getDocs } from 'firebase/firestore'

const defaultRegion: Region = {
  latitude: 1.3521,  // Central location in Singapore
  longitude: 103.8198, // Central location in Singapore
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const renderItem = ({ item }: { item: BidetLocation }) => (
  <View style={{ marginVertical: 20, gap: 10 }}>
    <Text>{item.building} </Text>
    <Text>Distance: {item.distance?.toFixed(2)}km</Text>
  </View>
)

const MusollahTab = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<Region | undefined>(defaultRegion);
  const [bidetLocations, setBidetLocations] = useState<BidetLocation[]>([]);

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

    const getBidetLocations = async () => {
      try {
        const bidetsSnapshot = await getDocs(collection(db, "Bidets"));
        const bidetsData = bidetsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            address: data.Address,
            building: data.Building,
            postal: data.Postal,
            coordinates: {
              latitude: data.Coordinates.latitude,
              longitude: data.Coordinates.longitude,
            },
            female: data.Female,
            handicap: data.Handicap,
            male: data.Male
          } as BidetLocation
        });

        if (location) {
          bidetsData.forEach((bidet) => {
            bidet.distance = getDistanceFromLatLonInKm(
              location.latitude,
              location.longitude,
              bidet.coordinates.latitude,
              bidet.coordinates.longitude
            );
          });

          bidetsData.sort((a, b) => a.distance! - b.distance!);
        }

        setBidetLocations(bidetsData);
      } catch (error) {
        console.error('Error fetching location or bidets:', error);
      }
    }

    getCurrentLocation();
    getBidetLocations();
    // startBackgroundLocationUpdates();

    // return () => {
    //   stopBackgroundLocationUpdates();
    // }
  }, [location])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Map region={location} bidetLocations={bidetLocations} />
      </View>

      <View style={{ flex: 1, padding: 10 }}>
        <FlatList 
          data={bidetLocations}
          renderItem={renderItem}
          initialNumToRender={7}
          keyExtractor={(item) => item.id}/>
      </View>
    </View>
  )
}

export default MusollahTab