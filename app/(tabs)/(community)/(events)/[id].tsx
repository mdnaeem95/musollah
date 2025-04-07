import React, { useRef, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, StatusBar, Animated, Modal, Linking, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { CircleButton } from "../../(food)/_layout";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store/store";
import { downloadImage } from "../../../../utils";
import { MotiView } from "moti";
import { fadeInUp } from "../../../../utils/animations";
import { confirmExternalAttendance, markExternalInterest, toggleEventInterest } from "../../../../api/firebase/events";
import { useAuth } from "../../../../context/AuthContext";
import { fetchEvents } from "../../../../redux/slices/eventsSlice";
import SignInModal from "../../../../components/SignInModal";
import InviteFriendsModal from "../../../../components/community/InviteModal";
import Toast from "react-native-toast-message";
import { inviteUsersToEvent } from "../../../../api/firebase/community";
import { UserData } from "../../../../utils/types";
import OrganizerSection from "../../../../components/community/OrganizerSection";

const HERO_IMAGE_HEIGHT = 250;
const HEADER_HEIGHT = 60;
const statusBarHeight = (StatusBar.currentHeight || 24) + 20;

const EventDetails = () => {
  const { user } = useAuth();
  const currentUser = useSelector((state: RootState) => state.user.user);
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();

  const styles = createStyles(theme);
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter();
  const event = useSelector((state: RootState) => state.events.events.find(e => e.id === id));
  const scrollY = useRef(new Animated.Value(0)).current
  const userId = user?.uid!;

  const hasClickedRegister = !!event?.interested?.[userId]?.clickedRegistration;
  const isExternalOpen = event?.isExternal && event?.eventType === "Open" && event?.registrationLink === "";
  const isRegistrationEvent = event?.eventType === "Registration" && !(event?.registrationLink === "")

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clickedRegister, setClickedRegister] = useState(hasClickedRegister);
  const [localConfirmed, setLocalConfirmed] = useState(
    !!event?.attendees?.[userId]
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [interested, setInterested] = useState<boolean>(!!event?.interested?.[userId]);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const handleConfirmAttendance = async () => {
    try {
      await confirmExternalAttendance(event!.id);
      setLocalConfirmed(true);         // ✅ Instant UI feedback
      dispatch(fetchEvents());         // 🔁 Refresh backend snapshot
      Alert.alert("🎉 You're marked as attending!");
    } catch {
      Alert.alert("Error", "Failed to confirm registration.");
    }
  };  

  const openImageViewer = (images: string) => {
    setSelectedImage(images);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  const handleInterestToggle = async () => {
    if (!user) {
      Alert.alert(
          'Sign In Required',
          'You need to sign in to save favourites.',
          [
              { text: 'Cancel', style: 'cancel'},
              {
                  text: 'Sign In',
                  onPress: () => setIsAuthModalVisible(true)
              }
          ]
      );
      return;
    }

    const updatedInterest = await toggleEventInterest(event!.id);
    setInterested(updatedInterest);
  }

  const handleExternalRegister = async () => {
    if (!user) {
      Alert.alert(
          'Sign In Required',
          'You need to sign in to register for events.',
          [
              { text: 'Cancel', style: 'cancel'},
              {
                  text: 'Sign In',
                  onPress: () => setIsAuthModalVisible(true)
              }
          ]
      );
      return;
    }

    if (event?.registrationLink) {
      try {
        await markExternalInterest(event.id);
        setClickedRegister(true); 
        Linking.openURL(event.registrationLink);
      } catch (error) {
        Alert.alert("Error", "Failed to register interest.");
      }
    }
  };

  const handleInvite = async (selectedUsers: UserData[]) => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to save favourites.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => setIsAuthModalVisible(true) }
        ]
      );
      return;
    }
  
    try {
      await inviteUsersToEvent({
        inviterId: currentUser!.id,
        inviterName: currentUser!.name,
        inviterAvatarUrl: currentUser!.avatarUrl,
        targetUserIds: selectedUsers.map(u => u.id),
        eventId: event!.id,
        eventTitle: event!.name,
      });
  
      Toast.show({ type: "success", text1: "Invites sent!" });
      setIsInviteModalOpen(false);
    } catch (error) {
      console.error("Failed to invite friends:", error);
      Toast.show({ type: "error", text1: "Failed to send invites" });
    }
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

  const attendees = event?.attendees ? Object.values(event.attendees) : [];

  if (!id || Array.isArray(id)) {
    return null; // Or a fallback screen, or use router.replace("/(events)")
  }

  return (
    <View style={styles.container}>
        <Animated.View style={[styles.header, { backgroundColor: headerBackground, paddingTop: statusBarHeight }]}>
            <CircleButton onPress={() => router.back()} />
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
            <MotiView {...fadeInUp} style={{ zIndex: 1 }}>
              <View style={styles.goingContainer}>
                <View style={styles.goingTextContainer}>
                  {attendees.slice(0, 3).map((person: any, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: person.avatarUrl || "https://via.placeholder.com/100" }}
                      style={[styles.avatar, { marginLeft: index === 0 ? 0 : -10 }]}
                    />
                  ))}
                  <Text style={styles.goingText}>+{attendees.length} Going</Text>
                </View>
                <TouchableOpacity style={styles.inviteButton} onPress={() => setIsInviteModalOpen(true)}>
                  <Text style={styles.inviteText}>Invite</Text>
                </TouchableOpacity>
              </View>
            </MotiView>

            {/* Event Details */}
            <MotiView {...fadeInUp}>
              <View style={styles.detailsContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.eventTitle}>{event?.name}</Text>
                  <TouchableOpacity
                    onPress={handleInterestToggle}
                    style={{ padding: 10, marginLeft: 70 }}
                  >
                    <FontAwesome6
                      name={interested ? "heart-circle-check" : "heart"}
                      size={26}
                      color={interested ? theme.colors.text.primary : theme.colors.text.primary }
                    />
                  </TouchableOpacity>
                </View>
                  
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
                  <OrganizerSection event={event!} />
              </View>
            </MotiView>

            {/* About Event */}
            <MotiView {...fadeInUp}>
              <View style={styles.aboutContainer}>
                  <Text style={styles.sectionTitle}>About Event</Text>
                  <Text style={styles.aboutText}>
                  {event?.description}
                  </Text>
              </View>
            </MotiView>
            
            {/* Target Audience */}
            {event?.targetAudience ? event.targetAudience !== "All" && (
              <MotiView {...fadeInUp}>
                <View style={styles.aboutContainer}>
                  <Text style={styles.sectionTitle}>Target Audience</Text>
                  <Text style={styles.aboutText}>
                    This event is specifically designed for {event.targetAudience.toLowerCase()}.
                  </Text>
                </View>
              </MotiView>
            ) : null }

            <MotiView {...fadeInUp}>
              <View style={styles.actionRow}>
                {/* Register Button */}
                {isRegistrationEvent && (<TouchableOpacity
                  style={styles.buyButton}
                  onPress={handleExternalRegister}
                >
                  <Text style={styles.buyButtonText}>
                      Register
                  </Text>
                </TouchableOpacity>)}

                {/* Confirm Attendance Button */}
                {clickedRegister && !localConfirmed && (
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmAttendance}
                  >
                    <Text style={styles.confirmText}>I’ve Registered</Text>
                  </TouchableOpacity>
                )}

                {clickedRegister && localConfirmed && (
                  <View style={[styles.confirmButton, { opacity: 0.6 }]}>
                    <Text style={styles.confirmText}>You're Going</Text>
                  </View>
                )}

                {isExternalOpen && (
                  <MotiView {...fadeInUp}>
                    <View style={styles.actionRow}>
                      {/* "I'm Going" button */}
                      {!localConfirmed && interested && (
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={handleConfirmAttendance}
                        >
                          <Text style={styles.confirmText}>I'm Going</Text>
                        </TouchableOpacity>
                      )}

                      {localConfirmed && (
                        <View style={[styles.confirmButton, { opacity: 0.6 }]}>
                          <Text style={styles.confirmText}>You're Going</Text>
                        </View>
                      )}
                    </View>
                  </MotiView>
                )}
              </View>
            </MotiView>
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

      {/* Sign In Modal */}
      <SignInModal isVisible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} />

      <InviteFriendsModal visible={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onInvite={handleInvite} />
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
      ...theme.shadows.default, zIndex: 1, elevation: 10
    },
    goingTextContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
    avatar: { width: 30, height: 30, borderRadius: 15, marginLeft: -10, borderWidth: 2, borderColor: "white" },
    goingText: { marginLeft: 10, fontSize: 14, color: theme.colors.text.primary, fontFamily: 'Outfit_700Bold' },
    inviteButton: { backgroundColor: theme.colors.secondary, borderRadius: 10, padding: 8, zIndex: 9999 },
    inviteText: { color: theme.colors.text.primary, fontSize: 14, fontFamily: "Outfit_400Regular" },
    detailsContainer: { marginTop: HERO_IMAGE_HEIGHT + 30, padding: 20, marginBottom: 10, gap: 16 },
    detailsIconContainer: { height: 48, width: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.muted, borderRadius: 10 },
    eventTitle: { fontSize: 35, lineHeight: 46, fontFamily: 'Outfit_400Regular', color: theme.colors.text.primary },
    detailRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 10 },
    detailText: { marginLeft: 10, fontSize: 16, color: theme.colors.text.secondary },
    detailTextTop: { marginLeft: 10, fontSize: 16, color: theme.colors.text.primary, fontFamily: 'Outfit_400Regular' },
    detailTextBottom: { marginLeft: 10, fontSize: 12, color: theme.colors.text.muted, fontFamily: 'Outfit_400Regular'  },
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
    aboutContainer: { padding: 20 },
    sectionTitle: { fontSize: 18, fontFamily: 'Outfit_500Medium', color: theme.colors.text.primary, marginBottom: 10 },
    aboutText: { fontSize: 16, lineHeight: 28, color: theme.colors.text.secondary, fontFamily: 'Outfit_400Regular' },
    buyButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 4,
    },
    buyButtonText: { color: theme.colors.text.primary, fontSize: 16, textAlign: 'center', fontFamily: 'Outfit_400Regular' },
    modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", },
    fullScreenImage: { width: "90%", height: "70%", resizeMode: "contain", },
    closeButton: { position: "absolute", top: 40, right: 20, zIndex: 10, },
    downloadButton: { position: "absolute", bottom: 40, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.6)", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10,},
    downloadText: { color: "white", fontSize: 16, marginLeft: 10, fontFamily: "Outfit_400Regular" },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 4,
    },
    confirmText: {
      color: theme.colors.text.primary,
      fontSize: 15,
      fontFamily: 'Outfit_500Medium',
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      marginVertical: 20,
    },
  });

export default EventDetails;