// redux/actions/quranActions.ts
import { SET_SURAHS, SET_SURAH_DETAILS, SET_TRANSLATION_DETAILS, SET_LOADING, SET_ERROR } from '../actionTypes/quranActionTypes';
import { AppDispatch } from '../store/store';
import { fetchSurahs, fetchSurahText } from '../../api/surahs';
import { Surah, SurahDetails, TranslationDetails } from '../../hooks/useLoadQuranData';

export const setSurahs = (surahs: Surah[]) => ({
  type: SET_SURAHS,
  payload: surahs,
});

export const setSurahDetails = (details: { [key: number]: SurahDetails }) => ({
  type: SET_SURAH_DETAILS,
  payload: details,
});

export const setTranslationDetails = (details: { [key: number]: TranslationDetails }) => ({
  type: SET_TRANSLATION_DETAILS,
  payload: details,
});

export const setLoading = (isLoading: boolean) => ({
  type: SET_LOADING,
  payload: isLoading,
});

export const setError = (error: string | null) => ({
  type: SET_ERROR,
  payload: error,
});

export const fetchQuranData = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const surahData = await fetchSurahs();
      const surahDetails: { [key: number]: SurahDetails } = {};
      const translationDetails: { [key: number]: TranslationDetails } = {};

      for (const surah of surahData.data) {
        try {

          const [surahTextResponse, translationTextResponse] = await Promise.all([
            fetchSurahText(surah.number, 'ar.alafasy'),
            fetchSurahText(surah.number, 'en.asad'),
          ]);
          
          surahDetails[surah.number] = surahTextResponse.data;
          translationDetails[surah.number] = translationTextResponse.data;
        } catch (error) {
          console.error(`Failed to fetch surah ${surah.number}: `, error);
          throw new Error(`Failed to fetch surah ${surah.number}`);
        }
      }

      dispatch(setSurahs(surahData.data));
      dispatch(setSurahDetails(surahDetails));
      dispatch(setTranslationDetails(translationDetails));
    } catch (error) {
      console.error('Failed to fetch Quran data', error);
      dispatch(setError('Failed to fetch Quran data'));
    } finally {
      dispatch(setLoading(false));
    }
  };
};
