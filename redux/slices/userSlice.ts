import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore';
import { UserState } from '../../utils/types';
import { eachDayOfInterval, format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState: UserState = {
    user: null,
    loading: false,
    error: null
}

export const signIn = createAsyncThunk(
  'user/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const auth = getAuth();
    // First, sign the user in via Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = firestore().collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User data not found in firestore.');
    }
    
    return {
      uid: user.uid,                      // From Firebase Auth
      email: user.email,                  // From Firebase Auth
      displayName: user.displayName,      // From Firebase Auth
      photoURL: user.photoURL,            // From Firebase Auth
      enrolledCourses: userData?.enrolledCourses || [],  // From Firestore
      prayerLogs: userData?.prayerLogs || [],            // From Firestore
      likedQuestions: userData?.likedQuestions || [],
      favouriteRestaurants: userData?.favouriteRestaurants || []
    };
  }
);
  
export const signUp = createAsyncThunk(
  'user/signUp',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const auth = getAuth();
      // First, create the user using Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Next, add the user document to Firestore
      const userDoc = firestore().collection('users').doc(user.uid);
        await userDoc.set({
        name: user.displayName || 'New User',
        email: user.email,
        avatarUrl: 'https://via.placeholder.com/100',  // Default avatar
        enrolledCourses: [],                           // Default: no enrolled courses
        prayerLogs: [],                           // Default: empty prayer logs
        role: 'user',
        likedQuestions: [],
        favouriteRestaurants: []
    });

    // Return the Auth User data (no need to fetch Firestore again here)
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error: any) {
    console.error('Sign-up failed:', error.code, error.message, error.status);
    return rejectWithValue(error.message);
  }
  }
);

// Thunk to fetch the latest user data, including role and profile data from Firestore
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('User not logged in');

      // Retrieve user data from Firestore
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();

      if (!userDoc.exists) {
        throw new Error('User data not found in Firestore.');
      }

      const userData = userDoc.data();
      return {
        id: currentUser.uid,
        email: currentUser.email || '',
        name: currentUser.displayName || 'New User',
        avatarUrl: currentUser.photoURL || 'https://via.placeholder.com/100',
        enrolledCourses: userData?.enrolledCourses || [],
        prayerLogs: userData?.prayerLogs || [],
        role: userData?.role || 'user',
        likedQuestions: userData?.likedQuestions || [],
      };
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      return rejectWithValue(error.message);
    }
  }
);

// SavePrayerLog Thunk - Logs user prayers
export const savePrayerLog = createAsyncThunk(
  'user/savePrayerLog',
  async ({ userId, date, prayerLog }: { userId: string; date: string; prayerLog: any }, { rejectWithValue }) => {
    try {
      const userDoc = firestore().collection('users').doc(userId);
      await userDoc.update({
        [`prayerLogs.${date}`]: prayerLog // Save prayer logs under the specific date
      });

      // Cache the log after saving it to Firestore
      await AsyncStorage.setItem(`prayerLogs_${date}`, JSON.stringify(prayerLog));

      return { date, prayerLog }; // Return the log data for updating the state
    } catch (error) {
      console.error('Failed to save prayer log: ', error);
      return rejectWithValue('Failed to save prayer log');
    }
  }
);

// Thunk to fetch prayer log for today's date
export const fetchPrayerLog = createAsyncThunk(
  'user/fetchPrayerLog',
  async ({ date }: { date: string }, { rejectWithValue }) => {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('User not logged in');

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();

      // Retrieve logs for the specified date or initialize if not found
      const prayerLog = (userData?.prayerLogs?.[date]) || {
        Subuh: false,
        Zohor: false,
        Asar: false,
        Maghrib: false,
        Isyak: false,
      };

      return { date, prayerLog };
    } catch (error) {
      console.error('Error in fetchPrayerLog:', error);
      return rejectWithValue('Failed to fetch prayer log');
    }
  }
);

