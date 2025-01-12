import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { deleteUser, getAuth, signOut, updateProfile } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { persistor } from '../../../../redux/store/store';
import { useRouter, useSegments } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import Modal from 'react-native-modal';
import ThemedButton from '../../../../components/ThemedButton'; // Reusable button component
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
        Alert.alert('Success', 'Name updated successfully!');
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
        <View style={styles.settingsField}>
          <View style={styles.settingsLeftField}>
            <FontAwesome6 name="user" size={20} color={theme.colors.text.primary} />
            <Text style={styles.settingsLabel}>Name</Text>
          </View>
          <View style={styles.settingsRightField}>
            <Text style={styles.valueText}>{name}</Text>
            <FontAwesome6
              name="edit"
              size={20}
              color={theme.colors.text.primary}
              onPress={() => setModalVisible(true)}
            />
          </View>
        </View>

        {/* Courses Completed Field */}
        <View style={styles.settingsField}>
          <View style={styles.settingsLeftField}>
            <FontAwesome6
              name="graduation-cap"
              size={20}
              color={theme.colors.text.primary}
            />
            <Text style={styles.settingsLabel}>Courses Completed</Text>
          </View>
          <Text style={styles.valueText}>{coursesCompleted}</Text>
        </View>

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
          <FontAwesome6
            name="xmark"
            size={20}
            color={theme.colors.text.primary}
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          />
          <Text style={styles.modalTitle}>Edit Name</Text>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter new name"
            placeholderTextColor={theme.colors.text.muted}
          />
          <ThemedButton text="Save" onPress={handleSaveName} />
        </View>
      </Modal>

      {/* Sign In Modal */}
      <SignInModal isVisible={isSignUpModalVisible} onClose={() => setIsSignUpModalVisible(false)} />
    </View>
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
      marginTop: theme.spacing.medium,
      gap: theme.spacing.medium,
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.medium,
      ...theme.shadows.default,
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
      gap: theme.spacing.small,
    },
    settingsRightField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    settingsLabel: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
      fontFamily: 'Outfit_500Medium',
    },
    valueText: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
      fontFamily: 'Outfit_400Regular',
    },
    modalContent: {
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
    },
    closeButton: {
      alignSelf: 'flex-end',
    },
    modalTitle: {
      fontSize: theme.fontSizes.large,
      marginBottom: theme.spacing.medium,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
    },
    input: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.small,
      padding: theme.spacing.small,
      borderWidth: 1,
      borderColor: theme.colors.text.muted,
      color: theme.colors.text.secondary,
    },
});

export default AccountSettings;
