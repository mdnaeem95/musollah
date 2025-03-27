import React, { useEffect, useCallback, memo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store/store";
import { fetchEvents } from "../../../redux/slices/eventsSlice";
import { FontAwesome6 } from "@expo/vector-icons";
import { ThemesType, useTheme } from "../../../context/ThemeContext";
import EventCard from "../../../components/community/CommunityEventCard";
import { useRouter } from "expo-router";
import { Event } from "../../../utils/types";
import { FlashList } from "@shopify/flash-list";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { CATEGORY_COLORS } from '../../../constants/categoryColours'

// Category data extracted to a constant
const CATEGORIES = [
  { name: "Religious Talks", icon: "chalkboard-user" },
  { name: "Qur'an Recitation", icon: "book-quran" },
  { name: "Tahajjud & Qiyam", icon: "mosque" },
  { name: "Maulid & Khatam", icon: "star-and-crescent" },
  { name: "Charity & Volunteering", icon: "hands-holding" },
  { name: "Workshops & Learning", icon: "people-group" },
  { name: "Arabic & Tajweed", icon: "language" },
  { name: "Youth Events", icon: "user-graduate" },
  { name: "Mental Wellness", icon: "brain" },
  { name: "Converts & Reverts", icon: "handshake" },
  { name: "Interfaith & Outreach", icon: "globe" },
  { name: "Community Iftar", icon: "utensils" }
];

/**
 * Category component - Displays a single event category
 */
const Category = memo(({ name, icon, color, onPress }: { 
  name: string;
  icon: string;
  color: string;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <TouchableOpacity 
      style={[styles.category, { backgroundColor: color }]}
      onPress={onPress}
    >
      <FontAwesome6 
        name={icon} 
        size={16} 
        color="#000" 
        style={styles.categoryIcon}
      />
      <Text style={[styles.categoryText, { color: '#000' }]}>{name}</Text>
    </TouchableOpacity>
  );
});

/**
 * SectionHeader component - Displays a section title with "See All" button
 */
const SectionHeader = memo(({ title, onSeeAll }: { 
  title: string; 
  onSeeAll: () => void;
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.viewAllText}>See All</Text>
      </TouchableOpacity>
    </View>
  );
});

/**
 * EventsList component - Displays a horizontal list of events
 * Handles loading, error, and empty states
 */
const EventsList = memo(({ 
  events, 
  loading, 
  error 
}: { 
  events: Event[]; 
  loading: boolean; 
  error: string | null;
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.secondary} style={styles.loader} />;
  }
  
  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }
  
  if (events.length === 0) {
    return <Text style={styles.emptyText}>No events found</Text>;
  }
  
  return (
    <FlashList
      data={events}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      estimatedItemSize={218}
      renderItem={({ item }) => (
        <EventCard
          id={item.id}
          image={item.image || ''}
          title={item.name}
          date={item.date}
          location={item.venue}
          goingCount={item.interestedCount || 0}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
    />
  );
});

/**
 * CommunityHome - Main component for displaying community events
 * 
 * This component is responsible for:
 * - Displaying event categories
 * - Showing upcoming events
 * - Showing nearby events
 * - Providing search functionality
 * - Handling pull-to-refresh to update events
 * 
 * @returns React component
 */
