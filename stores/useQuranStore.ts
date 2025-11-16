/**
 * Quran Store
 * 
 * Client state for Quran bookmarks and recitation plan.
 * Surahs data is managed by TanStack Query in api/services/quran/
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName?: string;
  timestamp: number;
}

export interface RecitationPlan {
  startDate: string;
  endDate: string;
  targetAyahsPerDay: number;
  completedAyahKeys: string[]; // Format: "surahNumber:ayahNumber"
  lastReadAyah: string | null;
}

interface QuranState {
  // State
  bookmarks: Bookmark[];
  recitationPlan: RecitationPlan | null;
  
  // Bookmark actions
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (surahNumber: number, ayahNumber: number) => void;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  clearBookmarks: () => void;
  
  // Recitation plan actions
  setRecitationPlan: (plan: RecitationPlan) => void;
  updateRecitationProgress: (ayahKey: string) => void;
  clearRecitationPlan: () => void;
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
      
      // Bookmark actions
      addBookmark: (bookmark) => {
        console.log('📌 Adding Quran bookmark:', bookmark);
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            { ...bookmark, timestamp: Date.now() }
          ]
        }));
      },
      
      removeBookmark: (surahNumber, ayahNumber) => {
        console.log('🗑️ Removing Quran bookmark:', surahNumber, ayahNumber);
        set((state) => ({
          bookmarks: state.bookmarks.filter(
            (b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
          )
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
      
      // Recitation plan actions
      setRecitationPlan: (plan) => {
        console.log('📖 Setting recitation plan:', plan);
        set({ recitationPlan: plan });
      },
      
      updateRecitationProgress: (ayahKey) => {
        set((state) => {
          if (!state.recitationPlan) return state;
          
          const { completedAyahKeys } = state.recitationPlan;
          
          // Don't add duplicates
          if (completedAyahKeys.includes(ayahKey)) {
            return state;
          }
          
          console.log('✅ Updating recitation progress:', ayahKey);
          
          return {
            recitationPlan: {
              ...state.recitationPlan,
              completedAyahKeys: [...completedAyahKeys, ayahKey],
              lastReadAyah: ayahKey,
            }
          };
        });
      },
      
      clearRecitationPlan: () => {
        console.log('🗑️ Clearing recitation plan');
        set({ recitationPlan: null });
      },
    }),
    {
      name: 'quran',
      storage: createJSONStorage(() => ({
        getItem: (name) => defaultStorage.getString(name) ?? null,
        setItem: (name, value) => defaultStorage.setString(name, value),
        removeItem: (name) => defaultStorage.delete(name),
      })),
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useBookmarks = () => 
  useQuranStore((state) => state.bookmarks);

export const useIsBookmarked = (surahNumber: number, ayahNumber: number) => 
  useQuranStore((state) => state.isBookmarked(surahNumber, ayahNumber));

export const useRecitationPlan = () => 
  useQuranStore((state) => state.recitationPlan);

export const useRecitationProgress = () => {
  const plan = useRecitationPlan();
  
  if (!plan) return null;
  
  // Calculate total ayahs (6236 in Quran)
  const TOTAL_AYAHS = 6236;
  const completedCount = plan.completedAyahKeys.length;
  const progress = Math.round((completedCount / TOTAL_AYAHS) * 100);
  
  return {
    completedCount,
    totalCount: TOTAL_AYAHS,
    progress,
    lastReadAyah: plan.lastReadAyah,
  };
};