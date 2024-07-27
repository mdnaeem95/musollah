import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';

interface LocationState {
  userLocation: LocationObject | null;
  errorMsg: string | null;
  isLoading: boolean;
}

const initialState: LocationState = {
  userLocation: null,
  errorMsg: null,
  isLoading: true,
};

export const fetchUserLocation = createAsyncThunk<LocationObject, void, { rejectValue: string }>(
  'location/fetchUserLocation',
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(setLoading(true));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const errorMsg = 'Permission to access location was denied';
        dispatch(setErrorMessage(errorMsg));
        dispatch(setLoading(false));
        return rejectWithValue(errorMsg);
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      if (!userLocation) {
        const errorMsg = 'Failed to get user location';
        dispatch(setErrorMessage(errorMsg));
        dispatch(setLoading(false));
        return rejectWithValue(errorMsg);
      }

      dispatch(setUserLocation(userLocation));

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (newLocation) => {
          if (newLocation) {
            dispatch(setUserLocation(newLocation));
          }
        }
      );

      return userLocation;
    } catch (error) {
      const errorMsg = 'Failed to fetch user location';
      console.error(errorMsg, error);
      dispatch(setErrorMessage(errorMsg));
      return rejectWithValue(errorMsg);
    } finally {
      dispatch(setLoading(false));
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
        state.isLoading = false;
      });
  },
});

export const { setUserLocation, setErrorMessage, setLoading } = userLocationSlice.actions;
export default userLocationSlice.reducer;
