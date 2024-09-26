import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteUser, getAuth, signOut, updateEmail, updateProfile } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { FontAwesome6 } from '@expo/vector-icons'; // For consistent icons
import { useRouter } from 'expo-router';
import { persistor } from '../../../../redux/store/store'
import Modal from 'react-native-modal'
import BackArrow from '../../../../components/BackArrow';

const AccountSettings = () => {
    const auth = getAuth();
    const firestore = getFirestore();
    const currentUser = auth.currentUser;
    const router = useRouter();

    // State for Firebase Auth data
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');

    // State for Firestore custom data
    const [coursesCompleted, setCoursesCompleted] = useState<number>(0);

    // Modal state
    const [isModalVisible, setModalVisible] = useState<boolean>(false);
    const [fieldToEdit, setFieldToEdit] = useState<'name' | 'email'>('name'); // Track whether editing name or email
    const [newValue, setNewValue] = useState<string>(''); // Track new value for name or email

    // Fetch both Firebase Auth data and Firestore user data
    useEffect(() => {
    if (currentUser) {
        fetchUserDataFromFirestore();
    }
    }, [currentUser]);

    // Fetch additional data from Firestore
    const fetchUserDataFromFirestore = async () => {
    if (currentUser) {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists) {
        const userData = userDoc.data();
        setName(userData?.name || '');
        setEmail(userData?.email || '');
        setCoursesCompleted(userData?.coursesCompleted || 0);
        }
    }
    };

    // Handle updating both Firebase Authentication and Firestore users collection
    const handleSave = async () => {  
      try {
        if (currentUser) {
          const userDocRef = doc(firestore, 'users', currentUser.uid);

          // If editing the name
          if (fieldToEdit === 'name') {
            // Update Firebase Auth display name
            await updateProfile(currentUser, { displayName: newValue });
            setName(newValue);

            // Update Firestore users collection with new name
            await updateDoc(userDocRef, { name: newValue });
          } 
          
          // If editing the email
          else if (fieldToEdit === 'email') {
            // Update Firebase Auth email
            await updateEmail(currentUser, newValue);
            setEmail(newValue);

            // Update Firestore users collection with new email
            await updateDoc(userDocRef, { email: newValue });
          }

          // Hide modal after saving
          setModalVisible(false);

          // Show success alert after modal is closed
          setTimeout(() => {
            Alert.alert('Success', 'Edit successful!', [{ text: 'OK' }]);
          }, 300);
        }
      } catch (error) {
        console.error('Error updating profile:', error);

        // Hide modal and show error alert
        setModalVisible(false);
        setTimeout(() => {
          Alert.alert('Error', `Error changing ${fieldToEdit}, please try again.`, [{ text: 'OK' }]);
        }, 300);
      }
    };

    // Show the modal and prepare the correct field for editing
    const openEditModal = (field: 'name' | 'email') => {
      setFieldToEdit(field);
      setNewValue(field === 'name' ? name : email); // Set current value in modal
      setModalVisible(true);
    };

    // Handle user sign-out
    const handleSignOut = async () => {
      try {
        await signOut(auth); // firebase sign out

        // clear the persisted redux state
        await persistor.purge();

        // navigate back to the authentication screen
        router.push('/(auth)/AuthScreen');

        Alert.alert('You have been successfully signed out.');
      } catch (error) {
        console.error('Error signing out:', error);
        Alert.alert('There was an error signing out. Please try again.')
      }
    }

    // handle delete account
    const handleDeleteAccount = async () => {
      Alert.alert(
        'Delete Account',
        'This action cannot be undone. All your data will be deleted. Do you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', style: 'destructive', onPress: async () => {
            try {
              if (currentUser) {
                const userDocRef = doc(firestore, 'users', currentUser.uid);
                await deleteDoc(userDocRef);

                await deleteUser(currentUser);

                await persistor.purge();
                router.push('/(auth)/AuthScreen');

                Alert.alert('Account deleted.', 'Your account and data has been permanently deleted.')
              }
            } catch (error) {
              console.error('Error deleting account: ', error);
              Alert.alert('Error.', 'There was an error deleting your account.')
            }
          }},
        ]
      )
    }

    return (
      <SafeAreaView style={styles.container}>
        <BackArrow />
        
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Account Information</Text>
        </View>

        <View style={styles.form}>
          {/* User Name */}
          <View style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name="user" color="white" size={20} />
              <Text style={styles.settingsLabel}>Name</Text>
            </View>
            <View style={styles.settingsRightField}>
              <Text style={styles.valueText}>{name}</Text>
              <TouchableOpacity onPress={() => openEditModal('name')}>
                <FontAwesome6 name="edit" color="white" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Email */}
          <View style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name="envelope" color="white" size={20} />
              <Text style={styles.settingsLabel}>Email</Text>
            </View>
            <View style={styles.settingsRightField}>
              <Text style={styles.valueText}>{email}</Text>
              <TouchableOpacity onPress={() => openEditModal('email')}>
                <FontAwesome6 name="edit" color="white" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Courses Completed */}
          <View style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name="graduation-cap" color="white" size={20} />
              <Text style={styles.settingsLabel}>Courses Completed</Text>
            </View>
            <Text style={styles.valueText}>{coursesCompleted}</Text>
          </View>

          <TouchableOpacity style={styles.googleMapsButton} onPress={handleSignOut}>
            <Text style={styles.googleMapsButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.googleMapsButton, { backgroundColor: '#FF6961'}]} onPress={handleDeleteAccount}>
            <Text style={styles.googleMapsButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for editing name or email */}
        <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <FontAwesome6 name="xmark" color="white" size={18} solid />
          </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit {fieldToEdit === 'name' ? 'Name' : 'Email'}</Text>
            <TextInput
              style={styles.input}
              value={newValue}
              onChangeText={setNewValue}
              placeholder={`Enter new ${fieldToEdit}`}
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Modal>      
      </SafeAreaView>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4D6561',
    paddingHorizontal: 16,
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  headerText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 30,
    lineHeight: 45,
    color: '#FFFFFF',
  },
  form: {
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
