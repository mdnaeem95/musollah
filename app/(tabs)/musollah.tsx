import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import Map, { Region, BidetLocation } from '../../components/Map'
import { db } from '../../firebaseConfig'
import { getDistanceFromLatLonInKm } from '../../utils/distance'

import * as Location from 'expo-location'
import { collection, getDocs } from 'firebase/firestore'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import BidetModal from '../../components/BidetModal'

const MusollahTab = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [bidetLocations, setBidetLocations] = useState<BidetLocation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<BidetLocation | null>(null);
  const [shouldFollowUserLocation, setShouldFollowUserLocation] = useState<boolean>(true);

  const locationTypes = ['Bidets', 'Musollahs', 'Halal Food']

  const handleMarkerPress = (location: BidetLocation) => {
    setSelectedLocation(location);
    setIsModalVisible(true);
  }

  const handleListItemPress = (location: BidetLocation) => {
    setSelectedLocation(location);
    setIsModalVisible(true);
  }

  const closeModal = () => {
    setSelectedLocation(null);
    setIsModalVisible(false);
  }

  const handleRegionChangeComplete = useCallback(() => {
    setShouldFollowUserLocation(false)
  }, [])

  const handleRefocusPress = () => {
    if (userLocation) {
      const newRegion: Region = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      };
      setRegion(newRegion);
      setShouldFollowUserLocation(true);
    }
  }

  const renderItem = ({ item }: { item: BidetLocation }) => (
    <TouchableOpacity style={{ marginVertical: 20, gap: 10 }} onPress={() => handleListItemPress(item)}>
      <Text>{item.building} </Text>
      <Text>Distance: {item.distance?.toFixed(2)}km</Text>
    </TouchableOpacity>
  )

  useEffect(() => {
    const getCurrentLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });
      setUserLocation(userLocation);

      const initialRegion: Region = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
      setRegion(initialRegion);
    }

    let collectionName;
    switch (locationTypes[selectedIndex]) {
      case 'Musollahs':
        collectionName = 'musollahs';
        break;
      case 'Halal Food':
        collectionName = 'halalFoodPlaces';
        break;
      default:
        collectionName = 'Bidets';
    }

    const getBidetLocations = async () => {
      try {
        const bidetsSnapshot = await getDocs(collection(db, collectionName));
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

        if (userLocation) {
          bidetsData.forEach((bidet) => {
            bidet.distance = getDistanceFromLatLonInKm(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
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
  }, [selectedIndex, userLocation])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Map 
          region={region} 
          bidetLocations={bidetLocations} 
          onMarkerPress={handleMarkerPress} 
          onRegionChangeComplete={handleRegionChangeComplete}
          shouldFollowUserLocation={shouldFollowUserLocation}
          onRefocusPress={handleRefocusPress}
        />
      </View>

      <View style={{ flex: 1, padding: 10 }}>
        <SegmentedControl 
          values={locationTypes}
          selectedIndex={selectedIndex}
          onChange={(event) => {
            setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
          }} 
        />
        <FlatList 
          data={bidetLocations}
          renderItem={renderItem}
          initialNumToRender={5}
          windowSize={5}
          keyExtractor={(item) => item.id}
          getItemLayout={(data, index) => (
            { length: 70, offset: 70 * index, index }
          )}
        />
      </View>

      {selectedLocation && (
        <BidetModal isVisible={isModalVisible} location={selectedLocation} onClose={closeModal}/>
      )}
    </View>
  )
}

export default MusollahTab