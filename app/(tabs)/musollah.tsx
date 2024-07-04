import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import Map, { Region, BidetLocation } from '../../components/Map'
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/locationTask'
import { db } from '../../firebaseConfig'
import { getDistanceFromLatLonInKm } from '../../utils/distance'
import { BlurView } from 'expo-blur'
import Modal from 'react-native-modal';

import * as Location from 'expo-location'
import { collection, getDocs } from 'firebase/firestore'
import SegmentedControl from '@react-native-segmented-control/segmented-control'

// const defaultRegion: Region = {
//   latitude: 1.3521,  // Central location in Singapore
//   longitude: 103.8198, // Central location in Singapore
//   latitudeDelta: 0.0922,
//   longitudeDelta: 0.0421,
// };

const MusollahTab = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<Region | undefined>();
  const [bidetLocations, setBidetLocations] = useState<BidetLocation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<BidetLocation | null>(null);

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

      if (userLocation) {  
        const region: Region = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
        setLocation(region);
      }
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
  }, [selectedIndex, location])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Map region={location} bidetLocations={bidetLocations} />
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
          initialNumToRender={7}
          keyExtractor={(item) => item.id}/>
      </View>

      {selectedLocation && (
        <Modal isVisible={isModalVisible} onBackdropPress={closeModal} backdropOpacity={0.3} style={styles.modal}>
          <BlurView intensity={50} style={styles.modalBackground}>
            <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
              <Text>{selectedLocation.building}</Text>
              <Text>{selectedLocation.address}, Singapore {selectedLocation.postal}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
})

export default MusollahTab