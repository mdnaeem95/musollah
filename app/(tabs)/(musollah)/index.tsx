import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SearchBar } from '@rneui/themed';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '../../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Map from '../../../components/musollah/Map';
import { useLocationStore } from '../../../stores/useLocationStore';
import { MosqueLocation } from '../../../api/services/musollah';
import BidetSheet from './BidetSheet';
import MosqueSheet from './MosqueSheet';
import MusollahSheet from './MusollahSheet';
import { useLocationsTab } from '../../../hooks/locations/useLocationsTab';

const locationTypes = ['Bidets', 'Musollahs', 'Mosques'];

export default function MusollahScreen() {
  const { theme, isDarkMode } = useTheme();
  const { userLocation, fetchLocation } = useLocationStore();
  
  const {
    selectedIndex,
    setSelectedIndex,
    searchQuery,
    setSearchQuery,
    filteredLocations,
    currentLocations,
    region,
    selectedLocation,
    isSheetVisible,
    handleSelectLocation,
    handleCloseSheet,
    isLoading,
  } = useLocationsTab(userLocation);

  // Fetch user location on mount
  useEffect(() => {
    if (!userLocation) {
      fetchLocation();
    }
  }, [userLocation, fetchLocation]);

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
                      <Text style={[styles.locationText, { color: theme.colors.text.primary }]}>
                        {item.building}
                      </Text>
                      <Text style={[styles.distanceText, { color: theme.colors.text.secondary }]}>
                        Distance: {item.distance?.toFixed(2)}km
                      </Text>
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
    margin: 15,
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
  },
  flashListContent: {
    paddingBottom: 100,
  },
});