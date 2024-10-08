import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteUser, getAuth, signOut, updateProfile } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { FontAwesome6 } from '@expo/vector-icons'; // For consistent icons
import { useRouter } from 'expo-router';
import { persistor } from '../../../../redux/store/store'
import Modal from 'react-native-modal'
import PrayerHeader from '../../../../components/PrayerHeader';
import SignInModal from '../../../../components/SignInModal';

const AccountSettings = () => {
    const auth = getAuth();
    const firestore = getFirestore();
    const router = useRouter();

    // State for Firebase Auth data
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
    const [name, setName] = useState<string>('');
    const [coursesCompleted, setCoursesCompleted] = useState<number>(0);

    // Modal state
    const [isModalVisible, setModalVisible] = useState<boolean>(false);
    const [isSignUpModalVisible, setIsSignUpModalVisible] = useState<boolean>(false);
    const [newName, setNewName] = useState<string>(''); // Track new value for name

    // Fetch both Firebase Auth data and Firestore user data
    useEffect(() => {
        const fetchUserDataFromFirestore = async () => {
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
                    console.error('Error fetching user data from Firestore:', error);
                }
            }
        };

        fetchUserDataFromFirestore();
    }, [currentUser, firestore]);

    // Handle updating both Firebase Authentication and Firestore users collection
    const handleSaveName = async () => {
        try {
            if (currentUser) {
                const userDocRef = doc(firestore, 'users', currentUser.uid);

                // Update Firebase Auth display name
                await updateProfile(currentUser, { displayName: newName });
                await updateDoc(userDocRef, { name: newName });
                setName(newName);

                setModalVisible(false);
                Alert.alert('Success', 'Name updated successfully!', [{ text: 'OK' }]);
            }
        } catch (error) {
            console.error('Error updating name:', error);
            Alert.alert('Error', 'Failed to update name. Please try again.');
        }
    };

    // Show the modal and prepare the correct field for editing
    const openEditModal = () => {
        setNewName(name); // Set current value in modal
        setModalVisible(true);
    };

    const openSignInModal = () => {
      setIsSignUpModalVisible(true)
    }

    const closeSignInModal = () => {
      setIsSignUpModalVisible(false)
    }

    // Handle user sign-out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            await persistor.purge();
            setCurrentUser(null);
            router.push('/(tabs)/(prayer)');
            Alert.alert('You have been successfully signed out.');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    // Handle delete account
    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be deleted. Do you want to proceed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Proceed', style: 'destructive', onPress: async () => {
                        try {
                            if (currentUser) {
                                const userDocRef = doc(firestore, 'users', currentUser.uid);
                                await deleteDoc(userDocRef);
                                await deleteUser(currentUser);
                                await persistor.purge();
                                router.push('/(auth)/AuthScreen');
                                Alert.alert('Account deleted.', 'Your account and data has been permanently deleted.');
                            }
                        } catch (error) {
                            console.error('Error deleting account: ', error);
                            Alert.alert('Error', 'Failed to delete your account. Please try again.');
                        }
                    }
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1, paddingVertical: 16 }}>
              <PrayerHeader title='Account Information' backgroundColor='#4D6561' />

              <View style={styles.form}>
                <View style={styles.settingsField}>
                    <View style={styles.settingsLeftField}>
                        <FontAwesome6 name="user" color="white" size={20} />
                        <Text style={styles.settingsLabel}>Name</Text>
                    </View>
                    <View style={styles.settingsRightField}>
                        <Text style={styles.valueText}>{name}</Text>
                        <TouchableOpacity onPress={openEditModal}>
                            <FontAwesome6 name="edit" color="white" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.settingsField}>
                    <View style={styles.settingsLeftField}>
                        <FontAwesome6 name="graduation-cap" color="white" size={20} />
                        <Text style={styles.settingsLabel}>Courses Completed</Text>
                    </View>
                    <Text style={styles.valueText}>{coursesCompleted}</Text>
                </View>

                {currentUser && (
                  <TouchableOpacity 
                  style={styles.googleMapsButton} 
                  onPress={handleSignOut} 
                  disabled={!currentUser}
                  >
                    <Text style={styles.googleMapsButtonText}>Sign Out</Text>
                  </TouchableOpacity>
                )}

                {currentUser && (
                  <TouchableOpacity 
                  style={[styles.googleMapsButton, { backgroundColor: '#FF6961' }]}
                  disabled={!currentUser} 
                  onPress={handleDeleteAccount}
                  >
                    <Text style={styles.googleMapsButtonText}>Delete Account</Text>
                  </TouchableOpacity>
                )}

                {!currentUser && (
                  <TouchableOpacity 
                  style={styles.googleMapsButton} 
                  onPress={openSignInModal} 
                  >
                    <Text style={styles.googleMapsButtonText}>Sign Up</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                        <FontAwesome6 name="xmark" color="white" size={18} solid />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Edit Name</Text>
                    <TextInput
                        style={styles.input}
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="Enter new name"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity onPress={handleSaveName} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <SignInModal
              isVisible={isSignUpModalVisible}
              onClose={closeSignInModal}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4D6561',
    paddingHorizontal: 16,
  },
  form: {
    marginTop: 20,
    backgroundColor: '#314441',
    borderRadius: 15,
    padding: 16,
    gap: 15,
  },
  settingsField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  settingsLeftField: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  settingsRightField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  valueText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
  },
  closeButton: {
    height: 38, 
    width: 38, 
    borderRadius: 19, 
    backgroundColor: '#A3C0BB', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 10, 
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
    fontFamily: 'Outfit_600SemiBold'
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  saveButton: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10
  },
  saveButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFFFFF'
  },
  googleMapsButton: {
    alignItems: 'center',
    marginTop: 5,
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  googleMapsButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default AccountSettings;
