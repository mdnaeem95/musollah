import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GamificationData {
  prayerStreak: {
    current: number;
    highest: number;
    lastLoggedDate: string;
  }
}

export interface GamificationState {
  gamificationData: GamificationData,
  loading: boolean;
  error: string | null;
}

const initialState: GamificationState = {
  gamificationData: {
    prayerStreak: {
      current: 0,
      highest: 0,
      lastLoggedDate: ''
    }
  },
  loading: false,
  error: null,
}

export const fetchGamificationState = createAsyncThunk(
  'gamification/fetchGamificationState',
  async (_, { rejectWithValue }) => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const gamificationDoc = await firestore().collection('users').doc(userId).get();
      const gamificationData = gamificationDoc.data()?.gamification

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

export const updatePrayerStreak = createAsyncThunk(
  'gamification/updatePrayerStreak',
  async (streak: GamificationData['prayerStreak'], { rejectWithValue }) => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await firestore().collection('users').doc(userId).update({
        'gamification.prayerStreak': streak
      });

      return streak;
    } catch (error) {
      console.error('Failed to update streak:', error);
      return rejectWithValue('Failed to update streak');
    }
  }
)

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamificationState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGamificationState.fulfilled, (state, action: PayloadAction<GamificationData>) => {
        state.loading = false;
        state.gamificationData = action.payload
      })
      .addCase(fetchGamificationState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePrayerStreak.fulfilled, (state, action: PayloadAction<GamificationData['prayerStreak']>) => {
        state.gamificationData.prayerStreak = action.payload
      })
  }
});

export default gamificationSlice.reducer;
