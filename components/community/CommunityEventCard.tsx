import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store/store";

export type EventCardProps = {
  image: string;
  id: string
  title: string;
  date: string;
  location: string;
  goingCount: number;
};

const EventCard: React.FC<EventCardProps> = ({ id, image, title, date, location, goingCount }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter()

  return (
    <TouchableOpacity style={styles.eventCard} onPress={() => router.push(`/(events)/${id}`)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.eventImage} />
        
        {/* Date Badge */}
        <View style={styles.dateBadge}>
        <Text style={styles.dateNumber}>{date.split(" ")[0]}</Text>
        <Text style={styles.dateMonth}>{date.split(" ")[1]}</Text>
        </View>


        {/* Bookmark Icon */}
        <TouchableOpacity style={styles.bookmarkContainer}>
          <FontAwesome6 name="bookmark" size={16} color={theme.colors.accent} solid />
        </TouchableOpacity>
      </View>

      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        <Text style={styles.goingText}>+{goingCount} Going</Text>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 10 }}>
            <FontAwesome6 name="location-dot" size={18} color={theme.colors.text.muted} />
            <Text style={styles.eventLocation}>{location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    eventCard: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.medium,
      width: "90%",
      maxWidth: 260,
      alignSelf: "center", 
      marginBottom: theme.spacing.large,
      ...theme.shadows.default,
    },
    imageContainer: {
      position: "relative",
      width: "100%",
      height: 160,
      borderRadius: theme.borderRadius.large,
      overflow: "hidden",
    },
    eventImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
      borderRadius: theme.borderRadius.large,
    },
    dateBadge: {
      position: "absolute",
      top: theme.spacing.small,
      left: theme.spacing.small,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: theme.spacing.small,
      borderRadius: theme.borderRadius.small,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateNumber: {
        fontSize: theme.fontSizes.xxLarge, // Bigger for emphasis
        fontFamily: "Outfit_700Bold",
        color: theme.colors.accent,
        lineHeight: 24,
    },
    dateMonth: {
        fontSize: theme.fontSizes.small, // Smaller month text
        fontFamily: "Outfit_600SemiBold",
        color: theme.colors.accent,
        textTransform: "uppercase",
    },
    bookmarkContainer: {
      position: "absolute",
      top: theme.spacing.small,
      right: theme.spacing.small,
      backgroundColor: theme.colors.primary,
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.small,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.default,
    },
    eventDetails: {
      marginTop: theme.spacing.medium,
    },
    eventTitle: {
      fontSize: theme.fontSizes.large,
      fontFamily: "Outfit_600SemiBold",
      color: theme.colors.text.primary,
    },
    eventLocation: {
      fontSize: theme.fontSizes.medium,
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.muted,
      lineHeight: 20,
    },
    goingText: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
      fontFamily: "Outfit_600SemiBold",
      marginTop: theme.spacing.small,
    },
});

export default EventCard;