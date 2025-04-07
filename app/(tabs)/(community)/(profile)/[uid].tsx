import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../../context/ThemeContext";
import { UserData } from "../../../../utils/types";
import { useAuth } from "../../../../context/AuthContext";
import { followUser, unfollowUser } from "../../../../api/firebase/community";

const PublicProfileScreen = () => {
  const { uid } = useLocalSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!uid || typeof uid !== "string") return;

    const fetchUser = async () => {
      try {
        const doc = await firestore().collection("users").doc(uid).get();
        const data = doc.data();
        if (data) {
          setUserData({ id: doc.id, ...data } as UserData);

          // Check if current user is following
          if (user?.uid && data?.followers && data.followers[user.uid]) {
            setIsFollowing(true);
          }
        }
      } catch (err) {
        console.error("Failed to load user", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [uid, user?.uid]);

  const handleFollowToggle = async () => {
    if (!uid || typeof uid !== "string" || !user?.uid) return;

    setIsUpdating(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.uid, uid);
        setIsFollowing(false);
      } else {
        await followUser(user.uid, uid);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.primary }}>
        <ActivityIndicator color={theme.colors.secondary} />
      </View>
    );
  }

  if (!userData) {
    return <Text style={{ textAlign: "center", marginTop: 50 }}>User not found.</Text>;
  }

  return (
    <ScrollView style={{ backgroundColor: theme.colors.primary }}>
      <View style={styles(theme).container}>
        <Image
          source={{ uri: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}` }}
          style={styles(theme).avatar}
        />
        <Text style={styles(theme).name}>{userData.name}</Text>
        <Text style={styles(theme).about}>{userData.aboutMe || "No bio available."}</Text>

        {user?.uid !== uid && (
          <TouchableOpacity
            style={styles(theme).followButton}
            onPress={handleFollowToggle}
            disabled={isUpdating}
          >
            <Text style={styles(theme).followText}>
              {isUpdating ? "..." : isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 20,
      alignItems: "center",
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 20,
    },
    name: {
      fontSize: 22,
      fontFamily: "Outfit_700Bold",
      color: theme.colors.text.primary,
    },
    about: {
      fontSize: 16,
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.secondary,
      marginTop: 10,
      textAlign: "center",
    },
    followButton: {
      backgroundColor: theme.colors.muted,
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 14,
      marginTop: 20,
    },
    followText: {
      color: theme.colors.text.primary,
      fontFamily: "Outfit_500Medium",
      fontSize: 16,
      textAlign: "center",
    },    
  });

export default PublicProfileScreen;