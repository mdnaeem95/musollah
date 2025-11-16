/**
 * Auth Store
 * 
 * Manages authentication state and user session.
 * Replaces auth-related state from Redux userSlice with Zustand.
 * 
 * Features:
 * - User authentication status
 * - Basic user info (userId, email, name)
 * - Sign in/sign out actions
 * - MMKV persistence
 * 
 * Note: Full user profile data (enrolledCourses, prayerLogs, etc.) 
 * should be managed by TanStack Query in api/services/user/
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { generateReferralCode } from '../utils'

// ============================================================================
// TYPES
// ============================================================================

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  avatarUrl?: string;
  referralCode?: string;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Actions
      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🔐 Signing in user:', email);
          
          const auth = getAuth();
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Fetch user data from Firestore
          const userDocRef = firestore().collection('users').doc(firebaseUser.uid);
          const userDoc = await userDocRef.get();
          const userData = userDoc.data();
          
          if (!userData) {
            throw new Error('User data not found in Firestore.');
          }
          
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            displayName: firebaseUser.displayName || userData.name || 'User',
            avatarUrl: userData.avatarUrl || 'https://via.placeholder.com/100',
            referralCode: userData.referralCode,
          };
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('✅ Sign in successful:', user.uid);
        } catch (error: any) {
          console.error('❌ Sign in failed:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to sign in',
          });
          throw error;
        }
      },
      
      signUp: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('📝 Signing up user:', email);
          
          const auth = getAuth();
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          const referralCode = generateReferralCode(firebaseUser.uid);
          
          // Create user document in Firestore
          const userDoc = firestore().collection('users').doc(firebaseUser.uid);
          await userDoc.set({
            name: firebaseUser.displayName || 'New User',
            email: firebaseUser.email,
            avatarUrl: 'https://via.placeholder.com/100',
            enrolledCourses: [],
            prayerLogs: {},
            role: 'user',
            likedQuestions: [],
            favouriteRestaurants: [],
            referralCode,
            referralCount: 0,
            aboutMe: '',
            interests: [],
            followers: {},
            following: {},
            savedEvents: [],
            createdAt: firestore.FieldValue.serverTimestamp(),
            gamification: {
              prayerStreak: {
                current: 0,
                highest: 0,
                lastLoggedDate: '',
              },
            },
          });
          
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            displayName: firebaseUser.displayName || 'New User',
            avatarUrl: 'https://via.placeholder.com/100',
            referralCode,
          };
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('✅ Sign up successful:', user.uid);
        } catch (error: any) {
          console.error('❌ Sign up failed:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to sign up',
          });
          throw error;
        }
      },
      
      signOut: () => {
        console.log('👋 Signing out user');
        
        // Sign out from Firebase
        const auth = getAuth();
        auth.signOut();
        
        // Clear auth state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        
        console.log('✅ Sign out successful');
      },
      
      setUser: (user) => {
        console.log('👤 Setting user:', user?.uid);
        set({
          user,
          isAuthenticated: !!user,
        });
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth', // Storage key
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = defaultStorage.getString(name);
          return value ?? null;
        },
        setItem: (name, value) => {
          defaultStorage.setString(name, value);
        },
        removeItem: (name) => {
          defaultStorage.delete(name);
        },
      })),
      // Only persist user data, not loading/error states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Select only authentication status
 */
export const useIsAuthenticated = () => 
  useAuthStore((state) => state.isAuthenticated);

/**
 * Select only user ID
 */
export const useUserId = () => 
  useAuthStore((state) => state.user?.uid ?? null);

/**
 * Select only user email
 */
export const useUserEmail = () => 
  useAuthStore((state) => state.user?.email ?? null);

/**
 * Select only user display name
 */
export const useUserDisplayName = () => 
  useAuthStore((state) => state.user?.displayName ?? null);

/**
 * Select only user avatar
 */
export const useUserAvatar = () => 
  useAuthStore((state) => state.user?.avatarUrl ?? null);

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Get current user info (memoized)
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user);
};

/**
 * Check if user is authenticated and get userId in one call
 */
export const useAuth = () => {
  return useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    userId: state.user?.uid ?? null,
    user: state.user,
  }));
};

/**
 * Get auth actions (sign in, sign out, etc.)
 */
export const useAuthActions = () => {
  return useAuthStore((state) => ({
    signIn: state.signIn,
    signUp: state.signUp,
    signOut: state.signOut,
    clearError: state.clearError,
  }));
};

// ============================================================================
// FIREBASE AUTH LISTENER
// ============================================================================

/**
 * Initialize Firebase auth state listener
 * Call this once in your app's root component
 */
export const initializeAuthListener = () => {
  const auth = getAuth();
  
  return auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      console.log('🔄 Auth state changed - User signed in:', firebaseUser.uid);
      
      // Fetch user data from Firestore
      try {
        const userDoc = await firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .get();
        
        const userData = userDoc.data();
        
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || userData?.name || 'User',
          avatarUrl: userData?.avatarUrl || 'https://via.placeholder.com/100',
          referralCode: userData?.referralCode,
        };
        
        useAuthStore.getState().setUser(user);
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
        // Set basic user info even if Firestore fetch fails
        useAuthStore.getState().setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
        });
      }
    } else {
      console.log('🔄 Auth state changed - User signed out');
      useAuthStore.getState().setUser(null);
    }
  });
};