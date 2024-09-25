import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';
import { LocationState } from '../../utils/types';

// Define a default location in central Singapore (e.g., Marina Bay Sands)
const DEFAULT_LOCATION: LocationObject = {
  coords: {
    latitude: 1.2831,
    longitude: 103.8603,
    altitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    altitudeAccuracy: null,
  },
  timestamp: new Date().getTime(),
};

const initialState: LocationState = {
  userLocation: null,
  errorMsg: null,
  isLoading: true,
};

export const fetchUserLocation = createAsyncThunk<LocationObject, void, { rejectValue: string }>(
  'location/fetchUserLocation',
  async (_, { rejectWithValue }) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        const errorMsg = 'Permission to access location was denied';
        console.warn(errorMsg);
        return rejectWithValue(errorMsg);
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      if (!userLocation) {
        const errorMsg = 'Failed to get user location';
        console.error(errorMsg);
        return rejectWithValue(errorMsg);
      }

      return userLocation;
    } catch (error) {
      const errorMsg = 'Failed to fetch user location';
      console.error(errorMsg, error);
      return rejectWithValue(errorMsg);
    } 
  }
);

const userLocationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setUserLocation(state, action) {
      state.userLocation = action.payload;
    },
    setErrorMessage(state, action) {
      state.errorMsg = action.payload;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserLocation.pending, (state) => {
        state.isLoading = true;
        state.errorMsg = null;
      })
      .addCase(fetchUserLocation.fulfilled, (state, action) => {
        state.userLocation = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUserLocation.rejected, (state, action) => {
        state.errorMsg = action.payload as string;
        state.userLocation = DEFAULT_LOCATION;
        state.isLoading = false;
      });
  },
});

export const { setUserLocation, setErrorMessage, setLoading } = userLocationSlice.actions;
export default userLocationSlice.reducer;
