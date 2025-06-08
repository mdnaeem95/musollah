// musollah/index.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Platform, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SearchBar } from '@rneui/themed';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '../../../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Map, { Region, BidetLocation, MusollahLocation, MosqueLocation } from '../../../components/musollah/Map';
import { AppDispatch, RootState } from '../../../redux/store/store';
import { fetchUserLocation } from '../../../redux/slices/userLocationSlice';
import { fetchMusollahData } from '../../../redux/slices/musollahSlice';
import BidetSheet from './BidetSheet';
import MosqueSheet from './MosqueSheet';
import MusollahSheet from './MusollahSheet';

const locationTypes = ['Bidets', 'Musollahs', 'Mosques'];

export default function MusollahScreen() {
  const { theme, isDarkMode } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { bidetLocations, musollahLocations, mosqueLocations, isLoading } = useSelector(
    (state: RootState) => state.musollah
  );
  const { userLocation } = useSelector((state: RootState) => state.location);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<(BidetLocation | MusollahLocation | MosqueLocation)[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<BidetLocation | MosqueLocation | MusollahLocation | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false); 
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSelectLocation = (location: BidetLocation | MusollahLocation | MosqueLocation) => {
    setSelectedLocation(location);
    setIsSheetVisible(true);
  }; 

  const handleCloseSheet = () => {
    console.log('[index] handleCloseSheet');
    setIsSheetVisible(false);
    setTimeout(() => {
      setSelectedLocation(null);
    }, 300); // wait for close animation
  };

  const handleSearch = useCallback(() => {
    const data =
      selectedIndex === 0 ? bidetLocations : selectedIndex === 1 ? musollahLocations : mosqueLocations;
    const results = data.filter(loc => loc.building.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredLocations(results);
  }, [searchQuery, selectedIndex, bidetLocations, musollahLocations, mosqueLocations]);

  const debouncedSearch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(handleSearch, 300);
  }, [handleSearch]);

  const currentLocations = useMemo(() => {
    return selectedIndex === 0 ? bidetLocations : selectedIndex === 1 ? musollahLocations : mosqueLocations;
  }, [selectedIndex, bidetLocations, musollahLocations, mosqueLocations]);

  useEffect(() => {
    dispatch(fetchUserLocation());
  }, [dispatch]);

  useEffect(() => {
    if (userLocation) {
      dispatch(fetchMusollahData(userLocation));
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, [userLocation]);

  useEffect(() => {
    debouncedSearch();
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    console.log('[index] selectedLocation changed:', selectedLocation);
  }, [selectedLocation]);
  
  useEffect(() => {
    console.log('[index] isSheetVisible changed:', isSheetVisible);
  }, [isSheetVisible]);  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <View style={{ flex: 1 }}>
        <Map
          region={region}
          markerLocations={filteredLocations.length ? filteredLocations : currentLocations}
          onMarkerPress={handleSelectLocation}
          onRegionChangeComplete={() => {}}
          onRefocusPress={() => {}}
          shouldFollowUserLocation={true}
          locationType={locationTypes[selectedIndex]}
        />

        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={styles.topOverlay}>
            <SearchBar
              placeholder="Search for a location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              platform="default"
              round
              lightTheme={!isDarkMode}
              containerStyle={styles.searchBarContainer}
              inputContainerStyle={{ backgroundColor: theme.colors.secondary }}
            />
          </View>

          <View style={styles.listContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.text.primary} />
            ) : (
              <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
                <SegmentedControl
                style={styles.segmentedControl}
                backgroundColor={theme.colors.accent}
                values={locationTypes}
                selectedIndex={selectedIndex}
                onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}
                />
                <FlashList
                  estimatedItemSize={83}
                  data={filteredLocations.length ? filteredLocations : currentLocations}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.itemContainer, { backgroundColor: theme.colors.primary }]}
                      onPress={() => handleSelectLocation(item)}
                    >
                      <Text style={[styles.locationText, { color: theme.colors.text.primary }]}>{item.building}</Text>
                      <Text style={[styles.distanceText, { color: theme.colors.text.secondary }]}>Distance: {item.distance?.toFixed(2)}km</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.flashListContent}
                />
              </View>
            )}
          </View>
        </View>



        {selectedIndex === 0 && selectedLocation && (
          <BidetSheet
            locationId={selectedLocation?.id || null}
            visible={isSheetVisible}
            onClose={handleCloseSheet}
          />
        )}

        {selectedIndex === 1 && selectedLocation && (
          <MusollahSheet
            locationId={selectedLocation?.id || null}
            visible={isSheetVisible}
            onClose={handleCloseSheet}
          />
        )}

        {selectedIndex === 2 && selectedLocation && (
          <MosqueSheet
            location={selectedLocation as MosqueLocation}
            visible={isSheetVisible}
            onClose={handleCloseSheet}
          />
          )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topOverlay: {
    marginTop: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',
    paddingTop: 10,
  },
  searchBarContainer: {
    marginBottom: 10,
    padding: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  segmentedControl: {
    margin: 15
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  locationText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    lineHeight: 21,
  },
  distanceText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  flashListContent: {
    paddingBottom: 100,
  },
});