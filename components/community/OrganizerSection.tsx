import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { UserData, Event } from "../../utils/types";
import SignInModal from "../SignInModal";

interface Props {
  event: Event;
}

const OrganizerSection: React.FC<Props> = ({ event }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [organizerData, setOrganizerData] = useState<UserData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const showAuthAlert = () => {
    Alert.alert(
      "Sign in Required",
      "You need to be signed in to follow others.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => setAuthModalVisible(true) } // Redirect to login
      ]
    );
  };

  useEffect(() => {
    const fetchOrganizer = async () => {
      if (!event.organizerId) return;

      try {
        const doc = await firestore().collection("users").doc(event.organizerId).get();
        if (doc.exists) {
          const data = doc.data() as UserData;
          setOrganizerData({ ...data, id: doc.id });
          if (user) {
            setIsFollowing(!!data.followers?.[user.uid]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch organizer", err);
      }
    };

    fetchOrganizer();
  }, [event.organizerId, user?.uid]);

  const handleFollowToggle = async () => {
    if (!organizerData) return;

    if (!user) {
      showAuthAlert();
      return
    }

    const currentUserRef = firestore().collection("users").doc(user.uid);
    const organizerRef = firestore().collection("users").doc(organizerData.id);

    try {
      if (isFollowing) {
        await Promise.all([
          currentUserRef.update({
            [`following.${organizerData.id}`]: firestore.FieldValue.delete(),
          }),
          organizerRef.update({
            [`followers.${user.uid}`]: firestore.FieldValue.delete(),
          }),
        ]);
      } else {
        await Promise.all([
          currentUserRef.set(
            { following: { [organizerData.id]: true } },
            { merge: true }
          ),
          organizerRef.set(
            { followers: { [user.uid]: true } },
            { merge: true }
          ),
        ]);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    }
  };

  const displayName = organizerData?.name || event.organizer;
  const avatarUrl =
    organizerData?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

  return (
    <View style={styles(theme).container}>
      <Image source={{ uri: avatarUrl }} style={styles(theme).avatar} />
      <View style={styles(theme).info}>
        <Text style={styles(theme).name}>{displayName}</Text>
        <Text style={styles(theme).label}>Organizer</Text>
      </View>

      {organizerData && user?.uid !== organizerData.id && (
        <TouchableOpacity
          onPress={handleFollowToggle}
          style={styles(theme).followButton}
        >
          <Text style={styles(theme).followText}>
            {isFollowing ? "Unfollow" : "Follow"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Sign In Modal */}
      <SignInModal isVisible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </View>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 16,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontFamily: "Outfit_600SemiBold",
      color: theme.colors.text.primary,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text.muted,
      fontFamily: "Outfit_400Regular",
    },
    followButton: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.muted,
      borderRadius: 20,
    },
    followText: {
      fontSize: 14,
      fontFamily: "Outfit_600SemiBold",
      color: theme.colors.text.primary,
    },
  });

export default OrganizerSection;