import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "../../../../redux/slices/userSlice";
import { AppDispatch, RootState } from "../../../../redux/store/store";

const ProfileScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const dispatch = useDispatch<AppDispatch>();

  // Get user data from Redux store
  const { user, loading } = useSelector((state: RootState) => state.user);

  // Fetch user data when the profile screen mounts
  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.text.primary} style={styles.loading} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <Image source={{ uri: user?.avatarUrl }} style={styles.profileImage} />
      </View>
      <Text style={styles.profileName}>{user?.name || "New User"}</Text>

      {/* Following & Followers (Placeholder Data) */}
      <View style={styles.statsContainer}>
        <View style={styles.statsBox}>
          <Text style={styles.statsNumber}>350</Text>
          <Text style={styles.statsLabel}>Following</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.statsBox}>
          <Text style={styles.statsNumber}>346</Text>
          <Text style={styles.statsLabel}>Followers</Text>
        </View>
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity style={styles.editProfileButton}>
        <FontAwesome6 name="pen" size={14} color={theme.colors.primary} />
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* About Me Section */}
      <View style={styles.aboutMeContainer}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <Text style={styles.aboutMeText}>
          {user?.aboutMe || "Tell us something about yourself!"}
          <Text style={styles.readMore}> Read More</Text>
        </Text>
      </View>

      {/* Interests */}
      {user?.interests && user.interests.length > 0 && (
        <View style={styles.aboutMeContainer}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
            {user.interests.map((interest: string, index: number) => (
              <View key={index} style={[styles.interestTag, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    profileImageContainer: {
      alignItems: "center",
      marginBottom: 15,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    profileName: {
      fontSize: 22,
      fontFamily: "Outfit_600SemiBold",
      textAlign: "center",
      color: "#120D26",
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 15,
    },
    statsBox: {
      alignItems: "center",
      paddingHorizontal: 20,
    },
    statsNumber: {
      fontSize: 16,
      fontWeight: "600",
      color: "#120D26",
    },
    statsLabel: {
      fontSize: 14,
      color: "#747688",
    },
    separator: {
      width: 30,
      height: 1,
      backgroundColor: "#DDDDDD",
    },
    editProfileButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "#5669FF",
      paddingVertical: 10,
      borderRadius: 10,
      marginHorizontal: 40,
      marginBottom: 20,
    },
    editProfileText: {
      fontSize: 16,
      color: "#5669FF",
      marginLeft: 8,
    },
    aboutMeContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "500",
      color: "#172B4D",
      marginBottom: 8,
    },
    aboutMeText: {
      fontSize: 16,
      color: "#3C3E56",
      lineHeight: 24,
    },
    readMore: {
      color: "#5669FF",
      fontWeight: "500",
    },
    interestsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    interestTag: {
      paddingVertical: 7,
      paddingHorizontal: 15,
      borderRadius: 16,
    },
    interestText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "500",
    },
  });

export default ProfileScreen;
