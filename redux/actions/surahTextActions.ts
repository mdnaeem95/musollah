import axios from 'axios';
import { Dispatch } from 'redux';
import { SurahTextActionTypes, SET_SURAH_TEXT, SET_LOADING, SET_ERROR } from '../actionTypes/surahTextActionTypes';
import { RootState } from '../store/store';

const CHUNK_SIZE = 20;

const fetchSurahText = async (surahNumber: number) => {
  const response = await axios.get(`http://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`);
  return response.data.data;
};

const fetchSurahTextsInChunks = async (start: number, end: number, dispatch: Dispatch) => {
  for (let i = start; i <= end; i++) {
    try {
      const arabicText = await fetchSurahText(i);
      dispatch({
        type: SET_SURAH_TEXT,
        payload: { surahNumber: i, text: arabicText },
      });
      console.log(`Successfully fetched Surah ${i}`);
    } catch (error) {
      console.error(`Failed to fetch Surah ${i}`, error);
    }
  }
};

export const fetchAllSurahTexts = () => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    dispatch({ type: SET_LOADING, payload: true });

    const totalSurahs = 114;
    const totalChunks = Math.ceil(totalSurahs / CHUNK_SIZE);

    for (let chunk = 0; chunk < totalChunks; chunk++) {
      const start = chunk * CHUNK_SIZE + 1;
      const end = Math.min((chunk + 1) * CHUNK_SIZE, totalSurahs);
      console.log(`Fetching chunk ${chunk + 1}/${totalChunks}...`);

      await fetchSurahTextsInChunks(start, end, dispatch);
    }

    dispatch({ type: SET_LOADING, payload: false });
  };
};
