import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import firestore from "@react-native-firebase/firestore";
import { UserData } from "../../../../utils/types";
import { MotiView } from "moti";
import { useFocusEffect, useRouter } from "expo-router";
import { followUser, unfollowUser } from "../../../../api/firebase/community";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store/store";
import SignInModal from "../../../../components/SignInModal";
import { FontAwesome6 } from "@expo/vector-icons";

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
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [lastVisibleUser, setLastVisibleUser] = useState<any>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

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

  const fetchUsers = async (loadMore = false) => {
    try {
      setLoading(!loadMore);
      setIsFetchingMore(loadMore);
  
      let query = firestore().collection("users").orderBy("name").limit(20);
  
      if (loadMore && lastVisibleUser) {
        query = query.startAfter(lastVisibleUser);
      }
  
      const snapshot = await query.get();
  
      if (!snapshot.empty) {
        const newUsers = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Anonymous",
            avatarUrl: data.avatarUrl || null,
            ...data,
          } as UserData;
        });
  
        setUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u.id));
          const merged = [...prev, ...newUsers.filter((u) => !existingIds.has(u.id))];
          return merged;
        });
        
        setLastVisibleUser(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };  

  useEffect(() => {
    fetchUsers();
  }, [firebaseUser?.uid, searchQuery]);   

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
      showAuthAlert();
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

  const renderUser = ({ item, index }: { item: UserData; index: number }) => {
    const hasAvatar =
    item.avatarUrl &&
    item.avatarUrl.trim() !== "" &&
    !item.avatarUrl.includes("via.placeholder.com");
  
    console.log(hasAvatar, item.avatarUrl)
    
    return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay: index * 50 }}
    >
      <View style={styles.userCard}>
        <TouchableOpacity style={styles.userInfoContainer} onPress={() => router.push(`/(profile)/${item.id}`)}>
          {hasAvatar ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, {
              backgroundColor: theme.colors.secondary,
              justifyContent: 'center',
              alignItems: 'center'
            }]}>
              <FontAwesome6 name="user" size={24} color={theme.colors.text.primary} />
            </View>
          )}
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
    )
  };

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
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (!isFetchingMore && searchQuery.length === 0) {
              fetchUsers(true);
            }
          }}          
        />
      )}

      {/* Sign In Modal */}
      <SignInModal isVisible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
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