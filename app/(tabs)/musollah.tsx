import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useCallback, useContext, useEffect, useState, useMemo } from 'react'
import Map, { Region, BidetLocation, MosqueLocation, MusollahLocation } from '../../components/Map'

import SegmentedControl from '@react-native-segmented-control/segmented-control'
import BidetModal from '../../components/BidetModal'
import MosqueModal from '../../components/MosqueModal'
import { getBidetLocations, getMosqueLocations, getMusollahsLocations } from '../../api/firebase'
import { LocationContext } from '../../providers/LocationProvider'
import { LocationDataContext } from '../../providers/LocationDataProvider'

const MusollahTab = () => {
  const { bidetLocations, mosqueLocations, musollahLocations, loading } = useContext(LocationDataContext);
  const { userLocation, errorMsg } = useContext(LocationContext);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<BidetLocation | MosqueLocation | MusollahLocation |null>(null);
  const [shouldFollowUserLocation, setShouldFollowUserLocation] = useState<boolean>(true);

  const locationTypes = ['Bidets', 'Musollahs', 'Mosques', 'Halal Food']

  const handleMarkerPress = useCallback((location: BidetLocation | MosqueLocation | MusollahLocation) => {
    setSelectedLocation(location);
    setIsModalVisible(true);
  }, []);

  const handleListItemPress = useCallback((location: BidetLocation | MosqueLocation | MusollahLocation) => {
    setSelectedLocation(location);
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedLocation(null);
    setIsModalVisible(false);
  }, []);

  const handleRegionChangeComplete = useCallback(() => {
    setShouldFollowUserLocation(false)
  }, [])

  const handleRefocusPress = useCallback(() => {
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
  }, [userLocation]);

  const renderItem = useCallback(({ item }: { item: BidetLocation | MosqueLocation | MusollahLocation }) => (
    <TouchableOpacity style={{ padding: 20, borderBottomColor: 'black', borderBottomWidth: 1 }} onPress={() => handleListItemPress(item)}>
      <Text>{item.building} </Text>
      <Text>Distance: {item.distance?.toFixed(2)}km</Text>
    </TouchableOpacity>
  ), [handleListItemPress]);

  const keyExtractor = useCallback((item: BidetLocation | MosqueLocation | MusollahLocation) => item.id, []);

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
  }, [userLocation])

  const currentLocations = useMemo(() => {
    switch (selectedIndex) {
      case 0:
        return bidetLocations;
      case 1:
        return musollahLocations;
      case 2:
        return mosqueLocations;
      default:
        return [];
    }
  }, [selectedIndex, bidetLocations, musollahLocations, mosqueLocations]);

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
            keyExtractor={keyExtractor}
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