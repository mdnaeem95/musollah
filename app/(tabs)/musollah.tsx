import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
  useContext,
} from 'react';
import Map, { Region, BidetLocation, MosqueLocation, MusollahLocation } from '../../components/Map';
import { SearchBar } from '@rneui/themed';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import BidetModal from '../../components/BidetModal';
import MosqueModal from '../../components/MosqueModal';
import MusollahModal from '../../components/MusollahModal';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store/store';
import { fetchMusollahData } from '../../redux/slices/musollahSlice';
import { fetchUserLocation } from '../../redux/slices/userLocationSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { ThemeContext } from '../../context/ThemeContext';

const locationTypes = ['Bidets', 'Musollahs', 'Mosques'];

interface ItemProps {
  item: BidetLocation | MosqueLocation | MusollahLocation;
  onPress: (location: BidetLocation | MosqueLocation | MusollahLocation) => void;
}

const MusollahTab = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const dispatch = useDispatch<AppDispatch>();
  const { bidetLocations, mosqueLocations, musollahLocations, isLoading } = useSelector(
    (state: RootState) => state.musollah
  );
  const { userLocation } = useSelector((state: RootState) => state.location);

  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<
    BidetLocation | MosqueLocation | MusollahLocation | null
  >(null);
  const [shouldFollowUserLocation, setShouldFollowUserLocation] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredLocations, setFilteredLocations] = useState<
    (BidetLocation | MosqueLocation | MusollahLocation)[]
  >([]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMarkerPress = useCallback((location: BidetLocation | MosqueLocation | MusollahLocation) => {
    setSelectedLocation(location);
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedLocation(null);
    setIsModalVisible(false);
  }, []);

  const handleSearch = useCallback(() => {
    const currentLocations =
      selectedIndex === 0
        ? bidetLocations
        : selectedIndex === 1
        ? musollahLocations
        : mosqueLocations;
    const results = currentLocations.filter((location) =>
      location.building.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLocations(results);
  }, [searchQuery, selectedIndex, bidetLocations, musollahLocations, mosqueLocations]);

  const debouncedSearch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(handleSearch, 300);
  }, [handleSearch]);

  const renderItem = useCallback(
    ({ item }: { item: BidetLocation | MosqueLocation | MusollahLocation }) => (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: activeTheme.colors.primary }]}
        onPress={() => handleMarkerPress(item)}
      >
        <Text style={[styles.locationText, { color: activeTheme.colors.text.primary }]}>
          {item.building}
        </Text>
        <Text style={[styles.distanceText, { color: activeTheme.colors.text.secondary }]}>
          Distance: {item.distance?.toFixed(2)}km
        </Text>
      </TouchableOpacity>
    ),
    [handleMarkerPress, activeTheme]
  );

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

  useEffect(() => {
    dispatch(fetchUserLocation());
  }, [dispatch]);

  useEffect(() => {
    if (userLocation) {
      dispatch(fetchMusollahData(userLocation));
    }
  }, [userLocation, dispatch]);

  useEffect(() => {
    debouncedSearch();
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, [userLocation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: activeTheme.colors.primary }}>
      <View style={{ flex: 1 }}>
        <View style={Platform.OS === 'ios' ? styles.searchBarIOS : styles.searchBarAndroid}>
          <SearchBar
            placeholder="Search for a location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            platform="default"
            round
            lightTheme={!isDarkMode}
            containerStyle={{ margin: 0, padding: 0, borderRadius: 20 }}
            inputContainerStyle={{ backgroundColor: activeTheme.colors.secondary }}
          />
        </View>
        <Map
          region={region}
          markerLocations={filteredLocations.length ? filteredLocations : currentLocations}
          onMarkerPress={handleMarkerPress}
          onRegionChangeComplete={() => {}}
          onRefocusPress={() => {}}
          shouldFollowUserLocation={shouldFollowUserLocation}
          locationType={locationTypes[selectedIndex]}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SegmentedControl
          style={{ margin: 10 }}
          backgroundColor={activeTheme.colors.accent}
          values={locationTypes}
          selectedIndex={selectedIndex}
          onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}
        />
        {isLoading ? (
          <ActivityIndicator size="large" color={activeTheme.colors.text.primary} />
        ) : (
          <View style={styles.flashListContent}>
            <FlashList
              estimatedItemSize={83}
              data={filteredLocations.length ? filteredLocations : currentLocations}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      {selectedLocation && (
        selectedIndex === 1 ? (
          <MusollahModal
            isVisible={isModalVisible}
            location={selectedLocation as MusollahLocation}
            onClose={closeModal}
          />
        ) : selectedIndex === 2 ? (
          <MosqueModal
            isVisible={isModalVisible}
            location={selectedLocation as MosqueLocation}
            onClose={closeModal}
          />
        ) : (
          <BidetModal
            isVisible={isModalVisible}
            location={selectedLocation as BidetLocation}
            onClose={closeModal}
          />
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
  },
  itemContainer: {
    padding: 20,
    borderBottomWidth: 1,
  },
  searchBarIOS: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 12,
    width: '80%',
  },
  searchBarAndroid: {
    position: 'absolute',
    top: 8,
    left: 10,
    zIndex: 12,
    width: '80%',
  },
  flashListContent: {
    flexGrow: 1,
    zIndex: 100
  },
});

export default MusollahTab;
