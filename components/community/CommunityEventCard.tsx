import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import firestore from "@react-native-firebase/firestore";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

export type EventCardProps = {
  image: string;
  id: string
  title: string;
  date: string;
  location: string;
  goingCount: number;
  attendees: { [userId: string]: { avatarUrl?: string } };
  distance?: string;
};

const EventCard: React.FC<EventCardProps> = ({ id, image, title, date, location, goingCount, attendees, distance }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter()

  return (
    <MotiView
      from={{
        opacity: 0,
        translateY: 20,
      }}
      animate={{
        opacity: 1,
        translateY: 0,
      }}
      transition={{
        type: "timing",
        duration: 400,
        delay: Math.random() * 200, // slight randomness to stagger naturally
      }}
    >
      <TouchableOpacity 
        style={styles.eventCard} 
        onPress={() => router.push({
          pathname: "/(community)/(events)/[id]",
          params: { id },
        })
        }
        >
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.eventImage} />
          
          {/* Date Badge */}
          <View style={styles.dateBadge}>
          <Text style={styles.dateNumber}>{date.split(" ")[0]}</Text>
          <Text style={styles.dateMonth}>{date.split(" ")[1]}</Text>
          </View>


          {/* Bookmark Icon
          <TouchableOpacity style={styles.bookmarkContainer} onPress={toggleBookmark}>
          <FontAwesome6
              name="bookmark"
              size={16}
              color={bookmarked ? theme.colors.accent : theme.colors.text.muted}
              solid={bookmarked}
            />
          </TouchableOpacity> */}
        </View>

        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
          <View style={styles.avatarRow}>
            {Object.values(attendees || {})
              .slice(0, 3)
              .map((attendee, index) => (
                <Image
                  key={index}
                  source={{ uri: attendee.avatarUrl || "https://via.placeholder.com/100" }}
                  style={[
                    styles.avatar,
                    { marginLeft: index === 0 ? 0 : -10 }
                  ]}
                />
              ))}
            <Text style={styles.goingText}>+{goingCount} Going</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 10 }}>
              <FontAwesome6 name="location-dot" size={18} color={theme.colors.text.muted} />
              <Text style={styles.eventLocation}>{location}</Text>
              {distance && (
                <Text style={[styles.eventLocation, { fontSize: theme.fontSizes.small }]}> - {distance} km away</Text>
              )}
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    eventCard: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.small,
      width: 280,
      marginLeft: 5,
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
      margin: theme.spacing.small
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
    },
    avatarRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      gap: 5
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: "white",
    },
    distanceText: {
      fontSize: 12,
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.secondary,
      marginTop: 4,
    }    
});

export default EventCard;