import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore';
import { UserState } from '../../utils/types';
import { eachDayOfInterval, endOfMonth, format, startOfMonth, subDays } from 'date-fns';
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }
    }
  );
  
export const signUp = createAsyncThunk(
    'user/signUp',
    async ({ email, password }: { email: string; password: string }) => {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Add user to Firestore\
        const userDoc = firestore().collection('users').doc(user.uid);
        await userDoc.set({
            name: user.displayName || 'New User',
            email: user.email,
            avatarUrl: 'https://via.placeholder.com/100',
            enrolledCourses: [],
            prayerLogs: []
        })

        // Return only serializable parts of the user object to Redux
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
      };
})

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

// Fetch prayer log for today's date
export const fetchPrayerLog = createAsyncThunk(
  'user/fetchPrayerLog',
  async (_, { rejectWithValue }) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not logged in');
      }

      const todayDate = format(new Date(), 'yyyy-MM-dd');
      const cacheKey = `prayerLogs_${todayDate}`;

      // Check for cached prayer logs
      const cachedLog = await AsyncStorage.getItem(cacheKey);
      if (cachedLog) {
        return { date: todayDate, prayerLog: JSON.parse(cachedLog) };
      }

      // If no cache, fetch from Firestore
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();

      if (!userData || !userData.prayerLogs || !userData.prayerLogs[todayDate]) {
        return {
          date: todayDate,
          prayerLog: {
            Subuh: false,
            Zohor: false,
            Asar: false,
            Maghrib: false,
            Isyak: false
          }
        }
      }

      // Retrieve the prayer logs for today's date
      const prayerLog = userData.prayerLogs[todayDate];

      // Cache the logs after fetching from Firestore
      await AsyncStorage.setItem(cacheKey, JSON.stringify(prayerLog));

      return { date: todayDate, prayerLog };
    } catch (error) {
      console.error('Failed to fetch prayer log:', error);
      return rejectWithValue('Failed to fetch prayer log');
    }
  }
);

// Thunk to fetch monthly prayer logs
export const fetchMonthlyPrayerLogs = createAsyncThunk(
    'user/fetchMonthlyPrayerLogs',
    async (_, { rejectWithValue }) => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
  
        if (!user) {
          throw new Error('User not logged in');
        }
  
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
  
        if (!userData || !userData.prayerLogs) {
          throw new Error('No prayer logs found for the user');
        }
  
        // Calculate the start and end of the current month
        const today = new Date();
        const firstDayOfMonth = startOfMonth(today);
        const lastDayOfMonth = endOfMonth(today);

        // Create an array of dates for the current month
        const datesInMonth = eachDayOfInterval({
          start: firstDayOfMonth,
          end: lastDayOfMonth
        }).map(date => format(date, 'yyyy-MM-dd'));
  
        // Filter the prayer logs for the past 30 days
        const monthlyLogs = datesInMonth.map((date) => {
          const log = userData.prayerLogs[date];
          const prayersCompleted = log ? Object.values(log.status).filter(val  => val === true).length : 0;
          return { date, prayersCompleted };
        });
  
        return monthlyLogs;
      } catch (error) {
        console.error('Failed to fetch monthly prayer logs:', error);
        return rejectWithValue('Failed to fetch monthly prayer logs');
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
},
extraReducers: (builder) => {
    builder
    .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
    })
    .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload;
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
        state.user = action.payload;
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
        state.error = null;
    })
    .addCase(fetchPrayerLog.fulfilled, (state, action) => {
        const { date, prayerLog } = action.payload;
        if (state.user) {
            if (!state.user.prayerLogs) {
            state.user.prayerLogs = {};
            }
            state.user.prayerLogs[date] = prayerLog;
        }
        state.loading = false;
    })
    .addCase(fetchPrayerLog.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
    })
    .addCase(fetchMonthlyPrayerLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
    })
    .addCase(fetchMonthlyPrayerLogs.fulfilled, (state, action) => {
        state.user = {
            ...state.user,
            monthlyLogs: action.payload, // Add monthly logs to the user state
        };
        state.loading = false;
    })
    .addCase(fetchMonthlyPrayerLogs.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
    });
},
});

export const { signOut } = userSlice.actions;

export default userSlice.reducer;