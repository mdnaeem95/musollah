import React from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

type EventCardProps = {
  image: string;
  title: string;
  date: string;
  location: string;
  time: string;
};

const CommunityHome = () => {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <FontAwesome6 name="bars" size={20} color="#FFFFFF" />
        <Text style={styles.headerText}>Community</Text>
        <TouchableOpacity>
          <Image source={{ uri: "https://via.placeholder.com/36" }} style={styles.avatar} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter Section */}
      <View style={styles.searchSection}>
        <FontAwesome6 name="search" size={20} color="#FFFFFF" />
        <Text style={styles.searchPlaceholder}>Search...</Text>
        <TouchableOpacity style={styles.filterButton}>
          <FontAwesome6 name="filter" size={16} color="#FFFFFF" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {["Sports", "Music", "Food", "Art"].map((category, index) => (
          <TouchableOpacity key={index} style={styles.category}>
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Popular Events Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular</Text>
        <TouchableOpacity style={styles.viewAll}>
          <Text style={styles.viewAllText}>All</Text>
          <FontAwesome6 name="chevron-right" size={10} color="#747688" />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <View style={styles.eventsContainer}>
        <EventCard
          image="https://via.placeholder.com/200"
          title="Women's Leadership"
          date="1st May - Sat - 2:00 PM"
          location="Downtown Hall"
          time="24 min away"
        />
        <EventCard
          image="https://via.placeholder.com/200"
          title="International Kids Fair"
          date="3rd May - Mon - 10:00 AM"
          location="Expo Center"
          time="15 min away"
        />
      </View>
    </ScrollView>
  );
};

const EventCard = ({ image, title, date, location, time }: EventCardProps) => (
  <View style={styles.eventCard}>
    <Image source={{ uri: image }} style={styles.eventImage} />
    <View style={styles.eventDetails}>
      <Text style={styles.eventTitle}>{title}</Text>
      <Text style={styles.eventDate}>{date}</Text>
      <View style={styles.eventMeta}>
        <FontAwesome6 name="map-pin" size={12} color="#747688" />
        <Text style={styles.eventLocation}>{location}</Text>
        <FontAwesome6 name="clock" size={12} color="#747688" />
        <Text style={styles.eventTime}>{time}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A43EC",
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
  },
  searchPlaceholder: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5D56F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  filterText: {
    color: "#FFFFFF",
    marginLeft: 6,
  },
  categories: {
    flexDirection: "row",
    marginBottom: 20,
  },
  category: {
    backgroundColor: "#F0635A",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#120D26",
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#747688",
    marginRight: 5,
  },
  eventsContainer: {
    marginBottom: 20,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    shadowColor: "#505588",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 5,
    flexDirection: "row",
    marginBottom: 15,
  },
  eventImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  eventDetails: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#120D26",
  },
  eventDate: {
    fontSize: 12,
    color: "#5669FF",
    marginVertical: 4,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  eventLocation: {
    fontSize: 13,
    color: "#747688",
    marginLeft: 4,
    marginRight: 10,
  },
  eventTime: {
    fontSize: 13,
    color: "#747688",
    marginLeft: 4,
  },
});

export default CommunityHome;