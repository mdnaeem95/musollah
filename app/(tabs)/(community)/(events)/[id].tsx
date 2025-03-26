import React, { useRef, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, StatusBar, Animated, Modal, Linking, Alert, ActivityIndicator, Share } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { CircleButton } from "../../(food)/_layout";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store/store";
import { downloadImage } from "../../../../utils";

const HERO_IMAGE_HEIGHT = 250;
const HEADER_HEIGHT = 60;
const statusBarHeight = (StatusBar.currentHeight || 24) + 20;

const EventDetails = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const event = useSelector((state: RootState) => state.events.events.find(e => e.id === id));
  const scrollY = useRef(new Animated.Value(0)).current

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const openImageViewer = (images: string) => {
    setSelectedImage(images);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  const shareEvent = () => {
    if (!event) return;

    Share.share({
      title: event.name,
      message: `Check out ${event.name} on ${event.date} at ${event.venue}. ${event.registrationLink || ''}`
    });
  };

  const heroImageHeight = scrollY.interpolate({
    inputRange: [-HERO_IMAGE_HEIGHT, 0, HERO_IMAGE_HEIGHT],
    outputRange: [HERO_IMAGE_HEIGHT * 1.5, HERO_IMAGE_HEIGHT, HERO_IMAGE_HEIGHT],
    extrapolate: 'clamp'
  })

  const heroImageTranslate = scrollY.interpolate({
    inputRange: [-HERO_IMAGE_HEIGHT, 0, HERO_IMAGE_HEIGHT],
    outputRange: [-HERO_IMAGE_HEIGHT * 0.25, 0, 0],
    extrapolate: 'clamp'
  })

  const headerBackground = scrollY.interpolate({
    inputRange: [0, HERO_IMAGE_HEIGHT - HEADER_HEIGHT],
    outputRange: ['transparent', theme.colors.secondary],
    extrapolate: 'clamp'
  })

  // Calculate attendees and interested count
  const attendeesCount = event?.attendees ? Object.keys(event.attendees).length : 0;
  const interestedCount = event?.interested ? Object.keys(event.interested).length : 0;
  const totalEngaged = attendeesCount + interestedCount || 20; // Fallback to 20 if both are 0

  return (
    <View style={styles.container}>
        <Animated.View style={[styles.header, { backgroundColor: headerBackground, paddingTop: statusBarHeight }]}>
            <CircleButton onPress={() => router.back()} />
            <TouchableOpacity style={styles.shareButton} onPress={shareEvent}>
              <FontAwesome6 name="share" size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView
            style={{ flex: 1, backgroundColor: theme.colors.secondary }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
        >
            {/* Event Image with Overlay */}
            <Animated.View style={[styles.imageContainer, { height: heroImageHeight, transform: [{ translateY: heroImageTranslate }] }]} onTouchStart={() => openImageViewer(event?.image!)}>
                <Image source={{ uri: event?.image }} style={styles.eventImage} />
                <View style={styles.overlay} />
            </Animated.View>
            
            {/* Floating Going Info */}
            <View style={styles.goingContainer}>
                <View style={styles.goingTextContainer}>
                <Image source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }} style={styles.avatar} />
                <Image source={{ uri: "https://randomuser.me/api/portraits/men/45.jpg" }} style={styles.avatar} />
                <Text style={styles.goingText}>+{totalEngaged} Going</Text>
                </View>
                <TouchableOpacity style={styles.inviteButton} onPress={shareEvent}>
                <Text style={styles.inviteText}>Invite</Text>
                </TouchableOpacity>
            </View>

            {/* Event Details */}
            <View style={styles.detailsContainer}>
                <Text style={styles.eventTitle}>{event?.name}</Text>
                
                {/* Date & Time */}
                <View style={styles.detailRow}>
                    <View style={styles.detailsIconContainer}>
                        <FontAwesome6 name="calendar" size={25} color={theme.colors.text.primary} />
                    </View>
                    <View style={{ gap: 10 }}>
                        <Text style={styles.detailTextTop}>{event?.date}</Text>
                        <Text style={styles.detailTextBottom}>{event?.time}</Text>
                    </View>
                </View>
                
                {/* Location */}
                <View style={styles.detailRow}>
                    <View style={styles.detailsIconContainer}>
                        <FontAwesome6 name="location-dot" size={25} color={theme.colors.text.primary} />
                    </View>
                    <View style={{ gap: 10 }}>
                        <Text style={styles.detailTextTop}>{event?.venue}</Text>
                        <Text style={styles.detailTextBottom}>{event?.address}</Text>
                    </View>
                    {event?.coordinates ? (
                      <TouchableOpacity 
                        style={styles.mapButton}
                        onPress={() => {
                          const { latitude, longitude } = event.coordinates!;
                          const url = `https://maps.google.com/?q=${latitude},${longitude}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Text style={styles.mapButtonText}>Map</Text>
                      </TouchableOpacity>
                    ) : null }
                </View>
                
                {/* Event Features */}
                <View style={styles.featuresContainer}>
                  {event?.wheelchairAccessible ? (
                    <View style={styles.featureItem}>
                      <FontAwesome6 name="wheelchair" size={14} color={theme.colors.text.primary} />
                      <Text style={styles.featureText}>Accessible</Text>
                    </View>
                  ) : null }
                  
                  {event?.livestreamAvailable ? (
                    <View style={styles.featureItem}>
                      <FontAwesome6 name="video" size={14} color={theme.colors.text.primary} />
                      <Text style={styles.featureText}>Livestream</Text>
                    </View>
                  ) : null }
                  
                  {event?.language ? (
                    <View style={styles.featureItem}>
                      <FontAwesome6 name="language" size={14} color={theme.colors.text.primary} />
                      <Text style={styles.featureText}>{event.language}</Text>
                    </View>
                  ) : null }
                  
                  {event?.ticketPrice ? (
                    <View style={styles.featureItem}>
                      <FontAwesome6 name="ticket" size={14} color={theme.colors.text.primary} />
                      <Text style={styles.featureText}>
                        {event.ticketPrice === "Free" ? "Free" : event.ticketPrice}
                      </Text>
                    </View>
                  ) : null}
                </View>
                
                {/* Organizer */}
                <View style={styles.detailRow}>
                    <Image source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} style={styles.organizerAvatar} />
                    <View>
                        <Text style={styles.organizerName}>{event?.organizer}</Text>
                        <Text style={styles.organizer}>Organizer</Text>
                    </View>
                    <TouchableOpacity style={styles.followButton}>
                        <Text style={styles.followText}>Follow</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* About Event */}
            <View style={styles.aboutContainer}>
                <Text style={styles.sectionTitle}>About Event</Text>
                <Text style={styles.aboutText}>
                {event?.description}
                </Text>
            </View>
            
            {/* Target Audience */}
            {event?.targetAudience ? event.targetAudience !== "All" && (
              <View style={styles.aboutContainer}>
                <Text style={styles.sectionTitle}>Target Audience</Text>
                <Text style={styles.aboutText}>
                  This event is specifically designed for {event.targetAudience.toLowerCase()}.
                </Text>
              </View>
            ) : null }

            {/* Buy Ticket Button */}
            <View style={{ alignItems: "center", justifyContent: "center", }}>
                <TouchableOpacity 
                  style={styles.buyButton} 
                  onPress={() => {
                    if (event?.registrationLink) {
                      Linking.openURL(event.registrationLink);
                    }
                  }}
                >
                    <Text style={styles.buyButtonText}>
                      {event?.isExternal ? "Register" : "RSVP"}
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.ScrollView>

      {/* Fullscreen Image Viewer */}
      <Modal visible={!!selectedImage} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={closeImageViewer} style={styles.closeButton}>
            <FontAwesome6 name="xmark" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
          ) : null }

            {/* Download Button */}
            {selectedImage ? (
              <TouchableOpacity 
                  onPress={async () => {
                      try {
                      setIsDownloading(true); // Show loading state
                      await downloadImage(selectedImage);
                      Alert.alert("Success", "Image saved to gallery!");
                      } catch (error) {
                      Alert.alert("Error", "Failed to download image.");
                      } finally {
                      setIsDownloading(false);
                      }
                  }} 
                  style={styles.downloadButton}
                  disabled={isDownloading}
                  >
                  {isDownloading ? (
                      <ActivityIndicator size="small" color="white" />
                  ) : (
                      <>
                      <FontAwesome6 name="download" size={24} color="white" />
                      <Text style={styles.downloadText}>Download</Text>
                      </>
                  )}
              </TouchableOpacity>
            ) : null }
          </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT + statusBarHeight, justifyContent: "space-between", paddingHorizontal: 16, zIndex: 10, flexDirection: 'row', alignItems: "flex-start" },
    shareButton: { 
      width: 40, 
      height: 40, 
      borderRadius: 20,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.default,
    },
    imageContainer: { position: "absolute", top: 0, left: 0, right: 0, height: HERO_IMAGE_HEIGHT, zIndex: -1 },
    eventImage: { width: "100%", height: "100%", resizeMode: "cover" },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.4)" },
    backButton: { position: "absolute", top: 40, left: 20 },
    bookmarkButton: { position: "absolute", top: 40, right: 20 },
    goingContainer: {
      position: "absolute", top: 220, left: "50%", width: 250, transform: [{ translateX: -125 }],
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: theme.colors.primary, borderRadius: 20, padding: 10, paddingHorizontal: 10,
      ...theme.shadows.default,
    },
    goingTextContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
    avatar: { width: 30, height: 30, borderRadius: 15, marginLeft: -10, borderWidth: 2, borderColor: "white" },
    goingText: { marginLeft: 10, fontSize: 14, color: theme.colors.text.primary, fontFamily: 'Outfit_700Bold' },
    inviteButton: { backgroundColor: theme.colors.secondary, borderRadius: 10, padding: 8 },
    inviteText: { color: theme.colors.text.primary, fontSize: 14, fontFamily: "Outfit_400Regular" },
    detailsContainer: { marginTop: HERO_IMAGE_HEIGHT + 30, padding: 20, marginBottom: 10, gap: 16 },
    detailsIconContainer: { height: 48, width: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.muted, borderRadius: 10 },
    eventTitle: { fontSize: 35, lineHeight: 46, fontFamily: 'Outfit_400Regular', color: theme.colors.text.primary },
    detailRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 10 },
    detailText: { marginLeft: 10, fontSize: 16, color: theme.colors.text.secondary },
    detailTextTop: { marginLeft: 10, fontSize: 16, color: theme.colors.text.primary, fontFamily: 'Outfit_400Regular' },
    detailTextBottom: { marginLeft: 10, fontSize: 12, color: theme.colors.text.muted, fontFamily: 'Outfit_400Regular'  },
    mapButton: { 
      marginLeft: "auto",
      backgroundColor: theme.colors.primary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    mapButtonText: {
      color: theme.colors.text.primary,
      fontSize: 12,
      fontFamily: 'Outfit_400Regular',
    },
    featuresContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
      gap: 10,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.muted,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 12,
      gap: 5,
    },
    featureText: {
      fontSize: 12,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_400Regular',
    },
    organizerAvatar: { width: 44, height: 44, borderRadius: 15 },
    organizerName: { marginLeft: 10, fontSize: 15, color: theme.colors.text.primary, fontFamily: 'Outfit_400Regular' },
    organizer: { marginLeft: 10, fontSize: 12, color: theme.colors.text.muted, fontFamily: 'Outfit_400Regular' },
    followButton: { marginLeft: "auto", backgroundColor: theme.colors.muted, padding: 10, borderRadius: 10 },
    followText: { color: theme.colors.text.primary, fontSize: 14, fontFamily: 'Outfit_400Regular' },
    aboutContainer: { padding: 20 },
    sectionTitle: { fontSize: 18, fontFamily: 'Outfit_500Medium', color: theme.colors.text.primary, marginBottom: 10 },
    aboutText: { fontSize: 16, lineHeight: 28, color: theme.colors.text.secondary, fontFamily: 'Outfit_400Regular' },
    buyButton: { backgroundColor: theme.colors.primary, padding: 15, borderRadius: 15, margin: 20, width: 250,},
    buyButtonText: { color: theme.colors.text.primary, fontSize: 16, textAlign: 'center', fontFamily: 'Outfit_400Regular' },
    modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", },
    fullScreenImage: { width: "90%", height: "70%", resizeMode: "contain", },
    closeButton: { position: "absolute", top: 40, right: 20, zIndex: 10, },
    downloadButton: { position: "absolute", bottom: 40, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.6)", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10,},
    downloadText: { color: "white", fontSize: 16, marginLeft: 10, fontFamily: "Outfit_400Regular" },
  });

export default EventDetails;