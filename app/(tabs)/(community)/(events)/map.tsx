import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  FlatList,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store/store";
import { fetchUserLocation } from "../../../../redux/slices/userLocationSlice";
import { Event } from "../../../../utils/types";

const EventsMap = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const styles = createStyles(theme);
  const router = useRouter();
  const flatListRef = useRef(null);
  
  // State from Redux
  const events = useSelector((state: RootState) => state.events.events);
  const { userLocation } = useSelector((state: RootState) => state.location);

  // Local state
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [cardWidth, setCardWidth] = useState(340); // Default card width
  const cardGap = 15; // Gap between cards
  
  // Get events with valid coordinates
  const eventsWithCoordinates = events.filter(event => 
    event.coordinates && event.coordinates.latitude && event.coordinates.longitude
  );

  // Calculate card width based on screen size
  useEffect(() => {
    const { width } = Dimensions.get('window');
    setCardWidth(width * 0.85); // Card takes 85% of screen width
  }, []);

  // Initialize map and fetch user location
  useEffect(() => {
    dispatch(fetchUserLocation());
    
    // Set default region if no user location
    if (!userLocation && eventsWithCoordinates.length > 0) {
      const firstEvent = eventsWithCoordinates[0];
      setRegion({
        latitude: firstEvent.coordinates?.latitude!,
        longitude: firstEvent.coordinates?.longitude!,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      });
      setSelectedEvent(firstEvent.id);
    }
    
    setLoading(false);
  }, [dispatch]);

  // Update region when user location changes
  useEffect(() => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation]);

  // Handle recenter on user location
  const handleRecenterMap = useCallback(() => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      Alert.alert("Location not available", "Please enable location services to use this feature.");
    }
  }, [userLocation]);

  // Handle marker press with scroll to item
  const handleMarkerPress = useCallback((eventId: string) => {
    setSelectedEvent(eventId);
    
    // Find the event index
    const eventIndex = eventsWithCoordinates.findIndex(e => e.id === eventId);
    if (eventIndex !== -1 && flatListRef.current) {
      // Scroll to the event card
      flatListRef.current.scrollToIndex({
        index: eventIndex,
        animated: true,
        viewPosition: 0.5
      });
      
      // Update the map region
      const event = eventsWithCoordinates[eventIndex];
      if (event && event.coordinates) {
        setRegion({
          latitude: event.coordinates.latitude,
          longitude: event.coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
  }, [eventsWithCoordinates]);

  // Handle viewable items change to update selected event
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const firstVisibleEvent = viewableItems[0].item;
      setSelectedEvent(firstVisibleEvent.id);
      
      // Update the map region
      if (firstVisibleEvent && firstVisibleEvent.coordinates) {
        setRegion({
          latitude: firstVisibleEvent.coordinates.latitude,
          longitude: firstVisibleEvent.coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
  }, []);

  // Viewability configuration for FlatList
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };
  
  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged: handleViewableItemsChanged }
  ]);

  // Render item for FlatList
  const renderEventCard = useCallback(({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.eventCard,
        { width: cardWidth },
        selectedEvent === item.id && styles.selectedEventCard
      ]}
      onPress={() => router.push(`/(events)/${item.id}`)}
    >
      {/* Event Image */}
      <Image 
        source={{ uri: item.image }} 
        style={styles.eventImage}
      />

      {/* Event Details */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventDate}>{item.date}</Text>
        <Text style={styles.eventTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.eventLocationContainer}>
          <FontAwesome6 name="location-dot" size={12} color={theme.colors.text.muted} />
          <Text style={styles.eventLocation} numberOfLines={1}>{item.venue}</Text>
        </View>
      </View>

      {/* Bookmark Icon */}
      <TouchableOpacity style={styles.bookmarkIcon}>
        <FontAwesome6 name="bookmark" size={16} color={theme.colors.text.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [cardWidth, selectedEvent, router, theme.colors.text.muted]);

  // Handle onMomentumScrollEnd to center the map on the selected event
  const handleMomentumScrollEnd = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (cardWidth + cardGap));
    
    if (index >= 0 && index < eventsWithCoordinates.length) {
      const event = eventsWithCoordinates[index];
      setSelectedEvent(event.id);
      
      if (event.coordinates) {
        setRegion({
          latitude: event.coordinates.latitude,
          longitude: event.coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
  }, [cardWidth, cardGap, eventsWithCoordinates]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome6 name="arrow-left" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Events</Text>
        <TouchableOpacity onPress={handleRecenterMap}>
          <FontAwesome6 name="location-crosshairs" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.text.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          {/* Map View */}
          {region && (
            <MapView
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {eventsWithCoordinates.map((event) => (
                <Marker
                  key={event.id}
                  coordinate={{
                    latitude: event.coordinates?.latitude!,
                    longitude: event.coordinates?.longitude!,
                  }}
                  title={event.name}
                  description={event.venue}
                  onPress={() => handleMarkerPress(event.id)}
                  pinColor={selectedEvent === event.id ? theme.colors.primary : undefined}
                />
              ))}
            </MapView>
          )}

          {/* Floating Events List */}
          <View style={styles.eventsContainer}>
            {eventsWithCoordinates.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={eventsWithCoordinates}
                renderItem={renderEventCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + cardGap}
                snapToAlignment="center"
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 10 }}
                ItemSeparatorComponent={() => <View style={{ width: cardGap }} />}
                viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                initialScrollIndex={eventsWithCoordinates.findIndex(e => e.id === selectedEvent)}
                getItemLayout={(data, index) => ({
                  length: cardWidth + cardGap,
                  offset: (cardWidth + cardGap) * index,
                  index,
                })}
              />
            ) : (
              <View style={[styles.noEventsCard, { width: cardWidth }]}>
                <Text style={styles.noEventsText}>No events with location data available</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.colors.primary 
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 15,
      backgroundColor: theme.colors.primary,
    },
    backButton: {
      padding: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: "Outfit_600SemiBold",
      color: theme.colors.text.primary,
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      color: theme.colors.text.primary,
      fontFamily: "Outfit_400Regular",
    },
    eventsContainer: {
      position: "absolute",
      bottom: 20,
      left: 0,
      right: 0,
      paddingBottom: 10,
    },
    eventCard: {
      flexDirection: "row",
      backgroundColor: "white",
      borderRadius: 16,
      padding: 12,
      height: 100,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    selectedEventCard: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    eventImage: {
      width: 70,
      height: 70,
      borderRadius: 10,
      backgroundColor: '#f0f0f0',
    },
    eventInfo: {
      flex: 1,
      marginLeft: 12,
      gap: 3,
    },
    eventDate: {
      fontSize: 13,
      fontFamily: "Outfit_400Regular",
      color: "#5669FF",
    },
    eventTitle: {
      fontSize: 16,
      fontFamily: 'Outfit_500Medium',
      color: "#120D26",
    },
    eventLocationContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
    },
    eventLocation: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      marginLeft: 5,
      color: "#747688",
    },
    bookmarkIcon: {
      padding: 5,
    },
    noEventsCard: {
      height: 100,
      backgroundColor: "white",
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
      alignSelf: 'center',
      marginHorizontal: 20,
    },
    noEventsText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: "#747688",
      textAlign: 'center',
      padding: 10,
    },
  });

export default EventsMap;