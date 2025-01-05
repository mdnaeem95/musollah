import { createSlice } from '@reduxjs/toolkit';

interface UserPreferencesState {
  theme: 'green' | 'blue' | 'purple'; // Available themes
  isDarkMode: boolean; // Dark mode toggle
  textSize: number; // User-selected text size
  reciter: string; // Selected reciter
  timeFormat: '12-hour' | '24-hour'; // Time format
  reminderInterval: number; // Reminder interval
}

const initialState: UserPreferencesState = {
  theme: 'green', // Default theme
  isDarkMode: false, // Default to light mode
  textSize: 30, // Default text size
  reciter: 'ar.alafasy', // Default reciter
  timeFormat: '12-hour', // Default to 12-hour format
  reminderInterval: 0,
};

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setTextSize: (state, action) => {
      state.textSize = action.payload;
    },
    setReciter: (state, action) => {
      state.reciter = action.payload;
    },
    setTimeFormat: (state, action) => {
      state.timeFormat = action.payload;
    },
    setReminderInterval: (state, action) => {
      state.reminderInterval = action.payload;
    },
    toggleTimeFormat: (state) => {
      state.timeFormat = state.timeFormat === '12-hour' ? '24-hour' : '12-hour';
    },
  },
});

export const {
  setTheme,
  toggleDarkMode,
  setTextSize,
  setReciter,
  setTimeFormat,
  setReminderInterval,
  toggleTimeFormat
} = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer;
