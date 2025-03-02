import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getShortFormattedDate, formatIslamicDate, getPrayerTimesInfo } from '../../utils/index';
import { fetchPrayerTimes, fetchIslamicDate, fetchTimesByDate, fetchPrayerTimesByLocation } from '../../api/prayers';
import { PrayerState } from '../../utils/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPrayerTimes2025 } from '../../api/firebase';
import { format, parse, subDays } from 'date-fns';

const PRAYER_TIMES_CACHE_KEY = 'prayerTimes2025Cache';

const initialState: PrayerState = {
  prayerTimes: null,
  islamicDate: null,
  currentPrayer: null,
  nextPrayerInfo: null,
  isLoading: true,
  error: null,
  selectedDate: null,
};

// Utility to cache the prayer data
const cachePrayerData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching prayer data: ', error);
  }
};

// Utility to retrieve cached prayer data
const getCachedPrayerData = async (key: string) => {
  try {
    const cachedData = await AsyncStorage.getItem(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error('Error fetching cache prayer data: ', error);
    return null;
  }
}

export const fetchPrayerTimesData = createAsyncThunk(
    'prayers/fetchPrayerTimesData',
    async (_, { rejectWithValue }) => {
      try {
        const currentDate = new Date();
        const shortFormattedDate = getShortFormattedDate(currentDate);

        // Check if prayer times for the current date are cached
        const cachedData = await getCachedPrayerData(`prayers_${shortFormattedDate}`)
        if (cachedData) {
          console.log('Using cached prayer data...');
          return cachedData;
        }
  
        const prayerData = await fetchPrayerTimes();
        const { Fajr: Subuh, Sunrise: Syuruk, Dhuhr: Zohor, Asr: Asar, Maghrib, Isha: Isyak } = prayerData.data.timings;
        const newPrayerTimes = { Subuh, Syuruk, Zohor, Asar, Maghrib, Isyak };
  
        const islamicDateData = await fetchIslamicDate(shortFormattedDate);
        const formattedIslamicDate = islamicDateData.hijriDate
  
        const prayerInfo = getPrayerTimesInfo(newPrayerTimes, currentDate);
  
        const result = {
          prayerTimes: newPrayerTimes,
          islamicDate: formattedIslamicDate,
          currentPrayer: prayerInfo.currentPrayer,
          nextPrayerInfo: {
            nextPrayer: prayerInfo.nextPrayer,
            timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer,
          },
        };

        // Cache the data to prevent future fetches
        await cachePrayerData(`prayers_${shortFormattedDate}`, result);

        return result;
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
      const { Fajr: Subuh, Sunrise: Syuruk, Dhuhr: Zohor, Asr: Asar, Maghrib, Isha: Isyak } = prayerData.data.timings;
      const newPrayerTimes = { Subuh, Syuruk, Zohor, Asar, Maghrib, Isyak };

      const shortFormattedDate = getShortFormattedDate(new Date(date));

      const islamicDateData = await fetchIslamicDate(shortFormattedDate);
      const formattedIslamicDate = islamicDateData.hijriDate

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

// Thunk to fetch prayer times from Firebase
export const fetchPrayerTimesFromFirebase = createAsyncThunk(
  'prayers/fetchPrayerTimesFromFirebase',
  async ({ inputDate }: { inputDate?: string } = {}, { rejectWithValue }) => {
    try {
      // Use today's date if inputDate is not provided
      const today = new Date();
      const parsedDate = inputDate
        ? parse(inputDate, 'd/M/yyyy', new Date())
        : today;

      if (isNaN(parsedDate.getTime())) {
        throw new Error(`❌ Error: Unable to parse date '${inputDate || 'undefined'}'`);
      }

      const firebaseFormattedDate = format(parsedDate, 'd/M/yyyy'); // Ensures correct format
      console.log("✅ Fetching Firebase prayer times for:", firebaseFormattedDate);

      // Check cache first
      const cacheKey = `prayers_firebase_${firebaseFormattedDate}`;
      // const cachedData = await getCachedPrayerData(cacheKey);
      // if (cachedData) {
      //   console.log("✅ Using cached Firebase prayer data...");
      //   return cachedData;
      // }

      // Fetch from Firestore
      const prayerTimesList = await fetchPrayerTimes2025();
      const todayPrayerData = prayerTimesList.find(pt => pt.date === firebaseFormattedDate);

      if (!todayPrayerData) {
        throw new Error(`❌ No prayer data found for ${firebaseFormattedDate}`);
      }

      console.log("🔍 Found prayer data:", todayPrayerData);

      // Construct prayer times object
      const newPrayerTimes = {
        Subuh: todayPrayerData.time.subuh,
        Syuruk: todayPrayerData.time.syuruk,
        Zohor: todayPrayerData.time.zohor,
        Asar: todayPrayerData.time.asar,
        Maghrib: todayPrayerData.time.maghrib,
        Isyak: todayPrayerData.time.isyak,
      };

      console.log("📌 Retrieved Prayer Times:", newPrayerTimes);

      // 🔹 Fetch Islamic Date (Minus One Day Fix)
      const shortFormattedDate = format(subDays(parsedDate, 1), 'dd-MM-yyyy');
      const islamicDateData = await fetchIslamicDate(shortFormattedDate);
      const formattedIslamicDate = formatIslamicDate(islamicDateData.data.hijri.date);

      // 🔹 Get Current & Next Prayer Info
      const prayerInfo = getPrayerTimesInfo(newPrayerTimes, parsedDate);

      // Final result
      const result = {
        prayerTimes: newPrayerTimes,
        islamicDate: formattedIslamicDate,
        currentPrayer: prayerInfo.currentPrayer,
        nextPrayerInfo: {
          nextPrayer: prayerInfo.nextPrayer,
          timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer,
        },
      };

      console.log("🔹 Complete Prayer Data:", result);

      // Cache the result
      await cachePrayerData(cacheKey, result);
      return result;
    } catch (error) {
      console.error("❌ Error fetching prayer times from Firebase:", error);
      return rejectWithValue("Failed to fetch prayer times from Firebase");
    }
  }
);

// New Thunk to fetch prayer times based on user's location
export const fetchPrayerTimesByLocationData = createAsyncThunk(
  'prayers/fetchPrayerTimesByLocation',
  async ({ latitude, longitude }: { latitude: number, longitude: number }, { rejectWithValue }) => {
    try {
      const shortFormattedDate = getShortFormattedDate(new Date());
      console.log(shortFormattedDate)

      // Check if prayer times for the current location and date are cached
      const cacheKey = `prayers_${latitude}_${longitude}_${shortFormattedDate}`;
      const cachedData = await getCachedPrayerData(cacheKey);
      if (cachedData) {
        console.log('Using cached prayer data for location...');
        return cachedData;
      }

      const prayerData = await fetchPrayerTimesByLocation(latitude, longitude);
        const { Fajr: Subuh, Sunrise: Syuruk, Dhuhr: Zohor, Asr: Asar, Maghrib, Isha: Isyak } = prayerData.data.timings;
        const newPrayerTimes = { Subuh, Syuruk, Zohor, Asar, Maghrib, Isyak };

      const islamicDateData = await fetchIslamicDate(shortFormattedDate);
      const formattedIslamicDate = islamicDateData.hijriDate

      const prayerInfo = getPrayerTimesInfo(newPrayerTimes, new Date());

      const result = {
        prayerTimes: newPrayerTimes,
        islamicDate: formattedIslamicDate,
        currentPrayer: prayerInfo.currentPrayer,
        nextPrayerInfo: {
          nextPrayer: prayerInfo.nextPrayer,
          timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer,
        },
      };

      // Cache the data to prevent future fetches
      await cachePrayerData(cacheKey, result);

      return result;
    } catch (error) {
      return rejectWithValue('Failed to fetch prayer times by location');
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
      })
      .addCase(fetchPrayerTimesByLocationData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPrayerTimesByLocationData.fulfilled, (state, action) => {
        console.log("🟢 Redux: Updating state with prayer times", action.payload);
        state.prayerTimes = action.payload.prayerTimes;
        state.islamicDate = action.payload.islamicDate;
        state.currentPrayer = action.payload.currentPrayer;
        state.nextPrayerInfo = action.payload.nextPrayerInfo;
        state.isLoading = false;
      })
      .addCase(fetchPrayerTimesByLocationData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPrayerTimesFromFirebase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPrayerTimesFromFirebase.fulfilled, (state, action) => {
        state.prayerTimes = action.payload.prayerTimes;
        state.islamicDate = action.payload.islamicDate;
        state.currentPrayer = action.payload.currentPrayer;
        state.nextPrayerInfo = action.payload.nextPrayerInfo;
        state.isLoading = false;
      })
      .addCase(fetchPrayerTimesFromFirebase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedDate } = prayerSlice.actions;
export default prayerSlice.reducer;