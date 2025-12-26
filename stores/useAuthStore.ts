/**
 * Authentication Store
 * 
 * ✅ REFACTORED: Using structured logging system
 * ✅ IMPROVED: Added performance timers, better error context
 * 
 * Manages user authentication state with Firebase:
 * - Sign in/up/out
 * - User profile sync
 * - MMKV persistence
 * - Firebase auth listener
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { shallow, useShallow } from 'zustand/shallow';
import { defaultStorage } from '../api/client/storage';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { generateReferralCode } from '../utils';
import { authService, db } from '../api/client/firebase';
import { doc, getDoc } from '@react-native-firebase/firestore';

// ✅ Import structured logging
import { createLogger } from '../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Auth Store');

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
      
      // =======================================================================
      // Sign In
      // =======================================================================
      signIn: async (email, password) => {
        logger.time('sign-in');
        logger.info('Attempting sign in', { email });
        
        set({ isLoading: true, error: null });
        
        try {
          // Step 1: Firebase authentication
          logger.debug('Authenticating with Firebase...');
          const auth = getAuth();
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          logger.debug('Firebase auth successful', { 
            uid: firebaseUser.uid,
            emailVerified: firebaseUser.emailVerified,
          });
          
          // Step 2: Fetch user data from Firestore
          logger.debug('Fetching user data from Firestore...', { uid: firebaseUser.uid });
          const userDocRef = firestore().collection('users').doc(firebaseUser.uid);
          const userDoc = await userDocRef.get();
          
          if (!userDoc.exists) {
            logger.error('User document not found in Firestore', new Error('User data not found'), {
              uid: firebaseUser.uid,
              email,
            });
            throw new Error('User data not found in Firestore.');
          }
          
          const userData = userDoc.data();
          
          // Step 3: Construct user object
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            displayName: firebaseUser.displayName || userData?.name || 'User',
            avatarUrl: userData?.avatarUrl || 'https://via.placeholder.com/100',
            referralCode: userData?.referralCode,
          };
          
          logger.debug('User data fetched', {
            uid: user.uid,
            displayName: user.displayName,
            hasReferralCode: !!user.referralCode,
          });
          
          // Step 4: Update store
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          logger.success('Sign in successful', { 
            uid: user.uid,
            email: user.email,
          });
          logger.timeEnd('sign-in');
          
        } catch (error: any) {
          logger.error('Sign in failed', error, {
            email,
            errorCode: error.code,
            errorMessage: error.message,
          });
          
          // User-friendly error messages
          let userMessage = 'Failed to sign in';
          if (error.code === 'auth/user-not-found') {
            userMessage = 'No account found with this email';
          } else if (error.code === 'auth/wrong-password') {
            userMessage = 'Incorrect password';
          } else if (error.code === 'auth/invalid-email') {
            userMessage = 'Invalid email address';
          } else if (error.code === 'auth/too-many-requests') {
            userMessage = 'Too many attempts. Please try again later';
          }
          
          set({
            isLoading: false,
            error: userMessage,
          });
          
          logger.timeEnd('sign-in');
          throw error;
        }
      },
      
      // =======================================================================
      // Sign Up
      // =======================================================================
      signUp: async (email, password) => {
        logger.time('sign-up');
        logger.info('Attempting sign up', { email });
        
        set({ isLoading: true, error: null });
        
        try {
          // Step 1: Create Firebase user
          logger.debug('Creating Firebase user account...');
          const auth = getAuth();
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          logger.debug('Firebase account created', { 
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          });
          
          // Step 2: Generate referral code
          const referralCode = generateReferralCode(firebaseUser.uid);
          logger.debug('Generated referral code', { 
            referralCode,
            uid: firebaseUser.uid,
          });
          
          // Step 3: Create Firestore user document
          logger.debug('Creating Firestore user document...');
          const userDoc = firestore().collection('users').doc(firebaseUser.uid);
          
          const userData = {
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
          };
          
          await userDoc.set(userData);
          
          logger.debug('Firestore user document created', {
            uid: firebaseUser.uid,
            fields: Object.keys(userData),
          });
          
          // Step 4: Construct user object
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            displayName: firebaseUser.displayName || 'New User',
            avatarUrl: 'https://via.placeholder.com/100',
            referralCode,
          };
          
          // Step 5: Update store
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          logger.success('Sign up successful', { 
            uid: user.uid,
            email: user.email,
            referralCode,
          });
          logger.timeEnd('sign-up');
          
        } catch (error: any) {
          logger.error('Sign up failed', error, {
            email,
            errorCode: error.code,
            errorMessage: error.message,
          });
          
          // User-friendly error messages
          let userMessage = 'Failed to sign up';
          if (error.code === 'auth/email-already-in-use') {
            userMessage = 'Email already registered';
          } else if (error.code === 'auth/weak-password') {
            userMessage = 'Password is too weak';
          } else if (error.code === 'auth/invalid-email') {
            userMessage = 'Invalid email address';
          }
          
          set({
            isLoading: false,
            error: userMessage,
          });
          
          logger.timeEnd('sign-up');
          throw error;
        }
      },
      
      // =======================================================================
      // Sign Out
      // =======================================================================
      signOut: () => {
        logger.time('sign-out');
        logger.info('Signing out user', { 
          uid: get().user?.uid,
        });
        
        try {
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
          
          logger.success('Sign out successful');
          logger.timeEnd('sign-out');
        } catch (error) {
          logger.error('Sign out failed', error);
          logger.timeEnd('sign-out');
        }
      },
      
      // =======================================================================
      // Set User (called by auth listener)
      // =======================================================================
      setUser: (user) => {
        if (user) {
          logger.debug('Setting user from auth listener', { 
            uid: user.uid,
            email: user.email,
          });
        } else {
          logger.debug('Clearing user (signed out)');
        }
        
        set({
          user,
          isAuthenticated: !!user,
        });
      },
      
      // =======================================================================
      // Clear Error
      // =======================================================================
      clearError: () => {
        logger.debug('Clearing auth error');
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
 * ✅ FIXED: Uses shallow comparison to prevent infinite loops
 */
