import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import firestore from "@react-native-firebase/firestore";
import { UserData } from "../../../../utils/types";
import { MotiView } from "moti";
import { useFocusEffect, useRouter } from "expo-router";
import { followUser, unfollowUser } from "../../../../api/firebase/community";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store/store";

const UsersScreen = () => {
  const { theme } = useTheme();
  const authContext = useAuth();
  const firebaseUser = authContext.user;
  const currentUser = useSelector((state: RootState) => state.user.user);
  const styles = createStyles(theme);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const fetchUsers = async () => {
      try {
        const snapshot = await firestore().collection("users").limit(20).get();

        const usersData = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "Anonymous",
              email: data.email || "",
              avatarUrl: data.avatarUrl || null,
              enrolledCourses: data.enrolledCourses || [],
              likedQuestions: data.likedQuestions || [],
              role: data.role || "user",
              aboutMe: data.aboutMe || "",
              interests: data.interests || [],
            } as UserData;
          })
          .filter((u) => u.id !== firebaseUser.uid);

        setUsers(usersData);

        const currentUserDoc = await firestore().collection("users").doc(firebaseUser.uid).get();
        const currentUserData = currentUserDoc.data();
        const currentFollowing = currentUserData?.following || {};
        setFollowing(currentFollowing);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [firebaseUser?.uid]);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useFocusEffect(
    useCallback(() => {
      const fetchFollowing = async () => {
        if (!currentUser) return;

        const doc = await firestore().collection("users").doc(currentUser.id).get();
        const data = doc.data();
        if (!data) return;

        const followingData = data.following || {};
        const formatted: { [key: string]: boolean } = {};
        Object.keys(followingData).forEach((uid) => {
          formatted[uid] = true;
        });
        setFollowing(formatted);
      };

      fetchFollowing();
    }, [currentUser?.id])
  );

  const handleFollowToggle = async (targetUserId: string, targetUserName: string) => {
    if (!firebaseUser?.uid || !currentUser) {
      console.error("Missing current user info for follow");
      return;
    }

    try {
      if (following[targetUserId]) {
        await unfollowUser(firebaseUser.uid, targetUserId);
      } else {
        await followUser(
          firebaseUser.uid,
          targetUserId,
          currentUser.name,
          currentUser.avatarUrl || ""
        );
      }

      setFollowing((prev) => ({ ...prev, [targetUserId]: !prev[targetUserId] }));
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const renderUser = ({ item, index }: { item: UserData; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay: index * 50 }}
    >
      <View style={styles.userCard}>
        <TouchableOpacity style={styles.userInfoContainer} onPress={() => router.push(`/(profile)/${item.id}`)}>
          <Image
            source={{ uri: item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}` }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{item.name}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.followButton}
          onPress={() => handleFollowToggle(item.id, item.name)}
        >
          <Text style={styles.followText}>
            {following[item.id] ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search users..."
        placeholderTextColor={theme.colors.text.muted}
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <Text style={styles.sectionTitle}>Suggested Users</Text>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: 20,
    },
    searchInput: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontFamily: "Outfit_400Regular",
      fontSize: 16,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    sectionTitle: {
      fontFamily: "Outfit_600SemiBold",
      fontSize: 18,
      color: theme.colors.text.primary,
      marginBottom: 10,
    },
    listContainer: {
      gap: 10,
    },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: 'space-between',
      paddingVertical: 10,
    },
    userInfoContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      flexShrink: 1,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    name: {
      fontFamily: "Outfit_500Medium",
      fontSize: 16,
      color: theme.colors.text.primary,
      flexShrink: 1,
    },
    followButton: {
      backgroundColor: theme.colors.secondary,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    followText: {
      color: theme.colors.text.primary,
      fontFamily: "Outfit_500Medium",
      fontSize: 14,
    },
  });

export default UsersScreen;