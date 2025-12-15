import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, eachDayOfInterval } from 'date-fns';
import { Platform } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';
import firestore, { doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { cache, TTL } from '../../client/storage';
import { db } from '../../client/firebase';

// Widget storage for iOS
const widgetStorage = Platform.OS === 'ios' 
  ? new ExtensionStorage("group.com.rihlah.prayerTimesWidget")
  : null;

// ============================================================================
// TYPES
// ============================================================================

export interface PrayerLog {
  userId: string;
  date: string; // YYYY-MM-DD format
  prayers: {
    Subuh: boolean;
    Zohor: boolean;
    Asar: boolean;
    Maghrib: boolean;
    Isyak: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PrayerStats {
  totalPrayers: number;
  completedPrayers: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // Percentage
}

export interface WeeklyLogs {
  [date: string]: PrayerLog['prayers'];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const PRAYER_LOG_QUERY_KEYS = {
  all: ['prayerLogs'] as const,
  user: (userId: string) => ['prayerLogs', userId] as const,
  daily: (userId: string, date: string) => ['prayerLogs', userId, date] as const,
  weekly: (userId: string, startDate: string, endDate: string) => 
    ['prayerLogs', userId, 'weekly', startDate, endDate] as const,
  stats: (userId: string) => ['prayerLogs', userId, 'stats'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchPrayerLog(userId: string, date: string): Promise<PrayerLog | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const userData = userSnap.data() as any;
    const prayers = userData?.prayerLogs?.[date];

    if (!prayers) return null;

    return {
      userId,
      date,
      prayers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error fetching prayer log:', error);
    return null;
  }
}

async function savePrayerLog(
  userId: string,
  date: string,
  prayers: PrayerLog['prayers']
): Promise<PrayerLog> {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      [`prayerLogs.${date}`]: prayers,
    });

    console.log('✅ Prayer log saved:', date);

    return {
      userId,
      date,
      prayers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error saving prayer log:', error);
    throw error;
  }
}

async function fetchWeeklyPrayerLogs(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WeeklyLogs> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    const userData = userSnap.exists() ? (userSnap.data() as any) : null;
    const prayerLogs = userData?.prayerLogs || {};

    const weeklyLogs: WeeklyLogs = {};

    const dateRange = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(endDate),
    });

    dateRange.forEach((date) => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      weeklyLogs[formattedDate] = prayerLogs[formattedDate] || {
        Subuh: false,
        Zohor: false,
        Asar: false,
        Maghrib: false,
        Isyak: false,
      };
    });

    return weeklyLogs;
  } catch (error) {
    console.error('❌ Error fetching weekly logs:', error);
    throw error;
  }
}

async function calculatePrayerStats(userId: string): Promise<PrayerStats> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    const userData = userSnap.exists() ? (userSnap.data() as any) : null;
    const prayerLogs = userData?.prayerLogs || {};

    let totalPrayers = 0;
    let completedPrayers = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedDates = Object.keys(prayerLogs).sort();

    sortedDates.forEach((date) => {
      const prayers = prayerLogs[date];
      const prayerNames = Object.keys(prayers);
      const completedCount = Object.values(prayers).filter(Boolean).length;

      totalPrayers += prayerNames.length;
      completedPrayers += completedCount;

      if (completedCount === prayerNames.length) {
        tempStreak++;
        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    return {
      totalPrayers,
      completedPrayers,
      currentStreak,
      longestStreak,
      completionRate: totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0,
    };
  } catch (error) {
    console.error('❌ Error calculating stats:', error);
    throw error;
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

export function useTodayPrayerLog(userId: string | null) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: PRAYER_LOG_QUERY_KEYS.daily(userId!, today),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      
      const cacheKey = `prayer-log-${userId}-${today}`;
      const cached = cache.get<PrayerLog>(cacheKey);
      
      if (cached) {
        console.log('⚡ Using cached prayer log');
        return cached;
      }
      
      console.log('🌐 Fetching prayer log from Firestore');
      const log = await fetchPrayerLog(userId, today);
      
      if (log) {
        cache.set(cacheKey, log, TTL.ONE_DAY);
      }
      
      return log;
    },
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.ONE_DAY,
    enabled: !!userId,
  });
}

