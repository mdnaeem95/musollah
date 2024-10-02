import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDoas } from '../../api/firebase/index';
import { DoasState } from '../../utils/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState: DoasState = {
    doas: [],
    loading: false,
    error: null,
};

// Save doas data to AsyncStorage
const saveDailyDoasDataToLocal = async (doas: any) => {
  try {
    await AsyncStorage.setItem('cachedDailyDoasData', JSON.stringify(doas));
  } catch (error) {
    console.error('Error saving daily doas data to local storage:', error);
  }
};

// Load doas data from AsyncStorage
const loadDailyDoasDataFromLocal = async () => {
  try {
    const cachedDoas = await AsyncStorage.getItem('cachedDailyDoasData');
    return cachedDoas ? JSON.parse(cachedDoas) : null;
  } catch (error) {
    console.error('Error loading daily doas data from local storage:', error);
    return null;
  }
};

export const fetchDailyDoasData = createAsyncThunk(
  'quran/fetchDailyDoasData',
  async (_, { rejectWithValue }) => {
    try {
      // Check if daily doas data is cached locally
      const cachedDoas = await loadDailyDoasDataFromLocal();
      if (cachedDoas) {
        console.log('Using cached daily doas data');
        return cachedDoas; // Return cached data if it exists
      }

      // If no cache, fetch from the server
      const dailyDoasData = await fetchDoas();
      
      // Cache the fetched data for future use
      await saveDailyDoasDataToLocal(dailyDoasData);
      
      return dailyDoasData;
    } catch (error) {
      console.error("Failed to fetch daily doas", error);
      return rejectWithValue('Failed to fetch daily doas');
    }
  }
);

const quranSlice = createSlice({
  name: 'doas',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyDoasData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyDoasData.fulfilled, (state, action) => {
        state.doas = action.payload;
        state.loading = false;
      })
      .addCase(fetchDailyDoasData.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export default quranSlice.reducer;
