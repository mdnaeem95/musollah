import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { LocationObject } from 'expo-location';
import { getBidetLocations, getMosqueLocations, getMusollahsLocations } from '../../api/firebase/index';
import { MusollahState } from '../../utils/types';

const initialState: MusollahState = {
  bidetLocations: [],
  mosqueLocations: [],
  musollahLocations: [],
  isLoading: false,
  error: null,
};

export const fetchMusollahData = createAsyncThunk(
  'musollah/fetchMusollahData',
  async (userLocation: LocationObject, { rejectWithValue }) => {
    try {
      const region = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      const [bidetData, mosqueData, musollahData] = await Promise.all([
        getBidetLocations(region),
        getMosqueLocations(region),
        getMusollahsLocations(region),
      ]);

      return { bidetData, mosqueData, musollahData };
    } catch (error) {
      console.error('Failed to fetch locations', error);
      return rejectWithValue('Failed to fetch locations');
    }
  }
);

const musollahSlice = createSlice({
  name: 'musollah',
  initialState,
  reducers: {
    setBidetLocations(state, action) {
      state.bidetLocations = action.payload;
    },
    setMosqueLocations(state, action) {
      state.mosqueLocations = action.payload;
    },
    setMusollahLocations(state, action) {
      state.musollahLocations = action.payload;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMusollahData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMusollahData.fulfilled, (state, action) => {
        state.bidetLocations = action.payload.bidetData;
        state.mosqueLocations = action.payload.mosqueData;
        state.musollahLocations = action.payload.musollahData;
        state.isLoading = false;
      })
      .addCase(fetchMusollahData.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

export const { setBidetLocations, setMosqueLocations, setMusollahLocations, setLoading, setError } = musollahSlice.actions;
export default musollahSlice.reducer;