export function usePrayerLog(userId: string | null, date: string) {
  return useQuery({
    queryKey: PRAYER_LOG_QUERY_KEYS.daily(userId!, date),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      
      const cacheKey = `prayer-log-${userId}-${date}`;
      const cached = cache.get<PrayerLog>(cacheKey);
      
      if (cached) {
        console.log('⚡ Using cached prayer log');
        return cached;
      }
      
      const log = await fetchPrayerLog(userId, date);
      
      if (log) {
        cache.set(cacheKey, log, TTL.ONE_DAY);
      }
      
      return log;
    },
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.ONE_DAY,
    enabled: !!userId && !!date,
  });
}

export function useWeeklyPrayerLogs(
  userId: string | null,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: PRAYER_LOG_QUERY_KEYS.weekly(userId!, startDate, endDate),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      
      console.log('🌐 Fetching weekly prayer logs');
      return await fetchWeeklyPrayerLogs(userId, startDate, endDate);
    },
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.ONE_HOUR,
    enabled: !!userId && !!startDate && !!endDate,
  });
}

export function usePrayerStats(userId: string | null) {
  return useQuery({
    queryKey: PRAYER_LOG_QUERY_KEYS.stats(userId!),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      
      const cacheKey = `prayer-stats-${userId}`;
      const cached = cache.get<PrayerStats>(cacheKey);
      
      if (cached) {
        console.log('⚡ Using cached prayer stats');
        return cached;
      }
      
      console.log('🌐 Calculating prayer stats');
      const stats = await calculatePrayerStats(userId);
      
      cache.set(cacheKey, stats, TTL.FIFTEEN_MINUTES);
      
      return stats;
    },
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.FIFTEEN_MINUTES,
    enabled: !!userId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useSavePrayerLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      date,
      prayers,
    }: {
      userId: string;
      date: string;
      prayers: PrayerLog['prayers'];
    }) => {
      return await savePrayerLog(userId, date, prayers);
    },
    
    // Optimistic update
    onMutate: async ({ userId, date, prayers }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: PRAYER_LOG_QUERY_KEYS.daily(userId, date),
      });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(
        PRAYER_LOG_QUERY_KEYS.daily(userId, date)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        PRAYER_LOG_QUERY_KEYS.daily(userId, date),
        {
          userId,
          date,
          prayers,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      
      return { previous };
    },
    
    // Rollback on error
    onError: (err, { userId, date }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          PRAYER_LOG_QUERY_KEYS.daily(userId, date),
          context.previous
        );
      }
    },
    
    // Refetch and update cache
    onSuccess: (data, { userId, date }) => {
      console.log('✅ Prayer log saved successfully');
      
      // Update cache
      const cacheKey = `prayer-log-${userId}-${date}`;
      cache.set(cacheKey, data, TTL.ONE_DAY);
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: PRAYER_LOG_QUERY_KEYS.stats(userId),
      });
      
      // Track analytics
      const completedCount = Object.values(data.prayers).filter(Boolean).length;
      console.log(`📊 Logged ${completedCount}/5 prayers for ${date}`);
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useIsPrayerLogged(
  userId: string | null,
  prayerName: keyof PrayerLog['prayers']
) {
  const { data: log } = useTodayPrayerLog(userId);
  
  return log?.prayers[prayerName] ?? false;
}

export function useTodayCompletionRate(userId: string | null) {
  const { data: log } = useTodayPrayerLog(userId);
  
  if (!log) return 0;
  
  const completed = Object.values(log.prayers).filter(Boolean).length;
  const total = Object.keys(log.prayers).length;
  
  return Math.round((completed / total) * 100);
}