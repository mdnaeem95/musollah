import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Image, Modal } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store/store";
import { updateUserProfile } from "../../../../redux/slices/userSlice";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import storage from '@react-native-firebase/storage';
import { getAuth } from '@react-native-firebase/auth';
import { FontAwesome } from "@expo/vector-icons";

const screenHeight = Dimensions.get("window").height;

const INTEREST_OPTIONS = [
  "Qur'an", "Arabic", "Tafsir", "Volunteering", "Ramadan", "Mental Health", "Youth",
  "Sisters' Circle", "Brothers' Circle", "Islamic Finance", "Parenting", "Marriage",
  "Leadership", "Wellness"
];

const EditProfileScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.user.user);
  const [name, setName] = useState(user?.name || "");
  const [aboutMe, setAboutMe] = useState(user?.aboutMe || "");
  const [interests, setInterests] = useState<string[]>(user?.interests || []);

  const [editedAvatarUrl, setEditedAvatarUrl] = useState(user?.avatarUrl || "");
  const [photoOptionsVisible, setPhotoOptionsVisible] = useState(false);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    try {
      await dispatch(updateUserProfile({ name, aboutMe, interests, avatarUrl: editedAvatarUrl })).unwrap();
      Alert.alert("Success", "Profile updated!");
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save profile");
    }
  };

  const handleChooseFromLibrary = async () => {
    setPhotoOptionsVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uploadedUrl = await uploadAvatar(result.assets[0].uri);
      if (uploadedUrl) setEditedAvatarUrl(uploadedUrl);
    }
  };
  
  const handleTakePhoto = async () => {
    setPhotoOptionsVisible(false);
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uploadedUrl = await uploadAvatar(result.assets[0].uri);
      if (uploadedUrl) setEditedAvatarUrl(uploadedUrl);
    }
  };
  
  const handleRemovePhoto = () => {
    setPhotoOptionsVisible(false);
    setEditedAvatarUrl("https://via.placeholder.com/100");
  };
  
  const uploadAvatar = async (uri: string): Promise<string | null> => {
    try {
      const user = getAuth().currentUser;
      if (!user) return null;
  
      const response = await fetch(uri);
      const blob = await response.blob();
  
      const ref = storage().ref().child(`avatars/${user.uid}.jpg`);
      await ref.put(blob);
  
      return await ref.getDownloadURL();
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      return null;
    }
  };  

  return (
    <View style={{ backgroundColor: theme.colors.secondary }}>
        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.avatarContainer} onPress={() => setPhotoOptionsVisible(true)}>
            <Image source={{ uri: editedAvatarUrl }} style={styles.avatarImage} />
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
                style={styles.modalInput}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
            />

            <Text style={styles.modalLabel}>About Me</Text>
            <TextInput
                style={[styles.modalInput, { height: 100 }]}
                placeholder="Tell us about yourself"
                value={aboutMe}
                onChangeText={setAboutMe}
                multiline
            />

            <Text style={styles.modalLabel}>Your Interests</Text>
            <View style={styles.interestsContainer}>
                {INTEREST_OPTIONS.map((interest) => {
                const isActive = interests.includes(interest);
                return (
                    <TouchableOpacity
                    key={interest}
                    style={[
                        styles.interestPill,
                        { backgroundColor: isActive ? theme.colors.muted : theme.colors.secondary }
                    ]}
                    onPress={() => toggleInterest(interest)}
                    >
                    <Text style={[
                        styles.interestText,
                        { color: isActive ? theme.colors.text.primary : theme.colors.text.muted }
                    ]}>
                        {interest}
                    </Text>
                    </TouchableOpacity>
                );
                })}
            </View>

            {/* Save Button */}
            <View style={{ marginTop: 30, flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>

        <Modal
            transparent
            visible={photoOptionsVisible}
            animationType="fade"
            onRequestClose={() => setPhotoOptionsVisible(false)}
            >
            <TouchableOpacity
                style={styles.modalOverlay}
                onPress={() => setPhotoOptionsVisible(false)}
                activeOpacity={1}
            >
                <View style={styles.photoModal}>
                <Text style={styles.modalSheetTitle}>Change Profile Photo</Text>

                <TouchableOpacity style={styles.modalSheetOption} onPress={handleTakePhoto}>
                    <FontAwesome name="camera" size={20} color={theme.colors.text.primary} />
                    <Text style={styles.modalSheetOptionText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalSheetOption} onPress={handleChooseFromLibrary}>
                <FontAwesome name="image" size={20} color={theme.colors.text.primary} />
                    <Text style={styles.modalSheetOptionText}>Choose From Library</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalSheetOption} onPress={handleRemovePhoto}>
                    <FontAwesome name="trash" size={20} color={theme.colors.text.error} />
                    <Text style={[styles.modalSheetOptionText, { color: theme.colors.text.error }]}>Remove Current Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalSheetOption, { marginTop: 10 }]} onPress={() => setPhotoOptionsVisible(false)}>
                    <Text style={styles.modalSheetOptionText}>Cancel</Text>
                </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>

    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalContent: {
      minHeight: screenHeight * 0.9,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 40,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
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
      fontSize: 14,
      fontFamily: "Outfit_400Regular",
    },
    avatarContainer: {
        alignSelf: "center",
        marginBottom: 24,
      },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    photoModal: {
        backgroundColor: theme.colors.secondary,
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalSheetTitle: {
        fontSize: 16,
        fontFamily: "Outfit_500Medium",
        color: theme.colors.text.primary,
        marginBottom: 15,
    },
    modalSheetOption: {
        paddingVertical: 14,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center'
    },
    modalSheetOptionText: {
        fontSize: 16,
        fontFamily: "Outfit_400Regular",
        color: theme.colors.text.primary,
    },      
  });

export default EditProfileScreen;