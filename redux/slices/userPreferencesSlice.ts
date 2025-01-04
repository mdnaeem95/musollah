import { createSlice } from '@reduxjs/toolkit';

interface UserPreferencesState {
  timeFormat: '12-hour' | '24-hour';
  reminderInterval: number;
  theme: 'green' | 'blue' | 'purple'; // Available themes
  isDarkMode: boolean; // Dark mode toggle
}

const initialState: UserPreferencesState = {
  timeFormat: '12-hour', // Default to 12-hour format
  reminderInterval: 0,
  theme: 'green', // Default theme
  isDarkMode: false, // Default to light mode
};

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    toggleTimeFormat: (state) => {
      state.timeFormat = state.timeFormat === '12-hour' ? '24-hour' : '12-hour';
    },
    setTimeFormat: (state, action) => {
      state.timeFormat = action.payload;
    },
    setReminderInterval: (state, action) => {
      state.reminderInterval = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

export const { 
  toggleTimeFormat, 
  setTimeFormat, 
  setReminderInterval, 
  toggleDarkMode, 
  setTheme 
} = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer;