const CommunityHome = () => {
  const { theme } = useTheme() as { theme: ThemesType };
  const styles = createStyles(theme);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [activeCategories, setActiveCategories] = useState<string[]>(
    CATEGORIES.map(category => category.name)
  ); 

  // Retrieve events from Redux state
  const { events, loading, error } = useSelector((state: RootState) => state.events);

  const filteredEvents = events.filter(event => {
    const isActiveCategory = activeCategories.includes(event.category);
    const isRelevantStatus = event.status === "upcoming" || event.status === "ongoing";
  
    const matchesSearch =
      debouncedSearch.trim() === "" ||
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchQuery.toLowerCase());
  
    return isActiveCategory && isRelevantStatus && matchesSearch;
  });  
  
  // Fetch events on mount
  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Callback handlers
  const handleCategoryPress = useCallback((category: string) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category) // Remove if already selected
        : [...prev, category]                // Add if not selected
    );
  }, []);  

  const handleSeeAllUpcoming = useCallback(() => {
    router.push('/(events)');
  }, [router]);

  const handleSeeAllNearby = useCallback(() => {
    router.push('(events)/map');
  }, [router]);
  
  // Implement refresh functionality
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}> 
      {/* Header Section */}
      <View style={styles.headerContainer}>        
        {/* Search & Filters */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={20} color={theme.colors.text.primary} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor={theme.colors.text.primary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search events"
          />
          <TouchableOpacity 
            style={styles.filterButton}
            accessibilityLabel="Filter events"
          >
            <FontAwesome6 name="filter" size={16} color={theme.colors.text.primary} />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        testID="community-home-scroll-view"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.secondary]}
          />
        }
      >
        {/* Categories */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.name}
          renderItem={({ item, index }) => {
            const isActive = activeCategories.includes(item.name);
            const pastelColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
            const backgroundColor = isActive ? pastelColor : theme.colors.secondary;

            return (
              <Category
                name={item.name}
                icon={item.icon}
                color={backgroundColor}
                onPress={() => handleCategoryPress(item.name)}
              />
            );
          }}
          contentContainerStyle={styles.categoriesContainer}
        />

        {/* Upcoming Events - Filtered for future dates */}
        <SectionHeader 
          title="Upcoming Events" 
          onSeeAll={handleSeeAllUpcoming} 
        />
        <EventsList 
          events={filteredEvents}
          loading={loading} 
          error={error} 
        />

        {/* Nearby Events - Could be filtered by location when coordinates are available */}
        <SectionHeader 
          title="Nearby You" 
          onSeeAll={handleSeeAllNearby} 
        />
        <EventsList 
          events={filteredEvents} 
          loading={loading} 
          error={error} 
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: ThemesType) =>
  StyleSheet.create({
    container: { 
      flex: 1 
    },
    headerContainer: { 
      backgroundColor: theme.colors.secondary, 
      padding: 20, 
      borderBottomLeftRadius: 30, 
      borderBottomRightRadius: 30 
    },
    searchContainer: { 
      flexDirection: "row", 
      alignItems: "center", 
      backgroundColor: theme.colors.secondary, 
      padding: 10, 
      borderRadius: 12, 
      marginTop: 15 
    },
    searchInput: { 
      flex: 1, 
      color: theme.colors.text.primary, 
      marginLeft: 10 
    },
    filterButton: { 
      flexDirection: "row", 
      alignItems: "center", 
      paddingHorizontal: 12, 
      paddingVertical: 10, 
      borderRadius: 50, 
      backgroundColor: theme.colors.primary 
    },
    filterText: { 
      color: theme.colors.text.primary, 
      marginLeft: 6 
    },
    contentContainer: { 
      padding: 20 
    },
    categoriesContainer: { 
      gap: 10, 
      paddingHorizontal: 5, 
      paddingTop: 5, 
      marginBottom: 20 
    },
    category: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 20,
      marginRight: 10,
      elevation: 2, // Android
      shadowColor: "#000", // iOS
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },    
    categoryIcon: { 
      marginRight: theme.spacing.small 
    },
    categoryText: { 
      color: theme.colors.text.primary, 
      fontSize: 14, 
      marginLeft: 5 
    },
    sectionHeader: { 
      flexDirection: "row", 
      justifyContent: "space-between", 
      alignItems: "center", 
      marginVertical: 10 
    },
    sectionTitle: { 
      fontSize: 18, 
      fontWeight: "500", 
      color: theme.colors.text.primary 
    },
    viewAllText: { 
      fontSize: 14, 
      color: theme.colors.text.muted 
    },
    eventsListContainer: { 
      paddingHorizontal: 5, 
      paddingTop: 5, 
      marginTop: 10 
    },
    loadingText: { 
      textAlign: "center", 
      color: theme.colors.text.muted, 
      marginTop: 20 
    },
    errorText: { 
      textAlign: "center", 
      color: theme.colors.text.primary, 
      marginTop: 20 
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.text.muted,
      marginTop: 20,
      fontStyle: "italic"
    },
    loader: {
      marginTop: 20
    }
  });

export default CommunityHome;