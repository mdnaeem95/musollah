import { Dispatch } from 'redux';
import { fetchSurahs } from '../../api/firebase/index';
import { SET_SURAHS, SET_LOADING, SET_ERROR } from '../actionTypes/quranActionTypes';

export const fetchSurahsData = () => async (dispatch: Dispatch) => {
  dispatch({ type: SET_LOADING, payload: true });

  try {
    const surahData = await fetchSurahs();

    dispatch({
      type: SET_SURAHS,
      payload: surahData,
    });
  } catch (error) {
    console.error("Failed to fetch surahs", error);
    dispatch({ type: SET_ERROR, payload: 'Failed to fetch surahs' });
  } finally {
    dispatch({ type: SET_LOADING, payload: false });
  }
};
