import { SET_USER_LOCATION, SET_ERROR_MESSAGE, SET_LOADING } from "../actionTypes/userLocationActionTypes";
import * as Location from 'expo-location'
import { AppDispatch } from "../store/store";

export const setUserLocation = (userLocation: Location.LocationObject | null) => ({
    type: SET_USER_LOCATION, 
    payload: userLocation,
})

export const setErrorMessage = (message: string | null) => ({
    type: SET_ERROR_MESSAGE, 
    payload: message,
})

export const setLoading = (isLoading: boolean) => ({
    type: SET_LOADING, 
    payload: isLoading,
})

export const fetchUserLocation = () => {
    return async (dispatch: AppDispatch) => {
        dispatch(setLoading(true));
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                dispatch(setErrorMessage('Permission to access location was denied'));
                dispatch(setLoading(false));
                return;
            }

            let userLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            dispatch(setUserLocation(userLocation));

            Location.watchPositionAsync({
                accuracy: Location.Accuracy.High,
                timeInterval: 10000,
                distanceInterval: 10
            },
            (newLocation) => {
                dispatch(setUserLocation(newLocation));
            }
        )
        } catch (error) {
            console.error('Failed to fetch user location', error);
            dispatch(setErrorMessage('Failed to fetch user location'));
        } finally {
            dispatch(setLoading(false));
        }
    }
}