export const useAuth = () => {
  return useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      userId: state.user?.uid ?? null,
      user: state.user,
    }))
  );
};

/**
 * Get auth actions (sign in, sign out, etc.)
 */
export const useAuthActions = () => {
  return useAuthStore(
    useShallow((state) => ({
      signIn: state.signIn,
      signUp: state.signUp,
      signOut: state.signOut,
      clearError: state.clearError,
    }))
  );
};

// ============================================================================
// FIREBASE AUTH LISTENER
// ============================================================================

/**
 * Initialize Firebase auth state listener
 * Call this once in your app's root component
 */
export const initializeAuthListener = () => {
  logger.info('Initializing Firebase auth listener');
  
  return onAuthStateChanged(authService, async (firebaseUser) => {
    if (firebaseUser) {
      logger.debug('Auth state changed: User signed in', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
      });
      
      try {
        // Fetch user data from Firestore
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!userSnap.exists()) {
          logger.warn('User document not found in Firestore during auth state change', {
            uid: firebaseUser.uid,
          });
        }
        
        const userData = userSnap.data();

        useAuthStore.getState().setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || (userData as any)?.name || 'User',
          avatarUrl: (userData as any)?.avatarUrl || 'https://via.placeholder.com/100',
          referralCode: (userData as any)?.referralCode,
        });
        
        logger.debug('User data synced from Firestore', {
          uid: firebaseUser.uid,
          hasUserData: !!userData,
        });
      } catch (error) {
        logger.error('Error fetching user data during auth state change', error, {
          uid: firebaseUser.uid,
        });
        
        // Fallback: Set user with Firebase data only
        useAuthStore.getState().setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
        });
      }
    } else {
      logger.debug('Auth state changed: User signed out');
      useAuthStore.getState().setUser(null);
    }
  });
};