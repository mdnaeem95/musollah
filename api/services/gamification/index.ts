import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import firestore from '@react-native-firebase/firestore';
import { cache, TTL } from '../../client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface PrayerStreak {
  current: number;
  highest: number;
  lastLoggedDate: string;
}

export interface GamificationData {
  prayerStreak: PrayerStreak;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchGamificationData(userId: string): Promise<GamificationData> {
  const gamificationDoc = await firestore()
    .collection('users')
    .doc(userId)
    .get();
  
  const data = gamificationDoc.data();
  
  if (!data?.gamification) {
    throw new Error('Gamification data not found');
  }

  return data.gamification;
}

async function updatePrayerStreak(
  userId: string, 
  streak: PrayerStreak
): Promise<PrayerStreak> {
  await firestore()
    .collection('users')
    .doc(userId)
    .update({
      'gamification.prayerStreak': streak
    });

  return streak;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const GAMIFICATION_QUERY_KEYS = {
  all: ['gamification'] as const,
  user: (userId: string) => ['gamification', userId] as const,
  streak: (userId: string) => ['gamification', userId, 'streak'] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

export function useGamificationData(userId: string | null) {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.user(userId!),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');

      const cacheKey = `gamification-${userId}`;
      const cached = cache.get<GamificationData>(cacheKey);
      
      if (cached) {
        console.log('⚡ Using cached gamification data');
        return cached;
      }

      console.log('🌐 Fetching gamification data from Firestore');
      const data = await fetchGamificationData(userId);
      
      cache.set(cacheKey, data, TTL.FIVE_MINUTES);
      return data;
    },
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.FIFTEEN_MINUTES,
    enabled: !!userId,
  });
}

export function useUpdatePrayerStreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      userId, 
      streak 
    }: { 
      userId: string; 
      streak: PrayerStreak;
    }) => updatePrayerStreak(userId, streak),
    
    onMutate: async ({ userId, streak }) => {
      await queryClient.cancelQueries({
        queryKey: GAMIFICATION_QUERY_KEYS.user(userId),
      });

      const previous = queryClient.getQueryData(
        GAMIFICATION_QUERY_KEYS.user(userId)
      );

      queryClient.setQueryData(
        GAMIFICATION_QUERY_KEYS.user(userId),
        (old: GamificationData | undefined) => {
          if (!old) return { prayerStreak: streak };
          return { ...old, prayerStreak: streak };
        }
      );

      return { previous };
    },
    
    onError: (err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          GAMIFICATION_QUERY_KEYS.user(userId),
          context.previous
        );
      }
    },
    
    onSuccess: (data, { userId }) => {
      console.log('✅ Prayer streak updated');
      
      // Update cache
      const cacheKey = `gamification-${userId}`;
      const currentData = cache.get<GamificationData>(cacheKey);
      if (currentData) {
        cache.set(cacheKey, {
          ...currentData,
          prayerStreak: data
        }, TTL.FIVE_MINUTES);
      }
    },
  });
}

export function usePrayerStreak(userId: string | null) {
  const { data } = useGamificationData(userId);
  return data?.prayerStreak ?? null;
}