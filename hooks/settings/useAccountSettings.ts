import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteUser } from '@react-native-firebase/auth';
import { deleteDoc, doc } from '@react-native-firebase/firestore';
import { db } from '../../api/client/firebase';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUserProfile, useUpdateUserProfile } from '../../api/services/user/profile';

export function useAccountSettings() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { data: profile, isLoading } = useUserProfile(user?.uid ?? null);
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateUserProfile();

  const [isEditNameModalVisible, setEditNameModalVisible] = useState(false);
  const [isSignUpModalVisible, setSignUpModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const openEditNameModal = () => {
    setNewName(profile?.name || '');
    setEditNameModalVisible(true);
  };

  const closeEditNameModal = () => {
    setEditNameModalVisible(false);
    setNewName('');
  };

  const handleSaveName = () => {
    if (!user?.uid || !newName.trim()) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    updateProfile(
      { userId: user.uid, updates: { name: newName.trim() } },
      {
        onSuccess: () => {
          closeEditNameModal();
          Alert.alert('Success!', 'Name changed successfully!');
        },
        onError: (error) => {
          console.error('Error updating name:', error);
          Alert.alert('Error', 'Failed to update name. Please try again.');
        },
      }
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/');
            Alert.alert('Signed out successfully');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.uid) return;

              // Delete Firestore document
              const userDocRef = doc(db, 'users', user.uid);
              await deleteDoc(userDocRef);

              // Delete Firebase Auth user
              const authUser = useAuthStore.getState().user;
              if (authUser) {
                await deleteUser(authUser as any);
              }

              // Sign out (clears Zustand store via MMKV)
              signOut();
              router.replace('/');
              Alert.alert('Account deleted successfully');
            } catch (error: any) {
              console.error('Error deleting account:', error);
              
              // Handle re-authentication required error
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication Required',
                  'For security reasons, please sign in again before deleting your account.'
                );
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  return {
    // State
    user,
    profile,
    isAuthenticated,
    isLoading,
    isUpdating,
    isEditNameModalVisible,
    isSignUpModalVisible,
    newName,

    // Actions
    setNewName,
    openEditNameModal,
    closeEditNameModal,
    handleSaveName,
    handleSignOut,
    handleDeleteAccount,
    setSignUpModalVisible,
  };
}