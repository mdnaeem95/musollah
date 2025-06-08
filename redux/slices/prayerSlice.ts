// redux/slices/prayerSlice.ts
import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import { Platform } from 'react-native';
import { ExtensionStorage } from "@bacons/apple-targets";

import { prayerService } from '../../services/prayer.service';
import { analyticsService } from '../../services/analytics/service';
import {
  DailyPrayerTimes,
  PrayerLog,
  PrayerStats,
} from '../../utils/types/prayer.types';
import { DATE_FORMATS } from '../../constants/prayer.constants';
import { RootState } from '../store/store';
import { getPrayerTimesInfo } from '../../utils';

// Widget storage for iOS
const widgetStorage = Platform.OS === 'ios' 
  ? new ExtensionStorage("group.com.rihlah.prayerTimesWidget")
  : null;

// State interface
interface PrayerState {
  // Current prayer times
  currentDate: string;
  dailyPrayerTimes: DailyPrayerTimes | null;
  
  // Prayer logs
  prayerLogs: Record<string, PrayerLog>; // Normalized by date
  
  // Monthly data
  monthlyPrayerTimes: Record<string, DailyPrayerTimes[]>; // Cached by "year-month"
  
  // Statistics
  stats: PrayerStats | null;
  
  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Location
  currentLocation: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  } | null;
}

const initialState: PrayerState = {
  currentDate: format(new Date(), DATE_FORMATS.API),
  dailyPrayerTimes: null,
  prayerLogs: {},
  monthlyPrayerTimes: {},
  stats: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
  currentLocation: null,
};

// Async thunks
export const fetchPrayerTimesForDate = createAsyncThunk(
  'prayer/fetchForDate',
  async (date: string, { rejectWithValue }) => {
    try {
      const prayerTimes = await prayerService.fetchPrayerTimesForDate(date);
      
      // Update widget if on iOS
      if (widgetStorage && Platform.OS === 'ios') {
        await widgetStorage.set('prayerTimes', JSON.stringify(prayerTimes.prayers));
        ExtensionStorage.reloadWidget();
      }
      
      // Track analytics
      analyticsService.trackEvent('prayer_times_fetched', {
        date,
        source: 'manual',
      });
      
      return prayerTimes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch prayer times');
    }
  }
);

export const fetchPrayerTimesByLocation = createAsyncThunk(
  'prayer/fetchByLocation',
  async (
    { latitude, longitude }: { latitude: number; longitude: number },
    { rejectWithValue }
  ) => {
    try {
      const prayerTimes = await prayerService.fetchPrayerTimesByLocation(
        latitude,
        longitude
      );
      
      // Track analytics
      analyticsService.trackEvent('prayer_times_location_fetched', {
        latitude,
        longitude,
      });
      
      return { prayerTimes, location: { latitude, longitude } };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch prayer times by location');
    }
  }
);

export const fetchMonthlyPrayerTimes = createAsyncThunk(
  'prayer/fetchMonthly',
  async (
    { year, month }: { year: number; month: number },
    { rejectWithValue }
  ) => {
    try {
      const monthlyData = await prayerService.fetchMonthlyPrayerTimes(year, month);
      return { key: `${year}-${month}`, data: monthlyData };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch monthly prayer times');
    }
  }
);

export const savePrayerLog = createAsyncThunk(
  'prayer/saveLog',
  async (
    log: { userId: string; date: string; prayers: PrayerLog['prayers'] },
    { rejectWithValue }
  ) => {
    try {
      await prayerService.savePrayerLog(log);
      
      // Track analytics
      const completedCount = Object.values(log.prayers).filter(Boolean).length;
      analyticsService.trackEvent('prayer_logged', {
        date: log.date,
        completedCount,
        prayers: log.prayers,
      });
      
      return log;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save prayer log');
    }
  }
);

export const fetchPrayerLog = createAsyncThunk(
  'prayer/fetchLog',
  async (
    { userId, date }: { userId: string; date: string },
    { rejectWithValue }
  ) => {
    try {
      const log = await prayerService.fetchPrayerLog(userId, date);
      return { date, log };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch prayer log');
    }
  }
);

