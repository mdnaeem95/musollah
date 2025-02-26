import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TextInput, Pressable, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { deleteUser, getAuth, signOut, updateProfile } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { persistor } from '../../../../redux/store/store';
import { useRouter, useSegments } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import Modal from 'react-native-modal';
import ThemedButton from '../../../../components/ThemedButton'; 
import SignInModal from '../../../../components/SignInModal';

const AccountSettings = () => {
  const auth = getAuth();
  const firestore = getFirestore();
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [name, setName] = useState<string>('');
  const [coursesCompleted, setCoursesCompleted] = useState<number>(0);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [isSignUpModalVisible, setIsSignUpModalVisible] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists) {
            const userData = userDoc.data();
            setName(userData?.name || '');
            setCoursesCompleted(userData?.coursesCompleted || 0);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [currentUser, firestore]);

  const handleSaveName = async () => {
    try {
      if (currentUser) {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        await updateProfile(currentUser, { displayName: newName });
        await updateDoc(userDocRef, { name: newName });
        setName(newName);
        setModalVisible(false);
        Alert.alert('Success!', 'Name changed successfully!');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await persistor.purge();
      setCurrentUser(null);
      router.replace(segments.join('/'));
      Alert.alert('You have been successfully signed out.');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          style: 'destructive',
          onPress: async () => {
            try {
              if (currentUser) {
                const userDocRef = doc(firestore, 'users', currentUser.uid);
                await deleteDoc(userDocRef);
                await deleteUser(currentUser);
                await persistor.purge();
                router.push('/(auth)/AuthScreen');
                Alert.alert('Account deleted successfully.');
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete your account. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* Name Field */}
        <SettingsField 
          icon="user"
          label="Name"
          value={name}
          onPress={() => setModalVisible(true)}
          editable
        />

        {/* Courses Completed Field */}
        <SettingsField 
          icon="graduation-cap"
          label="Courses Completed"
          value={coursesCompleted.toString()}
        />

        {/* Actions */}
        {currentUser ? (
          <>
            <ThemedButton text="Sign Out" 
              onPress={handleSignOut} 
              style={{ backgroundColor: theme.colors.text.error }}
              textStyle={{ color: '#FFFFFF' }} 
            />
            <ThemedButton 
              text="Delete Account" 
              onPress={handleDeleteAccount} 
              style={{ backgroundColor: theme.colors.text.error }}
              textStyle={{ color: '#FFFFFF' }} 
            />
          </>
        ) : (
          <ThemedButton text="Sign Up" onPress={() => setIsSignUpModalVisible(true)} />
        )}
      </View>

      {/* Edit Name Modal */}
      <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
            <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary}/>
          </Pressable>

          <Text style={styles.modalTitle}>Edit Name</Text>

          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter new name"
            placeholderTextColor={theme.colors.text.muted}
          />

          <View style={styles.buttonRow}>
            <ThemedButton text="Back" onPress={() => setModalVisible(false)} style={styles.backButton} textStyle={{ color: '#FFFFFF' }} />
            <ThemedButton text="Save" onPress={handleSaveName} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>

      {/* Sign In Modal */}
      <SignInModal isVisible={isSignUpModalVisible} onClose={() => setIsSignUpModalVisible(false)} />
    </View>
  );
};

const SettingsField = ({ icon, label, value, onPress, editable }: { icon: any; label: string; value: string; onPress?: () => void; editable?: boolean }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }).start();

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={editable ? onPress : undefined}>
      <Animated.View style={[styles.settingsField, { transform: [{ scale: scaleValue }] }]}>
        <View style={styles.settingsLeftField}>
          <FontAwesome6 name={icon} size={20} color={theme.colors.text.primary} />
          <Text style={styles.settingsLabel}>{label}</Text>
        </View>
        <View style={styles.settingsLeftField}>
          <Text style={styles.valueText}>{value}</Text>
          {editable && <FontAwesome6 name="edit" size={18} color={theme.colors.text.primary} />}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    form: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.medium,
      ...theme.shadows.default,
      gap: theme.spacing.medium
    },
    settingsField: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.text.muted,
    },
    settingsLeftField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small
    },
    settingsLabel: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
      fontFamily: 'Outfit_500Medium',
    },
    valueText: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
      fontFamily: 'Outfit_400Regular'
    },
    modalContent: {
      gap: theme.spacing.large,
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.large,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      width: '90%',
      alignSelf: 'center'
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      padding: theme.spacing.small
    },
    modalTitle: {
      fontSize: theme.fontSizes.xLarge,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
    },
    input: {
      width: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.small,
      padding: theme.spacing.small,
      borderColor: theme.colors.text.muted,
      color: theme.colors.text.secondary,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.medium,
      width: '100%',
      paddingHorizontal: theme.spacing.small
    },
    backButton: {
      backgroundColor: theme.colors.text.error,
      flex: 1
    }
});

export default AccountSettings;
