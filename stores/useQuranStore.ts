/**
 * Quran Store
 * 
 * Manages Quran-related client state:
 * - Quran bookmarks
 * - Recitation plan
 * - Reading progress (general & daily)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface QuranBookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  timestamp: number;
}

export interface RecitationPlan {
  planType: 'ayahs' | 'surahs' | 'juz';
  daysToFinish: number;
  startDate: string; // ISO date
  completedAyahKeys: string[]; // Format: "surahNumber:ayahNumber"
  lastReadAyah: string;
}

interface QuranState {
  // State
  bookmarks: QuranBookmark[];
  recitationPlan: RecitationPlan | null;
  readAyahs: string[]; // Overall reading progress: "surahNumber:ayahNumber"
  readAyahsToday: string[]; // Daily progress (reset at midnight)
  lastListenedAyah: { surahNumber: number; ayahNumber: number } | null;
  
  // Bookmark Actions
  addBookmark: (bookmark: Omit<QuranBookmark, 'timestamp'>) => void;
  removeBookmark: (surahNumber: number, ayahNumber: number) => void;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  clearBookmarks: () => void;
  
  // Recitation Plan Actions
  setRecitationPlan: (plan: RecitationPlan) => void;
  clearRecitationPlan: () => void;
  updateRecitationProgress: (ayahKey: string) => void;
  isAyahCompleted: (ayahKey: string) => boolean;
  
  // Reading Progress Actions
  markAyahAsRead: (surahNumber: number, ayahNumber: number) => void;
  unmarkAyahAsRead: (surahNumber: number, ayahNumber: number) => void;
  isAyahRead: (surahNumber: number, ayahNumber: number) => boolean;
  getReadCountForSurah: (surahNumber: number) => number;
  clearReadAyahs: () => void;
  resetDailyProgress: () => void;
  
  // Last Listened Position
  setLastListenedAyah: (surahNumber: number, ayahNumber: number) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      // Initial state
      bookmarks: [],
      recitationPlan: null,
      readAyahs: [],
      readAyahsToday: [],
      lastListenedAyah: null,
      
      // Bookmark Actions
      addBookmark: (bookmark) => {
        console.log('📖 Adding Quran bookmark:', `${bookmark.surahNumber}:${bookmark.ayahNumber}`);
        set((state) => {
          // Prevent duplicates
          const exists = state.bookmarks.some(
            (b) => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber
          );
          if (exists) return state;
          
          return {
            bookmarks: [
              ...state.bookmarks,
              {
                ...bookmark,
                timestamp: Date.now(),
              },
            ],
          };
        });
      },
      
      removeBookmark: (surahNumber, ayahNumber) => {
        console.log('🗑️ Removing Quran bookmark:', `${surahNumber}:${ayahNumber}`);
        set((state) => ({
          bookmarks: state.bookmarks.filter(
            (b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
          ),
        }));
      },
      
      isBookmarked: (surahNumber, ayahNumber) => {
        return get().bookmarks.some(
          (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
        );
      },
      
      clearBookmarks: () => {
        console.log('🗑️ Clearing all Quran bookmarks');
        set({ bookmarks: [] });
      },
      
      // Recitation Plan Actions
      setRecitationPlan: (plan) => {
        console.log('📅 Setting recitation plan:', plan.planType, plan.daysToFinish, 'days');
        set({ recitationPlan: plan });
      },
      
      clearRecitationPlan: () => {
        console.log('🗑️ Clearing recitation plan');
        set({ recitationPlan: null });
      },
      
      updateRecitationProgress: (ayahKey) => {
        set((state) => {
          if (!state.recitationPlan) return state;
          
          // Prevent duplicates
          if (state.recitationPlan.completedAyahKeys.includes(ayahKey)) {
            return state;
          }
          
          console.log('✅ Marking ayah as completed in plan:', ayahKey);
          
          return {
            recitationPlan: {
              ...state.recitationPlan,
              completedAyahKeys: [...state.recitationPlan.completedAyahKeys, ayahKey],
            },
          };
        });
      },
      
      isAyahCompleted: (ayahKey) => {
        const plan = get().recitationPlan;
        return plan ? plan.completedAyahKeys.includes(ayahKey) : false;
      },
      
      // Reading Progress Actions
      markAyahAsRead: (surahNumber, ayahNumber) => {
        const ayahKey = `${surahNumber}:${ayahNumber}`;
        
        set((state) => {
          // Prevent duplicates
          const alreadyRead = state.readAyahs.includes(ayahKey);
          const alreadyReadToday = state.readAyahsToday.includes(ayahKey);
          
          if (alreadyRead && alreadyReadToday) return state;
          
          console.log('📗 Marking ayah as read:', ayahKey);
          
          return {
            readAyahs: alreadyRead ? state.readAyahs : [...state.readAyahs, ayahKey],
            readAyahsToday: alreadyReadToday ? state.readAyahsToday : [...state.readAyahsToday, ayahKey],
          };
        });
      },
      
      unmarkAyahAsRead: (surahNumber, ayahNumber) => {
        const ayahKey = `${surahNumber}:${ayahNumber}`;
        console.log('📕 Unmarking ayah as read:', ayahKey);
        
        set((state) => ({
          readAyahs: state.readAyahs.filter((key) => key !== ayahKey),
          readAyahsToday: state.readAyahsToday.filter((key) => key !== ayahKey),
        }));
      },
      
      isAyahRead: (surahNumber, ayahNumber) => {
        const ayahKey = `${surahNumber}:${ayahNumber}`;
        return get().readAyahs.includes(ayahKey);
      },
      
      getReadCountForSurah: (surahNumber) => {
        const state = get();
        return state.readAyahs.filter((key) => {
          const [s] = key.split(':');
          return parseInt(s, 10) === surahNumber;
        }).length;
      },
      
      clearReadAyahs: () => {
        console.log('🗑️ Clearing all read ayahs');
        set({ readAyahs: [], readAyahsToday: [] });
      },
      
      resetDailyProgress: () => {
        console.log('🔄 Resetting daily progress');
        set({ readAyahsToday: [] });
      },
      
      // Last Listened Position
      setLastListenedAyah: (surahNumber, ayahNumber) => {
        console.log('🎧 Setting last listened ayah:', `${surahNumber}:${ayahNumber}`);
        set({ lastListenedAyah: { surahNumber, ayahNumber } });
      },
    }),
    {
      name: 'quran', // Storage key
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = defaultStorage.getString(name);
          return value ?? null;
        },
        setItem: (name, value) => {
          defaultStorage.setString(name, value);
        },
        removeItem: (name) => {
          defaultStorage.delete(name);
        },
      })),
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Select only bookmarks
 */
