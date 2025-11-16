/**
 * Dua Bookmarks Store
 * Client state for dua bookmarks
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface DoaBookmark {
  doaId: string;
  doaTitle: string;
  timestamp: number;
}

interface DoaBookmarksState {
  bookmarks: DoaBookmark[];
  addBookmark: (doaId: string, doaTitle: string) => void;
  removeBookmark: (doaId: string) => void;
  isBookmarked: (doaId: string) => boolean;
  clearBookmarks: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useDoaBookmarksStore = create<DoaBookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      
      addBookmark: (doaId, doaTitle) => {
        console.log('📌 Adding dua bookmark:', doaTitle);
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            { doaId, doaTitle, timestamp: Date.now() }
          ]
        }));
      },
      
      removeBookmark: (doaId) => {
        console.log('🗑️ Removing dua bookmark:', doaId);
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.doaId !== doaId)
        }));
      },
      
      isBookmarked: (doaId) => {
        return get().bookmarks.some((b) => b.doaId === doaId);
      },
      
      clearBookmarks: () => {
        console.log('🗑️ Clearing all dua bookmarks');
        set({ bookmarks: [] });
      },
    }),
    {
      name: 'doa-bookmarks',
      storage: createJSONStorage(() => ({
        getItem: (name) => defaultStorage.getString(name) ?? null,
        setItem: (name, value) => defaultStorage.setString(name, value),
        removeItem: (name) => defaultStorage.delete(name),
      })),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useIsDoaBookmarked = (doaId: string) => 
  useDoaBookmarksStore((state) => state.isBookmarked(doaId));

export const useDoaBookmarkCount = () => 
  useDoaBookmarksStore((state) => state.bookmarks.length);