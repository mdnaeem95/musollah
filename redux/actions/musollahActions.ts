// redux/actions/musollahActions.ts
import { SET_BIDET_LOCATIONS, SET_MOSQUE_LOCATIONS, SET_MUSOLLAH_LOCATIONS, SET_LOADING, SET_ERROR } from '../actionTypes/musollahActionTypes';
import { AppDispatch } from '../store/store';
import { getBidetLocations, getMosqueLocations, getMusollahsLocations } from '../../api/firebase/index';
import { LocationObject } from 'expo-location';

export const setBidetLocations = (locations: any) => ({
  type: SET_BIDET_LOCATIONS,
  payload: locations,
});

export const setMosqueLocations = (locations: any) => ({
  type: SET_MOSQUE_LOCATIONS,
  payload: locations,
});

export const setMusollahLocations = (locations: any) => ({
  type: SET_MUSOLLAH_LOCATIONS,
  payload: locations,
});

export const setLoading = (isLoading: boolean) => ({
  type: SET_LOADING,
  payload: isLoading,
});

export const setError = (error: string | null) => ({
  type: SET_ERROR,
  payload: error,
});

export const fetchMusollahData = (userLocation: LocationObject) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
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

      dispatch(setBidetLocations(bidetData));
      dispatch(setMosqueLocations(mosqueData));
      dispatch(setMusollahLocations(musollahData));
    } catch (error) {
      console.error('Failed to fetch locations', error);
      dispatch(setError('Failed to fetch locations'));
    } finally {
      dispatch(setLoading(false));
    }
  };
};
