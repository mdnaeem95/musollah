import { SET_BIDET_LOCATIONS, SET_MOSQUE_LOCATIONS, SET_MUSOLLAH_LOCATIONS, SET_LOADING, SET_ERROR } from '../actionTypes/musollahActionTypes';

interface MusollahState {
  bidetLocations: any[];
  mosqueLocations: any[];
  musollahLocations: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MusollahState = {
  bidetLocations: [],
  mosqueLocations: [],
  musollahLocations: [],
  isLoading: false,
  error: null,
};

const musollahReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_BIDET_LOCATIONS:
      return { ...state, bidetLocations: action.payload };
    case SET_MOSQUE_LOCATIONS:
      return { ...state, mosqueLocations: action.payload };
    case SET_MUSOLLAH_LOCATIONS:
      return { ...state, musollahLocations: action.payload };
    case SET_LOADING:
      return { ...state, isLoading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export default musollahReducer;
