import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import Map, { Region, BidetLocation, MosqueLocation, MusollahLocation } from '../../components/Map'
import { SearchBar } from '@rneui/themed'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import BidetModal from '../../components/BidetModal'
import MosqueModal from '../../components/MosqueModal'
import MusollahModal from '../../components/MusollahModal'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../redux/store/store'
import { fetchMusollahData } from '../../redux/slices/musollahSlice'  // Adjust the path as needed
import { fetchUserLocation } from '../../redux/slices/userLocationSlice'
import { SafeAreaView } from 'react-native-safe-area-context'

const locationTypes = ['Bidets', 'Musollahs', 'Mosques']

const LOCATION_UPDATE_THRESHOLD = 0.005;
const DEBOUNCE_DELAY = 1000;

interface ItemProps {
  item: BidetLocation | MosqueLocation | MusollahLocation;
  onPress: (location: BidetLocation | MosqueLocation | MusollahLocation) => void;
}

const MusollahTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { bidetLocations, mosqueLocations, musollahLocations, isLoading } = useSelector((state: RootState) => state.musollah);
  const { userLocation } = useSelector((state: RootState) => state.location);

  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<BidetLocation | MosqueLocation | MusollahLocation | null>(null);
  const [shouldFollowUserLocation, setShouldFollowUserLocation] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredLocations, setFilteredLocations] = useState<(BidetLocation | MosqueLocation | MusollahLocation)[]>([]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastLocation = useRef<{ latitude: number; longitude: number } | null>(null);

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
    setShouldFollowUserLocation(false);
  }, []);

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
    const results = currentLocations.filter((location) =>
      location.building.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLocations(results);
  }, [searchQuery, selectedIndex, bidetLocations, musollahLocations, mosqueLocations]);

  const debouncedSearch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(handleSearch, 300);
  }, [handleSearch]);

  const renderItem = useCallback(({ item }: { item: BidetLocation | MosqueLocation | MusollahLocation }) => (
    <Item item={item} onPress={handleListItemPress} />
  ), [handleListItemPress]);

  const Item = React.memo(({ item, onPress }: ItemProps) => (
    <TouchableOpacity style={{ padding: 20, borderBottomColor: 'black', borderBottomWidth: 1 }} onPress={() => onPress(item)}>
      <Text style={styles.locationText}>{item.building} </Text>
      <Text style={styles.distanceText}>Distance: {item.distance?.toFixed(2)}km</Text>
    </TouchableOpacity>  
  ));

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

  // Fetch user location on component mount
  useEffect(() => {
    dispatch(fetchUserLocation()); // Fetch the user's location when component mounts
  }, [dispatch]);

  useEffect(() => {
    if (userLocation && !hasFetchedData) {
      // initial fetching of data
      console.log("User location available:", userLocation);  // Debugging userLocation
      dispatch(fetchMusollahData(userLocation));
      setHasFetchedData(true);
    } else if (userLocation && isSignificantLocationChange(userLocation.coords)) {
      dispatch(fetchMusollahData(userLocation));
    }
  }, [userLocation, dispatch, hasFetchedData]);

  useEffect(() => {
    debouncedSearch();
  }, [searchQuery, debouncedSearch]);

  // Set map region based on user location when available
  useEffect(() => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,  // Smaller values for a zoomed-in view
        longitudeDelta: 0.005,
      });
    }
  }, [userLocation]);

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

  const searchBarIOSStyle={
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 12,
    width: '80%'
  }

  const searchBarAndroidStyle={
    position: 'absolute',
    top: 8,
    left: 10,
    zIndex: 12,
    width: '80%'
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={Platform.OS === 'ios' ? searchBarIOSStyle : searchBarAndroidStyle}>
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
          markerLocations={filteredLocations.length ? filteredLocations : currentLocations} 
          onMarkerPress={handleMarkerPress} 
          onRegionChangeComplete={handleRegionChangeComplete}
          shouldFollowUserLocation={shouldFollowUserLocation}
          onRefocusPress={handleRefocusPress}
        />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1, padding: 10 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
        <SegmentedControl
          backgroundColor='#A3C0BB'
          values={locationTypes}
          selectedIndex={selectedIndex}
          onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}
        />
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000FF" />
        ) :(
          <FlatList
            style={{ margin: -10, marginTop: 10 }} 
            data={filteredLocations.length ? filteredLocations : currentLocations}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            initialNumToRender={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({ length: 70, offset: 70 * index, index })}
          />
        )}
      </KeyboardAvoidingView>

      {selectedLocation && (
        selectedIndex === 1 ? (
          <MusollahModal isVisible={isModalVisible} location={selectedLocation as MusollahLocation} onClose={closeModal} />
        ) : selectedIndex === 2 ? (
          <MosqueModal isVisible={isModalVisible} location={selectedLocation as MosqueLocation} onClose={closeModal} />
        ) : (
          <BidetModal isVisible={isModalVisible} location={selectedLocation as BidetLocation} onClose={closeModal}/>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  locationText: {
    fontFamily: 'Outfit_500Medium',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 21,
  },
  distanceText: {
    fontFamily: 'Outfit_400Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
  }
});

export default MusollahTab;
