import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
});

export const { updateStreak, addXP, addBadge, completeChallenge, resetChallenge } =
  gamificationSlice.actions;

export default gamificationSlice.reducer;
