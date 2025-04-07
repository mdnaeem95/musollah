  import React, { useEffect } from "react";
  import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Dimensions } from "react-native";
  import { FontAwesome6 } from "@expo/vector-icons";
  import { useTheme } from "../../../../context/ThemeContext";
  import { useDispatch, useSelector } from "react-redux";
  import { fetchUser } from "../../../../redux/slices/userSlice";
  import { AppDispatch, RootState } from "../../../../redux/store/store";
  import { MotiView } from "moti";
  import { MotiPressable } from "moti/interactions";
  import { fadeInUp, scaleTap } from "../../../../utils/animations";
  import { useRouter } from "expo-router";
  import UserStats from "../../../../components/community/UserStats";
  import { useAuth } from '../../../../context/AuthContext';

  const ProfileScreen = () => {
    const router = useRouter();
    const screenHeight = Dimensions.get("window").height;
    const { theme } = useTheme();
    const { user: currentUser } = useAuth();
    const styles = createStyles(theme, screenHeight);
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.user);

    useEffect(() => {
      if (currentUser) {
        dispatch(fetchUser());
      }
    }, [dispatch, currentUser]);    

    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.text.primary} style={styles.loading} />;
    }

    if (!currentUser) {
      return (
        <View style={styles.loading}>
          <Text style={{
            color: theme.colors.text.secondary,
            fontFamily: 'Outfit_400Regular',
            fontSize: 16,
            textAlign: 'center',
            paddingHorizontal: 20
          }}>
            You’re not signed in. Please log in to view your profile.
          </Text>
        </View>
      );
    }    

    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <MotiView {...fadeInUp}>
          <View style={styles.profileImageContainer}>
              <Image source={{ uri: user?.avatarUrl }} style={styles.profileImage} />
          </View>
        </MotiView>

        {/* Name */}
        <MotiView {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 100 }}>
          <Text style={styles.profileName}>{user?.name || "New User"}</Text>
        </MotiView>

        {/* Stats */}
        <MotiView {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 200 }}>
          <UserStats styles={styles} />
        </MotiView>

        {/* Edit Profile */}
        <MotiView {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 300 }}>
          <MotiPressable {...scaleTap} onPress={() => router.push('(profile)/edit')}>
            <View style={styles.editProfileButton}>
              <FontAwesome6 name="pen" size={14} color={theme.colors.primary} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </View>
          </MotiPressable>
        </MotiView>

        {/* About Me */}
        <MotiView {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 400 }}>
          <View style={styles.aboutMeContainer}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.aboutMeText}>
              {user?.aboutMe || "Tell us something about yourself!"}
              <Text style={styles.readMore}> Read More</Text>
            </Text>
          </View>
        </MotiView>

        {/* Interests */}
        {user?.interests && user.interests.length > 0 && (
          <MotiView {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 500 }}>
            <View style={styles.aboutMeContainer}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsContainer}>
                {user.interests.map((interest: string, index: number) => (
                  <View key={index} style={[styles.interestTag, { backgroundColor: theme.colors.secondary }]}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          </MotiView>
        )}
      </ScrollView>
    );
  };  

  const createStyles = (theme: any, screenHeight: number) =>
    StyleSheet.create({
      container: {
        flexGrow: 1,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingBottom: 30,
      },
      loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
      profileImageContainer: {
        marginTop: 20,
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
        color: theme.colors.text.primary,
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
        color: theme.colors.text.primary,
      },
      statsLabel: {
        fontSize: 14,
        color: theme.colors.text.muted,
      },
      separator: {
        width: 30,
        height: 1,
        backgroundColor: theme.colors.border,
      },
      editProfileButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: theme.colors.text.primary,
        paddingVertical: 10,
        borderRadius: 10,
        marginHorizontal: 40,
        marginBottom: 20,
        marginTop: 10
      },
      editProfileText: {
        fontSize: 16,
        color: theme.colors.text.primary,
        marginLeft: 8,
        fontFamily: "Outfit_500Medium",
      },
      aboutMeContainer: {
        marginBottom: 20,
      },
      sectionTitle: {
        fontSize: 18,
        fontFamily: "Outfit_500Medium",
        color: theme.colors.text.primary,
        marginBottom: 8,
      },
      aboutMeText: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        lineHeight: 24,
        fontFamily: "Outfit_400Regular",
      },
      readMore: {
        color: theme.colors.primary,
        fontFamily: "Outfit_500Medium",
      },
      interestTag: {
        paddingVertical: 7,
        paddingHorizontal: 15,
        borderRadius: 16,
      },
      modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: theme.colors.primary,
      },
      modalContent: {
        height: screenHeight * 0.9,
        backgroundColor: theme.colors.secondary,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
      },    
      dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: theme.colors.muted,
        alignSelf: "center",
        marginBottom: 15,
      },
      modalTitle: {
        fontSize: 20,
        fontFamily: "Outfit_600SemiBold",
        color: theme.colors.text.primary,
        marginBottom: 20,
      },
      modalLabel: {
        fontSize: 14,
        fontFamily: "Outfit_500Medium",
        color: theme.colors.text.secondary,
        marginBottom: 6,
      },
      modalInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        fontSize: 16,
        fontFamily: "Outfit_400Regular",
        backgroundColor: theme.colors.secondary,
        color: theme.colors.text.primary,
      },    
      modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 30,
      },
      cancelButton: {
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: "transparent",
      },   
      cancelText: {
        color: theme.colors.text.secondary,
        fontSize: 16,
        fontFamily: "Outfit_500Medium",
      },    
      saveButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
      },    
      saveText: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontFamily: "Outfit_500Medium",
      },
      interestsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 10,
        marginBottom: 20,
      },
      interestPill: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 16,
      },
      interestText: {
        color: theme.colors.text.primary,
        fontSize: 14,
        fontFamily: "Outfit_400Regular",
      },
      
    });

  export default ProfileScreen;
