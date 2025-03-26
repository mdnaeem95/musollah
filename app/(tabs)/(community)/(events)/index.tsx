import React, { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Animated,
  FlatList,
  RefreshControl,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { ThemeType, useTheme } from "../../../../context/ThemeContext";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store/store";
import { fetchEvents } from "../../../../redux/slices/eventsSlice";
import { Event } from "../../../../utils/types";

// Event filter types
type EventFilterType = "upcoming" | "past" | "all";

/**
 * SegmentedControl component for switching between event types
 */
const SegmentedControl = memo(({ 
  activeFilter, 
  onFilterChange 
}: { 
  activeFilter: EventFilterType; 
  onFilterChange: (filter: EventFilterType) => void;
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.segmentedControlContainer}>
      <TouchableOpacity 
        style={[
          styles.segmentButton, 
          activeFilter === "all" && styles.segmentButtonActive
        ]}
        onPress={() => onFilterChange("all")}
        accessibilityLabel="View all events"
        accessibilityState={{ selected: activeFilter === "all" }}
      >
        <Text 
          style={[
            styles.segmentButtonText, 
            activeFilter === "all" && styles.segmentButtonTextActive
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.segmentButton, 
          activeFilter === "upcoming" && styles.segmentButtonActive
        ]}
        onPress={() => onFilterChange("upcoming")}
        accessibilityLabel="View upcoming events"
        accessibilityState={{ selected: activeFilter === "upcoming" }}
      >
        <Text 
          style={[
            styles.segmentButtonText, 
            activeFilter === "upcoming" && styles.segmentButtonTextActive
          ]}
        >
          Upcoming
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.segmentButton, 
          activeFilter === "past" && styles.segmentButtonActive
        ]}
        onPress={() => onFilterChange("past")}
        accessibilityLabel="View past events"
        accessibilityState={{ selected: activeFilter === "past" }}
      >
        <Text 
          style={[
            styles.segmentButtonText, 
            activeFilter === "past" && styles.segmentButtonTextActive
          ]}
        >
          Past
        </Text>
      </TouchableOpacity>
    </View>
  );
});

/**
 * EventCard component - Displays a single event in the list
 */
const EventCard = memo(({ event, onPress }: { event: Event; onPress: () => void }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} testID={`event-${event.id}`}>
      {/* Event Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: event.image }} 
          style={styles.eventImage} 
          // defaultSource={require('../../../../assets/placeholder-image.png')}
        />
      </View>

      {/* Event Details */}
      <View style={styles.eventDetails}>
        <Text style={styles.eventDate}>{event.date}</Text>
        <Text style={styles.eventTitle} numberOfLines={2} ellipsizeMode="tail">
          {event.name}
        </Text>
        <View style={styles.locationContainer}>
          <FontAwesome6 name="location-dot" size={12} color={theme.colors.text.muted} />
          <Text style={styles.eventLocation} numberOfLines={1} ellipsizeMode="tail">
            {event.venue}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

/**
 * Events screen - Displays a list of all events with search and filter functionality
 * @returns React component
 */
const Events = () => {
  const { theme } = useTheme() as { theme: ThemeType };
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { events, loading, error } = useSelector((state: RootState) => state.events);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<EventFilterType>("upcoming");
  const searchBarHeight = useState(new Animated.Value(0))[0];
  const styles = createStyles(theme);

  // Fetch events on mount
  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Parse date from format "DD Month YYYY"
  const parseEventDate = useCallback((dateString: string): Date => {
    try {
      const parts = dateString.split(' ');
      const day = parseInt(parts[0], 10);
      const month = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December']
                    .indexOf(parts[1]);
      const year = parseInt(parts[2], 10);
      
      if (isNaN(day) || month === -1 || isNaN(year)) {
        console.warn(`Invalid date format: ${dateString}`);
        return new Date(); // Return current date as fallback
      }
      
      return new Date(year, month, day);
    } catch (error) {
      console.warn(`Error parsing date: ${error}`);
      return new Date(); // Return current date as fallback
    }
  }, []);

  // Filter events based on active filter and search query
  const filteredEvents = useCallback(() => {
    if (!events.length) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // First filter by date
    let filtered = events;
    if (activeFilter === "upcoming") {
      filtered = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= today;
      });
    } else if (activeFilter === "past") {
      filtered = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate < today;
      });
    }
    
    // Then filter by search query if it exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [events, activeFilter, searchQuery, parseEventDate]);

  // Handle search bar animation
  const toggleSearchBar = useCallback(() => {
    const newVisibility = !isSearchVisible;
    setSearchVisible(newVisibility);

    Animated.timing(searchBarHeight, {
      toValue: newVisibility ? 40 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    if (!newVisibility) {
      setSearchQuery("");
    }
  }, [isSearchVisible, searchBarHeight]);

  // Navigation to event detail
  const handleEventPress = useCallback((eventId: string) => {
    router.push(`/(events)/${eventId}`);
  }, [router]);

  // Handle filter change
  const handleFilterChange = useCallback((filter: EventFilterType) => {
    setActiveFilter(filter);
  }, []);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchEvents()).unwrap();
    } catch (error) {
      console.error("Error refreshing events:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Render list items
  const renderItem = useCallback(({ item }: { item: Event }) => (
    <EventCard 
      event={item} 
      onPress={() => handleEventPress(item.id)} 
    />
  ), [handleEventPress]);

  const keyExtractor = useCallback((item: Event) => item.id, []);

  // List empty component
  const renderEmptyList = useCallback(() => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.text.primary} style={styles.loader} />;
    }
    
    if (error) {
      return (
        <View style={styles.centeredContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.centeredContent}>
        <Text style={styles.noEventsText}>
          {searchQuery 
            ? "No events matching your search."
            : activeFilter === "upcoming" 
              ? "No upcoming events found."
              : activeFilter === "past"
                ? "No past events found."
                : "No events found."
          }
        </Text>
      </View>
    );
  }, [loading, error, searchQuery, activeFilter, theme.colors.text.primary, styles, onRefresh]);

  return (
    <View style={styles.container} testID="events-screen">
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back button">
          <FontAwesome6 name="arrow-left" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity onPress={toggleSearchBar} accessibilityLabel="Search button">
          <FontAwesome6 
            name={isSearchVisible ? "times" : "magnifying-glass"} 
            size={22} 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Collapsible Search Bar */}
      <Animated.View style={[styles.searchBar, { height: searchBarHeight, opacity: searchBarHeight.interpolate({
        inputRange: [0, 40],
        outputRange: [0, 1]
      }) }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor={theme.colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={isSearchVisible}
          accessible={isSearchVisible}
          accessibilityLabel="Search events input"
        />
      </Animated.View>

      {/* Segmented Control for filtering */}
      <SegmentedControl 
        activeFilter={activeFilter} 
        onFilterChange={handleFilterChange} 
      />

      {/* Events List */}
      <FlatList
        data={filteredEvents()}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.eventsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.text.primary]}
          />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        testID="events-list"
      />
    </View>
  );
};

