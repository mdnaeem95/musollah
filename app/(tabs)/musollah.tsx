import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import Map, { Region, BidetLocation, MosqueLocation, MusollahLocation } from '../../components/Map'

import * as Location from 'expo-location'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import BidetModal from '../../components/BidetModal'
import MosqueModal from '../../components/MosqueModal'
import { getBidetLocations, getMosqueLocations, getMusollahsLocations } from '../../api/firebase'
import { LocationContext } from '../../providers/LocationProvider'

const MusollahTab = () => {
  const { userLocation, errorMsg } = useContext(LocationContext);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [bidetLocations, setBidetLocations] = useState<BidetLocation[]>([]);
  const [mosqueLocations, setMosqueLocations] = useState<MosqueLocation[]>([]);
  const [musollahLocations, setMusollahLocations] = useState<MusollahLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<BidetLocation | MosqueLocation | MusollahLocation |null>(null);
  const [shouldFollowUserLocation, setShouldFollowUserLocation] = useState<boolean>(true);

  const locationTypes = ['Bidets', 'Musollahs', 'Mosques', 'Halal Food']

  const handleMarkerPress = (location: BidetLocation | MosqueLocation | MusollahLocation) => {
    setSelectedLocation(location);
    setIsModalVisible(true);
  }

  const handleListItemPress = (location: BidetLocation | MosqueLocation | MusollahLocation) => {
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

  const renderItem = ({ item }: { item: BidetLocation | MosqueLocation | MusollahLocation }) => (
    <TouchableOpacity style={{ padding: 20, borderBottomColor: 'black', borderBottomWidth: 1 }} onPress={() => handleListItemPress(item)}>
      <Text>{item.building} </Text>
      <Text>Distance: {item.distance?.toFixed(2)}km</Text>
    </TouchableOpacity>
  )

  useEffect(() => {
    if (userLocation) {
      const initialRegion: Region = {
        latitude: userLocation!.coords.latitude,
        longitude: userLocation!.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      };
      setRegion(initialRegion);
    }

    const fetchLocations = async () => {
      if (region) {
        try {
          const [bidetData, mosqueData, musollahData] = await Promise.all([
            getBidetLocations(region!),
            getMosqueLocations(region!),
            getMusollahsLocations(region!),
          ]);
          setBidetLocations(bidetData as BidetLocation[]);
          setMosqueLocations(mosqueData as MosqueLocation[]);
          setMusollahLocations(musollahData as MusollahLocation[]);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching locations: ", error);
          setLoading(false);
      }
      } 
    }
    fetchLocations();
  }, [selectedIndex, userLocation])

  const currentLocations = selectedIndex === 0 ? bidetLocations : (selectedIndex === 1 ? musollahLocations : mosqueLocations);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Map 
          region={region} 
          markerLocations={currentLocations} 
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
        {loading ? (
          <ActivityIndicator size="large" color="#0000FF" />
        ) :(
          <FlatList
            style={{ margin: -10 }} 
            data={currentLocations}
            renderItem={renderItem}
            initialNumToRender={5}
            windowSize={5}
            keyExtractor={(item) => item.id}
            getItemLayout={(data, index) => (
              { length: 70, offset: 70 * index, index }
            )}
          />
        )}
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