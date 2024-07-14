import { SET_SURAHS, SET_LOADING, SET_ERROR } from '../actionTypes/quranActionTypes';

interface QuranState {
  surahs: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: QuranState = {
  surahs: [],
  isLoading: false,
  error: null,
};

const quranReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_SURAHS:
      return { ...state, surahs: action.payload };
    case SET_LOADING:
      return { ...state, isLoading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export default quranReducer;
