import { SurahTextActionTypes, SET_SURAH_TEXT, SET_LOADING, SET_ERROR } from '../actionTypes/surahTextActionTypes';

interface SurahTextState {
  surahDetails: { [key: number]: any };
  isLoading: boolean;
  error: string | null;
}

const initialState: SurahTextState = {
  surahDetails: {},
  isLoading: false,
  error: null,
};

const surahTextReducer = (state = initialState, action: SurahTextActionTypes): SurahTextState => {
  switch (action.type) {
    case SET_SURAH_TEXT:
      return {
        ...state,
        surahDetails: {
          ...state.surahDetails,
          [action.payload.surahNumber]: action.payload.text,
        },
      };
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default surahTextReducer;
