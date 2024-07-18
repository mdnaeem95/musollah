import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import Map, { Region, BidetLocation, MosqueLocation, MusollahLocation } from '../../components/Map'
import { SearchBar } from '@rneui/themed'

import SegmentedControl from '@react-native-segmented-control/segmented-control'
import BidetModal from '../../components/BidetModal'
import MosqueModal from '../../components/MosqueModal'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store/store'

const MusollahTab = () => {
  const { bidetLocations, mosqueLocations, musollahLocations, isLoading } = useSelector((state: RootState) => state.musollah);
  const { userLocation, errorMsg } = useSelector((state: RootState) => state.location);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<BidetLocation | MosqueLocation | MusollahLocation |null>(null);
  const [shouldFollowUserLocation, setShouldFollowUserLocation] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredLocations, setFilteredLocations] = useState<BidetLocation | MosqueLocation | MusollahLocation[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastLocation = useRef<{ latitude: number; longitude: number } | null>(null);

  const locationTypes = ['Bidets', 'Musollahs', 'Mosques', 'Halal Food']

  const LOCATION_UPDATE_THRESHOLD = 0.001; // Threshold for significant location change - to determine if a location change is significant enough to trigger a refresh
  const DEBOUNCE_DELAY = 500; // Delay in milliseconds - to delay location updates

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

  const handleSearch = useCallback(() => {
    const currentLocations = selectedIndex === 0 ? bidetLocations : selectedIndex === 1 ? musollahLocations : mosqueLocations;
    const results = currentLocations.filter((location: BidetLocation | MosqueLocation | MusollahLocation) =>
      location.building.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLocations(results);
  }, [searchQuery, selectedIndex, bidetLocations, musollahLocations, mosqueLocations]);

  const renderItem = useCallback(({ item }: { item: BidetLocation | MosqueLocation | MusollahLocation }) => (
    <TouchableOpacity style={{ padding: 20, borderBottomColor: 'black', borderBottomWidth: 1 }} onPress={() => handleListItemPress(item)}>
      <Text>{item.building} </Text>
      <Text>Distance: {item.distance?.toFixed(2)}km</Text>
    </TouchableOpacity>
  ), [handleListItemPress]);

  const keyExtractor = useCallback((item: BidetLocation | MosqueLocation | MusollahLocation) => item.id, []);

  const isSignificantLocationChange = (newLocation: { latitude: number; longitude: number }) => {
    if (!lastLocation.current) {
      lastLocation.current = newLocation;
      return true;
    }

    const distance = Math.sqrt(
      Math.pow(newLocation.latitude - lastLocation.current.latitude, 2) +
      Math.pow(newLocation.longitude - lastLocation.current.longitude, 2)
    );

    if (distance > LOCATION_UPDATE_THRESHOLD) {
      lastLocation.current = newLocation;
      return true;
    }

    return false;
  };

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

  useEffect(() => {
    if (userLocation && isSignificantLocationChange(userLocation.coords)) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        const initialRegion: Region = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(initialRegion);
      }, DEBOUNCE_DELAY);
    }
  }, [userLocation]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, handleSearch]);

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
        <View style={{ position: 'absolute', top: 47, right: 10, zIndex: 12, width: '80%' }}>
          <SearchBar 
            placeholder='Search for a location...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            platform='default'
            round
            lightTheme
            containerStyle={{ margin: 0, padding: 0, borderRadius: 20 }}
            inputContainerStyle={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
          />
        </View>
        <Map 
          region={region} 
          markerLocations={currentLocations ? filteredLocations : currentLocations} 
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
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000FF" />
        ) :(
          <FlatList
            style={{ margin: -10, marginTop: 10 }} 
            data={searchQuery ? filteredLocations : currentLocations}
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