// Redux slice update to fetch weekly logs
export const fetchWeeklyPrayerLogs = createAsyncThunk(
  'user/fetchWeeklyPrayerLogs',
  async ({ startDate, endDate }: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('User not logged in');

      const logsRef = firestore().collection('users').doc(user.uid);
      const userData = (await logsRef.get()).data();

      const prayerLogs = userData?.prayerLogs || {};
      const weeklyLogs: any = {};

      eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) }).forEach((date) => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        weeklyLogs[formattedDate] = prayerLogs[formattedDate] || {
          Subuh: false,
          Zohor: false,
          Asar: false,
          Maghrib: false,
          Isyak: false,
        };
      });

      return weeklyLogs;
    } catch (error) {
      return rejectWithValue('Failed to fetch weekly prayer logs');
    }
  }
);
   
const userSlice = createSlice({
name: 'user',
initialState,
reducers: {
    signOut: (state) => {
    state.user = null;
    },
    updateUserState: (state, action: PayloadAction<UserState['user']>) => {
      if (action.payload) {
        const updatedUser = {
          ...action.payload,
        };
        state.user = updatedUser;
      }
    },
},
extraReducers: (builder) => {
    builder
    .addCase(fetchUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.loading = false;
    })
    .addCase(fetchUser.rejected, (state, action) => {
      state.error = action.payload as string;
      state.loading = false;
    })
    .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
    })
    .addCase(signIn.fulfilled, (state, action) => {
      state.user = {
        id: action.payload.uid,                          // Firebase Auth UID
        avatarUrl: action.payload.photoURL || 'https://via.placeholder.com/100',  // From Firebase Auth
        email: action.payload.email || '',               // From Firebase Auth
        name: action.payload.displayName || 'New User',  // From Firebase Auth
        enrolledCourses: action.payload.enrolledCourses || [],  // From Firestore
        prayerLogs: action.payload.prayerLogs || [],
        role: 'user',            // From Firestore
        likedQuestions: action.payload.likedQuestions || [],
        };
      state.loading = false;
    })
    .addCase(signIn.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to sign in';
        state.loading = false;
    })
    .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
    })
    .addCase(signUp.fulfilled, (state, action) => {
        state.user = {
          id: action.payload.uid, // Firebase UID is the user's ID
          avatarUrl: action.payload.photoURL || 'https://via.placeholder.com/100', // Default avatar
          email: action.payload.email || '',
          name: action.payload.displayName || 'New User', // Default to 'New User' if displayName is null
          enrolledCourses: [], // Initialize with an empty enrolledCourses array
          prayerLogs: [], // Initialize with an empty prayerLogs array
          role: 'user',
          likedQuestions: []
        };
        state.loading = false;
    })
    .addCase(signUp.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to sign up';
        state.loading = false;
    })
    .addCase(savePrayerLog.fulfilled, (state, action) => {
        const { date, prayerLog } = action.payload;
        if (state.user) {
          if (!state.user.prayerLogs) {
            state.user.prayerLogs = {};
          }
          state.user.prayerLogs[date] = prayerLog; // Update prayer log in the local state
        }
        state.loading = false;
    })
    .addCase(savePrayerLog.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
    })
    .addCase(fetchPrayerLog.pending, (state) => {
      state.loading = true;
      state.error = null;  // Reset any previous errors
    })
    .addCase(fetchPrayerLog.fulfilled, (state, action) => {
      console.log('Action payload for fetchPrayerLog fulfilled:', action.payload);  // Log the payload
    
      const { date, prayerLog } = action.payload;
    
      if (date && prayerLog) {
        if (state.user) {
          if (!state.user.prayerLogs) {
            state.user.prayerLogs = {};
          }
          state.user.prayerLogs[date] = prayerLog;
        }
      } else {
        console.error('Invalid payload in fetchPrayerLog fulfilled:', action.payload);
      }
    
      state.loading = false;
    })
    .addCase(fetchPrayerLog.rejected, (state, action) => {
      console.error('Error in fetchPrayerLog:', action.payload);
      state.error = 'Failed to fetch prayer log';  // Set error message
      state.loading = false;  // Stop loading
    })
},
});

export const { signOut, updateUserState } = userSlice.actions;

export default userSlice.reducer;