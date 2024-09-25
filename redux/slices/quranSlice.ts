import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchSurahs } from '../../api/firebase/index';
import { QuranState } from '../../utils/types';

const initialState: QuranState = {
  surahs: [],
  isLoading: false,
  error: null,
};

export const fetchSurahsData = createAsyncThunk(
  'quran/fetchSurahsData',
  async (_, { rejectWithValue }) => {
    try {
      const surahData = await fetchSurahs();
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
