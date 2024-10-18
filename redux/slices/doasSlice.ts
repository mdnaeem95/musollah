import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchDoas } from '../../api/firebase/index';
import { DoaBookmark, DoasState } from '../../utils/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState: DoasState = {
    doas: [],
    bookmarks: [],
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

// Save bookmarks to asyncstorage
const saveDoaBookmarksToLocal = async (bookmarks: DoaBookmark[]) => {
  try {
    await AsyncStorage.setItem('doabookmarks', JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Error saving doa bookmarks to local storage: ', error)
  }
}

// Load bookmarks from AsyncStorage
const loadDoaBookmarksFromLocal = async () => {
  try {
    const savedBookmarks = await AsyncStorage.getItem('doabookmarks');
    return savedBookmarks ? JSON.parse(savedBookmarks) : [];
  } catch (error) {
    console.error('Error loading doa bookmarks from local storage: ', error);
  }
}

export const loadBookmarks = createAsyncThunk(
  'doas/loadBookmarks',
  async(_, { rejectWithValue }) => {
    try {
      const bookmarks = await loadDoaBookmarksFromLocal();
      return bookmarks;
    } catch (error) {
      console.error('Failed to load doa bookmarks', error);
      return rejectWithValue('Failed to load doa bookmarks');
    }
  }
)

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

const doasSlice = createSlice({
  name: 'doas',
  initialState,
  reducers: {
    addBookmark: (state, action: PayloadAction<DoaBookmark>) => {
      state.bookmarks.push(action.payload);
      saveDoaBookmarksToLocal(state.bookmarks)
    },
    removeBookmark: (state, action: PayloadAction<DoaBookmark>) => {
      state.bookmarks = state.bookmarks.filter(
        (bookmark) =>
          bookmark.doaTitle !== action.payload.doaTitle 
      );
      saveDoaBookmarksToLocal(state.bookmarks)
    }
  },
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
      })
      .addCase(loadBookmarks.fulfilled, (state, action) => {
        state.bookmarks = action.payload
      })
      .addCase(loadBookmarks.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { addBookmark, removeBookmark } = doasSlice.actions;

export default doasSlice.reducer;