export const useQuranBookmarks = () => useQuranStore((state) => state.bookmarks);

/**
 * Select only recitation plan
 */
export const useRecitationPlan = () => useQuranStore((state) => state.recitationPlan);

/**
 * Check if specific ayah is bookmarked
 */
export const useIsAyahBookmarked = (surahNumber: number, ayahNumber: number) =>
  useQuranStore((state) => state.isBookmarked(surahNumber, ayahNumber));

/**
 * Check if specific ayah is completed in recitation plan
 */
export const useIsAyahCompleted = (ayahKey: string) =>
  useQuranStore((state) => state.isAyahCompleted(ayahKey));

/**
 * Check if specific ayah is read
 */
export const useIsAyahRead = (surahNumber: number, ayahNumber: number) =>
  useQuranStore((state) => state.isAyahRead(surahNumber, ayahNumber));

/**
 * Get read count for specific surah
 */
export const useReadCountForSurah = (surahNumber: number) =>
  useQuranStore((state) => state.getReadCountForSurah(surahNumber));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format ayah key for storage
 */
export function formatAyahKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

/**
 * Parse ayah key back to numbers
 */
export function parseAyahKey(key: string): { surahNumber: number; ayahNumber: number } | null {
  const [surah, ayah] = key.split(':').map(Number);
  if (!surah || !ayah) return null;
  return { surahNumber: surah, ayahNumber: ayah };
}

/**
 * Calculate recitation plan progress
 */
export function calculateRecitationProgress(plan: RecitationPlan): {
  completed: number;
  expected: number;
  daysPassed: number;
  progressRatio: number;
} {
  const TOTAL_AYAHS = 6236;
  const TOTAL_SURAHS = 114;
  const TOTAL_JUZ = 30;

  const today = new Date();
  const startDate = new Date(plan.startDate);
  const daysPassed = Math.max(
    1,
    Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  let expected = 0;
  let total = 0;

  switch (plan.planType) {
    case 'ayahs':
      total = TOTAL_AYAHS;
      expected = (TOTAL_AYAHS / plan.daysToFinish) * daysPassed;
      break;
    case 'surahs':
      total = TOTAL_SURAHS;
      expected = (TOTAL_SURAHS / plan.daysToFinish) * daysPassed;
      break;
    case 'juz':
      total = TOTAL_JUZ;
      expected = (TOTAL_JUZ / plan.daysToFinish) * daysPassed;
      break;
  }

  expected = Math.ceil(expected);
  const completed = plan.completedAyahKeys.length;
  const progressRatio = Math.min(completed / expected, 1);

  return {
    completed,
    expected,
    daysPassed,
    progressRatio,
  };
}

/**
 * Calculate daily target for recitation plan
 */
export function calculateDailyTarget(plan: RecitationPlan): number {
  const TOTAL_AYAHS = 6236;
  const TOTAL_SURAHS = 114;
  const TOTAL_JUZ = 30;

  switch (plan.planType) {
    case 'ayahs':
      return Math.ceil(TOTAL_AYAHS / plan.daysToFinish);
    case 'surahs':
      return Math.ceil(TOTAL_SURAHS / plan.daysToFinish);
    case 'juz':
      return TOTAL_JUZ / plan.daysToFinish;
    default:
      return 0;
  }
}