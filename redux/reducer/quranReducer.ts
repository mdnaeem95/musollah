import { SET_SURAHS, SET_SURAH_DETAILS, SET_TRANSLATION_DETAILS, SET_LOADING, SET_ERROR } from '../actionTypes/quranActionTypes';
import { Surah, SurahDetails, TranslationDetails } from '../../hooks/useLoadQuranData';

interface QuranState {
  surahs: Surah[];
  surahDetails: { [key: number]: SurahDetails };
  translationDetails: { [key: number]: TranslationDetails };
  isLoading: boolean;
  error: string | null;
}

const initialState: QuranState = {
  surahs: [],
  surahDetails: {},
  translationDetails: {},
  isLoading: true,
  error: null,
};

const quranReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_SURAHS:
      return { ...state, surahs: action.payload };
    case SET_SURAH_DETAILS:
      return { ...state, surahDetails: action.payload };
    case SET_TRANSLATION_DETAILS:
      return { ...state, translationDetails: action.payload };
    case SET_LOADING:
      return { ...state, isLoading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export default quranReducer;
