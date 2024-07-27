import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getShortFormattedDate, formatIslamicDate, getPrayerTimesInfo } from '../../utils/index';
import { fetchPrayerTimes, fetchIslamicDate, fetchTimesByDate } from '../../api/prayers';
import { PrayerTimes } from '../../app/(tabs)/(prayer)';

interface PrayerState {
  prayerTimes: PrayerTimes | null;
  islamicDate: string | null;
  currentPrayer: string | null;
  nextPrayerInfo: { nextPrayer: string | null, timeUntilNextPrayer: string | null } | null;
  isLoading: boolean;
  error: string | null;
  selectedDate: string | null;
}

const initialState: PrayerState = {
  prayerTimes: null,
  islamicDate: null,
  currentPrayer: null,
  nextPrayerInfo: null,
  isLoading: true,
  error: null,
  selectedDate: null,
};

export const fetchPrayerTimesData = createAsyncThunk(
    'prayers/fetchPrayerTimesData',
    async (_, { rejectWithValue }) => {
      try {
        const currentDate = new Date();
        const shortFormattedDate = getShortFormattedDate(currentDate);
  
        const prayerData = await fetchPrayerTimes();
        const { Fajr, Dhuhr, Asr, Maghrib, Isha } = prayerData.data.timings;
        const newPrayerTimes = { Fajr, Dhuhr, Asr, Maghrib, Isha };
  
        const islamicDateData = await fetchIslamicDate(shortFormattedDate);
        const formattedIslamicDate = formatIslamicDate(islamicDateData.data.hijri.date);
  
        const prayerInfo = getPrayerTimesInfo(newPrayerTimes, currentDate);
  
        return {
          prayerTimes: newPrayerTimes,
          islamicDate: formattedIslamicDate,
          currentPrayer: prayerInfo.currentPrayer,
          nextPrayerInfo: {
            nextPrayer: prayerInfo.nextPrayer,
            timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer,
          },
        };
      } catch (error) {
        return rejectWithValue('Failed to fetch prayer times');
      }
    }
  );

  export const fetchPrayerTimesByDate = createAsyncThunk(
    'prayers/fetchPrayerTimesByDate',
    async (date: string, { rejectWithValue }) => {
      try {
        const prayerData = await fetchTimesByDate(date);
        const { Fajr, Dhuhr, Asr, Maghrib, Isha } = prayerData.data.timings;
        const newPrayerTimes = { Fajr, Dhuhr, Asr, Maghrib, Isha };

        const shortFormattedDate = getShortFormattedDate(new Date(date));
  
        const islamicDateData = await fetchIslamicDate(shortFormattedDate);
        const formattedIslamicDate = formatIslamicDate(islamicDateData.data.hijri.date);
  
        const prayerInfo = getPrayerTimesInfo(newPrayerTimes, new Date(date));
  
        return {
          prayerTimes: newPrayerTimes,
          islamicDate: formattedIslamicDate,
          currentPrayer: prayerInfo.currentPrayer,
          nextPrayerInfo: {
            nextPrayer: prayerInfo.nextPrayer,
            timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer,
          },
          selectedDate: date,
        };
      } catch (error) {
        return rejectWithValue('Failed to fetch prayer times by date');
      }
    }
  );

  const prayerSlice = createSlice({
    name: 'prayers',
    initialState,
    reducers: {
      setSelectedDate(state, action) {
        state.selectedDate = action.payload;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchPrayerTimesData.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(fetchPrayerTimesData.fulfilled, (state, action) => {
          state.prayerTimes = action.payload.prayerTimes;
          state.islamicDate = action.payload.islamicDate;
          state.currentPrayer = action.payload.currentPrayer;
          state.nextPrayerInfo = action.payload.nextPrayerInfo;
          state.isLoading = false;
        })
        .addCase(fetchPrayerTimesData.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload as string;
        })
        .addCase(fetchPrayerTimesByDate.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(fetchPrayerTimesByDate.fulfilled, (state, action) => {
          state.prayerTimes = action.payload.prayerTimes;
          state.islamicDate = action.payload.islamicDate;
          state.currentPrayer = action.payload.currentPrayer;
          state.nextPrayerInfo = action.payload.nextPrayerInfo;
          state.selectedDate = action.payload.selectedDate;
          state.isLoading = false;
        })
        .addCase(fetchPrayerTimesByDate.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload as string;
        });
    },
  });
  
  export const { setSelectedDate } = prayerSlice.actions;
  export default prayerSlice.reducer;