const createStyles = (theme: ThemeType) =>
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
      paddingBottom: 20,
      backgroundColor: theme.colors.primary,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: "Outfit_600SemiBold",
      color: theme.colors.text.primary,
      alignSelf: "center",
    },
    searchBar: {
      backgroundColor: theme.colors.secondary,
      marginHorizontal: 20,
      borderRadius: 8,
      paddingHorizontal: 12,
      justifyContent: "center",
      overflow: "hidden",
      marginBottom: 10,
    },
    searchInput: {
      height: 40,
      fontSize: 16,
      color: theme.colors.text.primary,
      fontFamily: "Outfit_400Regular",
    },
    segmentedControlContainer: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginVertical: 10,
      backgroundColor: theme.colors.secondary,
      borderRadius: 20,
      overflow: "hidden",
      height: 44,
    },
    segmentButton: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 10,
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      margin: 4,
    },
    segmentButtonText: {
      fontSize: 14,
      fontFamily: "Outfit_500Medium",
      color: theme.colors.text.muted,
    },
    segmentButtonTextActive: {
      color: theme.colors.text.primary,
      fontFamily: "Outfit_600SemiBold",
    },
    eventsContainer: {
      paddingHorizontal: 24,
      paddingBottom: 50,
      flexGrow: 1,
    },
    eventCard: {
      flexDirection: "row",
      backgroundColor: theme.colors.secondary,
      borderRadius: 16,
      padding: 10,
      marginBottom: 15,
      alignItems: "center",
      ...theme.shadows.default,
    },
    imageContainer: {
      width: 79,
      height: 92,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: "#FFCD6C",
      justifyContent: "center",
      alignItems: "center",
    },
    eventImage: {
      width: "100%",
      height: "100%",
      borderRadius: 10,
    },
    eventDetails: {
      flex: 1,
      marginLeft: 15,
      justifyContent: "center",
      gap: 5,
    },
    eventDate: {
      fontSize: 13,
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.primary,
    },
    eventTitle: {
      fontSize: 15,
      fontFamily: "Outfit_500Medium",
      color: theme.colors.text.primary,
      marginVertical: 4,
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    eventLocation: {
      fontSize: 13,
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.muted,
    },
    noEventsText: {
      textAlign: "center",
      color: theme.colors.text.secondary,
      fontSize: 16,
      fontFamily: "Outfit_400Regular",
      marginTop: 20,
    },
    loader: {
      marginTop: 40,
    },
    centeredContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 40,
    },
    errorText: {
      textAlign: "center",
      color: theme.colors.text.primary,
      marginBottom: 20,
      fontSize: 16,
      fontFamily: "Outfit_400Regular",
    },
    retryText: {
      textAlign: "center",
      color: theme.colors.text.primary,
      marginBottom: 20,
      fontSize: 16,
      fontFamily: "Outfit_400Regular",
    },
    retryButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
  });

export default Events;