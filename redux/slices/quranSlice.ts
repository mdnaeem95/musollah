import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchSurahs } from '../../api/firebase/index';
import { QuranState } from '../../utils/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState: QuranState = {
  surahs: [],
  isLoading: false,
  error: null,
};

// Save Quran data to AsyncStorage
const saveQuranDataToLocal = async (surahs: any) => {
  try {
    await AsyncStorage.setItem('cachedQuranData', JSON.stringify(surahs));
  } catch (error) {
    console.error('Error saving Quran data to local storage:', error);
  }
};

// Load Quran data from AsyncStorage
const loadQuranDataFromLocal = async () => {
  try {
    const cachedSurahs = await AsyncStorage.getItem('cachedQuranData');
    return cachedSurahs ? JSON.parse(cachedSurahs) : null;
  } catch (error) {
    console.error('Error loading Quran data from local storage:', error);
    return null;
  }
};

export const fetchSurahsData = createAsyncThunk(
  'quran/fetchSurahsData',
  async (_, { rejectWithValue }) => {
    try {
      // Check if Quran data is cached locally
      const cachedSurahs = await loadQuranDataFromLocal();
      if (cachedSurahs) {
        console.log('Using cached Quran data');
        return cachedSurahs; // Return cached data if it exists
      }

      // If no cache, fetch from the server
      const surahData = await fetchSurahs();
      
      // Cache the fetched data for future use
      await saveQuranDataToLocal(surahData);
      
      return surahData;
    } catch (error) {
      console.error("Failed to fetch surahs", error);
      return rejectWithValue('Failed to fetch surahs');
    }
  }
);

const quranSlice = createSlice({
  name: 'quran',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSurahsData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSurahsData.fulfilled, (state, action) => {
        state.surahs = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchSurahsData.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

export default quranSlice.reducer;
