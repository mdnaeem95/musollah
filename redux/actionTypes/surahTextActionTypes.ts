export const SET_SURAH_TEXT = 'SET_SURAH_TEXT';
export const SET_LOADING = 'SET_LOADING';
export const SET_ERROR = 'SET_ERROR';

export interface SetSurahTextAction {
  type: typeof SET_SURAH_TEXT;
  payload: { surahNumber: number; text: any };
}

export interface SetLoadingAction {
  type: typeof SET_LOADING;
  payload: boolean;
}

export interface SetErrorAction {
  type: typeof SET_ERROR;
  payload: string;
}

export type SurahTextActionTypes = SetSurahTextAction | SetLoadingAction | SetErrorAction;
