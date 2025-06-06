import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchSurahs } from '../../api/firebase/index';
import { Bookmark, QuranState } from '../../utils/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState: QuranState = {
  surahs: [],
  bookmarks: [],
  isLoading: false,
  error: null,
  recitationPlan: undefined
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

// Save bookmarks to asyncstorage
const saveBookmarksToLocal = async (bookmarks: Bookmark[]) => {
  try {
    await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Error saving bookmarks to local storage: ', error)
  }
}

// Load bookmarks from AsyncStorage
const loadBookmarksFromLocal = async () => {
  try {
    const savedBookmarks = await AsyncStorage.getItem('bookmarks');
    return savedBookmarks ? JSON.parse(savedBookmarks) : [];
  } catch (error) {
    console.error('Error loading bookmarks from local storage: ', error);
  }
}

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

export const loadBookmarks = createAsyncThunk(
  'quran/loadBookmarks',
  async(_, { rejectWithValue }) => {
    try {
      const bookmarks = await loadBookmarksFromLocal();
      return bookmarks;
    } catch (error) {
      console.error('Failed to load bookmarks', error);
      return rejectWithValue('Failed to loadbookmarks');
    }
  }
)

export const loadRecitationPlan = createAsyncThunk(
  'quran/loadRecitationPlan',
  async (_, { rejectWithValue }) => {
    try {
      const savedPlan = await AsyncStorage.getItem('recitationPlan');
      return savedPlan ? JSON.parse(savedPlan) : null;
    } catch (error) {
      console.error('Failed to load recitation plan, ', error);
      return rejectWithValue('Failed to load plan');
    }
  }
)

const quranSlice = createSlice({
  name: 'quran',
  initialState,
  reducers: {
    addBookmark: (state, action: PayloadAction<Bookmark>) => {
      state.bookmarks.push(action.payload);
      saveBookmarksToLocal(state.bookmarks)
    },
    removeBookmark: (state, action: PayloadAction<Bookmark>) => {
      state.bookmarks = state.bookmarks.filter(
        (bookmark) =>
          bookmark.surahNumber !== action.payload.surahNumber ||
          bookmark.ayahNumber !== action.payload.ayahNumber
      );
      saveBookmarksToLocal(state.bookmarks)
    },
    setRecitationPlan: (state, action: PayloadAction<QuranState['recitationPlan']>) => {
      state.recitationPlan = action.payload;
      AsyncStorage.setItem('recitationPlan', JSON.stringify(action.payload));
    },
    updateRecitationProgress: (state, action: PayloadAction<string>) => {
      if (!state.recitationPlan) return;
      const ayahKey = action.payload;
      if (!state.recitationPlan.completedAyahKeys.includes(ayahKey)) {
        state.recitationPlan.completedAyahKeys.push(ayahKey);
        state.recitationPlan.lastReadAyah = ayahKey;
        AsyncStorage.setItem('recitationPlan', JSON.stringify(state.recitationPlan));
      }
    },
    clearRecitatonPlan: (state) => {
      state.recitationPlan = undefined;
      AsyncStorage.removeItem('recitationPlan');
    }
  },
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
      })
      .addCase(loadBookmarks.fulfilled, (state, action) => {
        state.bookmarks = action.payload
      })
      .addCase(loadBookmarks.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(loadRecitationPlan.fulfilled, (state, action) => {
        state.recitationPlan = action.payload
      })
  },
});

export const { addBookmark, removeBookmark, setRecitationPlan, clearRecitatonPlan, updateRecitationProgress  } = quranSlice.actions;

export default quranSlice.reducer;
