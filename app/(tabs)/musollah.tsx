import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import Map, { Region, BidetLocation, MosqueLocation } from '../../components/Map'
import { db } from '../../firebaseConfig'
import { getDistanceFromLatLonInKm } from '../../utils/distance'

import * as Location from 'expo-location'
import { collection, getDocs } from 'firebase/firestore'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import BidetModal from '../../components/BidetModal'
import MosqueModal from '../../components/MosqueModal'

const MusollahTab = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [markerLocations, setMarkerLocations] = useState<(BidetLocation | MosqueLocation)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<BidetLocation | MosqueLocation | null>(null);
  const [shouldFollowUserLocation, setShouldFollowUserLocation] = useState<boolean>(true);

  const locationTypes = ['Bidets', 'Musollahs', 'Mosques', 'Halal Food']

  const handleMarkerPress = (location: BidetLocation | MosqueLocation) => {
    setSelectedLocation(location);
    setIsModalVisible(true);
  }

  const handleListItemPress = (location: BidetLocation | MosqueLocation) => {
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

  const renderItem = ({ item }: { item: BidetLocation | MosqueLocation }) => (
    <TouchableOpacity style={{ padding: 20, borderBottomColor: 'black', borderBottomWidth: 1 }} onPress={() => handleListItemPress(item)}>
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
        collectionName = 'Musollahs';
        break;
      case 'Halal Food':
        collectionName = 'HalalFoodPlaces';
        break;
      case 'Mosques':
        collectionName = 'Mosques'
        break;
      default:
        collectionName = 'Bidets';
    }

    const getMarkerLocations = async () => {
      try {
        const locationsSnapshot = await getDocs(collection(db, collectionName));
        const locationsData = locationsSnapshot.docs.map(doc => {
          const data = doc.data();
          if (collectionName === 'Mosques') {
            return {
              id: doc.id,
              building: data.Building,
              address: data. Address,
              coordinates: {
                latitude: data.Coordinates.latitude,
                longitude: data.Coordinates.longitude,
              },
              shia: data.Shia,
            } as MosqueLocation;
          }
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
            male: data.Male,
          } as BidetLocation
        });

        if (userLocation) {
          locationsData.forEach((location) => {
            location.distance = getDistanceFromLatLonInKm(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              location.coordinates.latitude,
              location.coordinates.longitude
            );
          });

          locationsData.sort((a, b) => a.distance! - b.distance!);
        }

        setMarkerLocations(locationsData);
      } catch (error) {
        console.error('Error fetching location or bidets:', error);
      }
    }

    getCurrentLocation();
    getMarkerLocations();
  }, [selectedIndex, userLocation])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Map 
          region={region} 
          markerLocations={markerLocations} 
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
          style={{ margin: -10 }} 
          data={markerLocations}
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
        selectedIndex === 1 ? (
          <MosqueModal isVisible={isModalVisible} location={selectedLocation as MosqueLocation} onClose={closeModal} />
        ) : (
          <BidetModal isVisible={isModalVisible} location={selectedLocation as BidetLocation} onClose={closeModal}/>
        )
      )}
    </View>
  )
}

export default MusollahTab