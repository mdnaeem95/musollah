import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GamificationState {
  streak: number; // Current streak in days
  xp: number; // Total XP earned
  level: number; // User's current level
  badges: string[]; // List of earned badges
  challenges: {
    daily: boolean; // Daily challenge completed or not
    weekly: boolean; // Weekly challenge completed or not
    monthly: boolean; // Monthly challenge completed or not
  };
}

const initialState: GamificationState = {
  streak: 0,
  xp: 0,
  level: 1,
  badges: [],
  challenges: {
    daily: false,
    weekly: false,
    monthly: false,
  },
};

export const fetchGamificationState = createAsyncThunk(
  'gamification/fetchGamificationState',
  async (userId: string, { rejectWithValue }) => {
    try {
      const gamificationDoc = await firestore().collection('users').doc(userId).get();
      const gamificationData = gamificationDoc.data()?.gamification;

      if (!gamificationData) {
        throw new Error('Gamification data not found.');
      }

      return gamificationData;
    } catch (error) {
      console.error('Failed to fetch gamification state: ', error);
      return rejectWithValue('Failed to fetch gamification data');
    }
  }
)

export const saveGamificationState = createAsyncThunk(
  'gamification/saveState',
  async (state: GamificationState, { rejectWithValue }) => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await firestore().collection('users').doc(userId).update({
        gamification: state
      })
    } catch (error) {
      console.error('Failed to save gamification state: ', error);
      return rejectWithValue('Failed to save gamification state');
    }
  }
)

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    updateStreak(state, action: PayloadAction<number>) {
      state.streak = action.payload;
    },
    addXP(state, action: PayloadAction<number>) {
      state.xp += action.payload;
      state.level = Math.floor(state.xp / 100); // Example: 100 XP per level
    },
    addBadge(state, action: PayloadAction<string>) {
      if (!state.badges.includes(action.payload)) {
        state.badges.push(action.payload);
      }
    },
    completeChallenge(state, action: PayloadAction<'daily' | 'weekly' | 'monthly'>) {
      state.challenges[action.payload] = true;
    },
    resetChallenge(state, action: PayloadAction<'daily' | 'weekly' | 'monthly'>) {
      state.challenges[action.payload] = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamificationState.pending, (state) => {

      })
      .addCase(fetchGamificationState.fulfilled, (state, action: PayloadAction<GamificationState>) => {
        return { ...state, ...action.payload }
      })
      .addCase(fetchGamificationState.rejected, (state, action) => {
        console.error('Failed to fetch gamification state:', action.payload)
      })
  }
});

export const { updateStreak, addXP, addBadge, completeChallenge, resetChallenge } =
  gamificationSlice.actions;

export default gamificationSlice.reducer;
