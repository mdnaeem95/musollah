import { SET_PRAYER_TIMES, SET_ISLAMIC_DATE, SET_CURRENT_PRAYER, SET_NEXT_PRAYER_INFO, SET_PRAYER_LOADING, SET_PRAYER_ERROR } from '../actionTypes/prayerTimesActionTypes';

interface PrayerState {
  prayerTimes: { [key: string]: string } | null;
  islamicDate: string | null;
  currentPrayer: string | null;
  nextPrayerInfo: { nextPrayer: string | null, timeUntilNextPrayer: string | null } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PrayerState = {
  prayerTimes: null,
  islamicDate: null,
  currentPrayer: null,
  nextPrayerInfo: null,
  isLoading: true,
  error: null,
};

const prayerReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_PRAYER_TIMES:
      return { ...state, prayerTimes: action.payload };
    case SET_ISLAMIC_DATE:
      return { ...state, islamicDate: action.payload };
    case SET_CURRENT_PRAYER:
      return { ...state, currentPrayer: action.payload };
    case SET_NEXT_PRAYER_INFO:
      return { ...state, nextPrayerInfo: action.payload };
    case SET_PRAYER_LOADING:
      return { ...state, isLoading: action.payload };
    case SET_PRAYER_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export default prayerReducer;
