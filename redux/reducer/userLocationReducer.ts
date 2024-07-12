// redux/reducer/locationReducer.ts
import { SET_USER_LOCATION, SET_ERROR_MESSAGE, SET_LOADING } from '../actionTypes/userLocationActionTypes';
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

  const locationReducer = (state = initialState, action: any) => {
    switch (action.type) {
      case SET_USER_LOCATION:
        return { ...state, userLocation: action.payload };
      case SET_ERROR_MESSAGE:
        return { ...state, errorMsg: action.payload };
      case SET_LOADING:
        return { ...state, isLoading: action.payload };
      default:
        return state;
    }
  };
  
  export default locationReducer;