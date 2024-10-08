import { createSlice } from '@reduxjs/toolkit';

interface UserPreferencesState {
  timeFormat: '12-hour' | '24-hour';
  reminderInterval: number;
}

const initialState: UserPreferencesState = {
  timeFormat: '12-hour', // Default to 12-hour format
  reminderInterval: 0
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
        state.reminderInterval = action.payload
    }
  },
});

export const { toggleTimeFormat, setTimeFormat, setReminderInterval } = userPreferencesSlice.actions;
export default userPreferencesSlice.reducer;
