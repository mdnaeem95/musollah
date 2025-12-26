/**
 * Account Settings Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Action tracking and error monitoring
 * 
 * Business logic for account management screen.
 * Handles profile editing, sign out, and account deletion.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteUser } from '@react-native-firebase/auth';
import { deleteDoc, doc } from '@react-native-firebase/firestore';
import { db } from '../../api/client/firebase';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUserProfile, useUpdateUserProfile } from '../../api/services/user/profile';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Account Settings');

/**
 * Hook for account settings page
 * Manages profile editing, authentication, and account deletion
 * 
 * @returns {Object} Account state and actions
 */
export function useAccountSettings() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { data: profile, isLoading } = useUserProfile(user?.uid ?? null);
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateUserProfile();

  const [isEditNameModalVisible, setEditNameModalVisible] = useState(false);
  const [isSignUpModalVisible, setSignUpModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Account settings hook mounted', {
      isAuthenticated,
      hasProfile: !!profile,
      userId: user?.uid,
    });
    
    return () => {
      logger.debug('Account settings hook unmounted');
    };
  }, []);

  // ✅ Log profile load
  useEffect(() => {
    if (isLoading) {
      logger.debug('Loading user profile...');
      return;
    }

    if (profile) {
      logger.success('User profile loaded', {
        userId: user?.uid,
        name: profile.name,
        email: profile.email,
        enrolledCoursesCount: profile.enrolledCourses?.length || 0,
      });
    }
  }, [profile, isLoading, user?.uid]);

  // ============================================================================
  // EDIT NAME
  // ============================================================================

  const openEditNameModal = () => {
    logger.info('Opening edit name modal', {
      currentName: profile?.name,
    });
    
    setNewName(profile?.name || '');
    setEditNameModalVisible(true);
  };

  const closeEditNameModal = () => {
    logger.debug('Closing edit name modal', {
      nameChanged: newName !== profile?.name,
    });
    
    setEditNameModalVisible(false);
    setNewName('');
  };

  const handleSaveName = () => {
    if (!user?.uid || !newName.trim()) {
      logger.warn('Invalid name save attempt', {
        hasUserId: !!user?.uid,
        nameLength: newName.trim().length,
      });
      
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    logger.info('Saving name change', {
      userId: user.uid,
      oldName: profile?.name,
      newName: newName.trim(),
    });

    logger.time('save-name');

    updateProfile(
      { userId: user.uid, updates: { name: newName.trim() } },
      {
        onSuccess: () => {
          logger.timeEnd('save-name');
          logger.success('Name updated successfully', {
            userId: user.uid,
            newName: newName.trim(),
          });
          
          closeEditNameModal();
          Alert.alert('Success!', 'Name changed successfully!');
        },
        onError: (error) => {
          logger.timeEnd('save-name');
          logger.error('Failed to update name', error as Error, {
            userId: user.uid,
          });
          
          Alert.alert('Error', 'Failed to update name. Please try again.');
        },
      }
    );
  };

  // ============================================================================
  // SIGN OUT
  // ============================================================================

  const handleSignOut = () => {
    logger.info('Sign out initiated', {
      userId: user?.uid,
    });

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            logger.debug('Sign out cancelled');
          },
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logger.info('User confirmed sign out');
            
            signOut();
            router.replace('/');
            
            logger.success('User signed out', {
              userId: user?.uid,
            });
            
            Alert.alert('Signed out successfully');
          },
        },
      ]
    );
  };

  // ============================================================================
  // DELETE ACCOUNT
  // ============================================================================

  const handleDeleteAccount = () => {
    logger.warn('Account deletion initiated', {
      userId: user?.uid,
    });

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted. Do you want to proceed?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            logger.debug('Account deletion cancelled');
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            logger.warn('User confirmed account deletion', {
              userId: user?.uid,
            });

            logger.time('delete-account');

            try {
              if (!user?.uid) {
                logger.error('No user ID for account deletion', new Error('Missing user ID'));
                return;
              }

              // ============================================
              // Step 1: Delete Firestore document
              // ============================================
              logger.debug('Deleting Firestore user document...', {
                userId: user.uid,
              });
              
              const userDocRef = doc(db, 'users', user.uid);
              await deleteDoc(userDocRef);
              
              logger.success('Firestore document deleted');

              // ============================================
              // Step 2: Delete Firebase Auth user
              // ============================================
              logger.debug('Deleting Firebase Auth user...');
              
              const authUser = useAuthStore.getState().user;
              if (authUser) {
                await deleteUser(authUser as any);
                logger.success('Firebase Auth user deleted');
              } else {
                logger.warn('No auth user found for deletion');
              }

              // ============================================
              // Step 3: Sign out and cleanup
              // ============================================
              logger.debug('Signing out and cleaning up...');
              
              signOut();
              router.replace('/');
              
              logger.timeEnd('delete-account');
              logger.success('Account deleted successfully', {
                userId: user.uid,
              });
              
              Alert.alert('Account deleted successfully');
            } catch (error: any) {
              logger.timeEnd('delete-account');
              
              // Handle re-authentication required error
              if (error.code === 'auth/requires-recent-login') {
                logger.warn('Re-authentication required for account deletion', {
                  errorCode: error.code,
                });
                
                Alert.alert(
                  'Re-authentication Required',
                  'For security reasons, please sign in again before deleting your account.'
                );
              } else {
                logger.error('Failed to delete account', error as Error, {
                  userId: user?.uid,
                  errorCode: error.code,
                });
                
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