import { SET_PRAYER_TIMES, SET_ISLAMIC_DATE, SET_CURRENT_PRAYER, SET_NEXT_PRAYER_INFO, SET_PRAYER_LOADING, SET_PRAYER_ERROR, SET_SELECTED_DATE } from '../actionTypes/prayerTimesActionTypes';
import { AppDispatch } from '../store/store';
import { getShortFormattedDate, formatIslamicDate, getPrayerTimesInfo } from '../../utils/index';
import { fetchPrayerTimes, fetchIslamicDate, fetchTimesByDate } from '../../api/prayers';

export const setPrayerTimes = (prayerTimes: any) => ({
  type: SET_PRAYER_TIMES,
  payload: prayerTimes,
});

export const setIslamicDate = (islamicDate: string) => ({
  type: SET_ISLAMIC_DATE,
  payload: islamicDate,
});

export const setCurrentPrayer = (currentPrayer: string) => ({
  type: SET_CURRENT_PRAYER,
  payload: currentPrayer,
});

export const setNextPrayerInfo = (nextPrayerInfo: any) => ({
  type: SET_NEXT_PRAYER_INFO,
  payload: nextPrayerInfo,
});

export const setLoading = (isLoading: boolean) => ({
  type: SET_PRAYER_LOADING,
  payload: isLoading,
});

export const setError = (error: string | null) => ({
  type: SET_PRAYER_ERROR,
  payload: error,
});

export const setSelectedDate = (date: string) => ({
  type: SET_SELECTED_DATE,
  payload: date,
})

export const fetchPrayerTimesData = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const currentDate = new Date();
      const shortFormattedDate = getShortFormattedDate(currentDate);

      const prayerData = await fetchPrayerTimes();
      const { Fajr, Dhuhr, Asr, Maghrib, Isha } = prayerData.data.timings;
      const newPrayerTimes = { Fajr, Dhuhr, Asr, Maghrib, Isha };

      const islamicDateData = await fetchIslamicDate(shortFormattedDate);
      const formattedIslamicDate = formatIslamicDate(islamicDateData.data.hijri.date);

      const prayerInfo = getPrayerTimesInfo(newPrayerTimes, currentDate);

      dispatch(setPrayerTimes(newPrayerTimes));
      dispatch(setIslamicDate(formattedIslamicDate));
      dispatch(setCurrentPrayer(prayerInfo.currentPrayer));
      dispatch(setNextPrayerInfo({
        nextPrayer: prayerInfo.nextPrayer,
        timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer,
      }));
    } catch (error) {
      console.error('Failed to fetch prayer times', error);
      dispatch(setError('Failed to fetch prayer times'));
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchPrayerTimesByDate = (date: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await fetchTimesByDate(date);
      const { Fajr, Dhuhr, Asr, Maghrib, Isha } = response.data.timings;
      const newPrayerTimes = { Fajr, Dhuhr, Asr, Maghrib, Isha };

      const islamicDateData = await fetchIslamicDate(date);
      const formattedIslamicDate = formatIslamicDate(islamicDateData.data.hijri.date);

      const prayerInfo = getPrayerTimesInfo(newPrayerTimes, new Date(date));

      dispatch(setPrayerTimes(newPrayerTimes));
      dispatch(setIslamicDate(formattedIslamicDate));
      dispatch(setCurrentPrayer(prayerInfo.currentPrayer));
      dispatch(setNextPrayerInfo({
        nextPrayer: prayerInfo.nextPrayer,
        timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer,
      }));
    } catch (error) {
      console.error(`Failed to fetch prayer times for ${date}: `, error)
      dispatch(setError('Failed to fetch prayer times'));
    } finally {
      dispatch(setLoading(false));
    }
  }
}