export const fetchPrayerStats = createAsyncThunk(
  'prayer/fetchStats',
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { prayerLogs } = state.prayer;
      
      // Calculate stats from logs
      const logs = Object.values(prayerLogs).filter(log => log.userId === userId);
      
      let totalPrayers = 0;
      let completedPrayers = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      // Sort logs by date
      const sortedLogs = logs.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      sortedLogs.forEach(log => {
        const dayPrayers = Object.keys(log.prayers).length;
        const dayCompleted = Object.values(log.prayers).filter(Boolean).length;
        
        totalPrayers += dayPrayers;
        completedPrayers += dayCompleted;
        
        // Calculate streaks
        if (dayCompleted === dayPrayers) {
          tempStreak++;
          currentStreak = tempStreak;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });
      
      const stats: PrayerStats = {
        totalPrayers,
        completedPrayers,
        currentStreak,
        longestStreak,
        completionRate: totalPrayers > 0 
          ? Math.round((completedPrayers / totalPrayers) * 100) 
          : 0,
      };
      
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to calculate prayer stats');
    }
  }
);

// Slice
const prayerSlice = createSlice({
  name: 'prayer',
  initialState,
  reducers: {
    setCurrentDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
    },
    
    setLocation: (state, action: PayloadAction<PrayerState['currentLocation']>) => {
      state.currentLocation = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetPrayerState: () => initialState,
  },
  
  extraReducers: (builder) => {
    // Fetch prayer times for date
    builder
      .addCase(fetchPrayerTimesForDate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPrayerTimesForDate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyPrayerTimes = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchPrayerTimesForDate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Fetch by location
    builder
      .addCase(fetchPrayerTimesByLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPrayerTimesByLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyPrayerTimes = action.payload.prayerTimes;
        state.currentLocation = {
          ...action.payload.location,
          city: action.payload.prayerTimes.location?.city || 'Unknown',
          country: action.payload.prayerTimes.location?.country || 'Unknown',
        };
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchPrayerTimesByLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Monthly prayer times
    builder
      .addCase(fetchMonthlyPrayerTimes.fulfilled, (state, action) => {
        state.monthlyPrayerTimes[action.payload.key] = action.payload.data;
      });
    
    // Prayer logs
    builder
      .addCase(savePrayerLog.fulfilled, (state, action) => {
        const { date, prayers, userId } = action.payload;
        state.prayerLogs[date] = {
          userId,
          date,
          prayers,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
      .addCase(fetchPrayerLog.fulfilled, (state, action) => {
        if (action.payload.log) {
          state.prayerLogs[action.payload.date] = action.payload.log;
        }
      });
    
    // Stats
    builder
      .addCase(fetchPrayerStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

// Actions
export const { setCurrentDate, setLocation, clearError, resetPrayerState } = prayerSlice.actions;

// Selectors
export const selectPrayerState = (state: RootState) => state.prayer;

export const selectDailyPrayerTimes = (state: RootState) => 
  state.prayer.dailyPrayerTimes;

export const selectPrayerLog = (date: string) => (state: RootState) =>
  state.prayer.prayerLogs[date] || null;

export const selectMonthlyPrayerTimes = (year: number, month: number) => (state: RootState) =>
  state.prayer.monthlyPrayerTimes[`${year}-${month}`] || [];

export const selectCurrentPrayerInfo = createSelector(
  [selectDailyPrayerTimes],
  (dailyPrayerTimes) => {
    if (!dailyPrayerTimes) return null;
    
    return getPrayerTimesInfo(dailyPrayerTimes.prayers, new Date());
  }
);

export const selectPrayerStats = (state: RootState) => state.prayer.stats;

export const selectIsLoading = (state: RootState) => state.prayer.isLoading;

export const selectError = (state: RootState) => state.prayer.error;

export default prayerSlice.reducer;