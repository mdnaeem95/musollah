/**
 * Dua Bookmarks Store
 * 
 * ✅ REFACTORED: Using structured logging system
 * ✅ IMPROVED: Better duplicate handling, metadata tracking
 * 
 * Client state for dua bookmarks with MMKV persistence.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';

// ✅ Import structured logging
import { createLogger } from '../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Dua Bookmarks');

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
      
      // =======================================================================
      // Add Bookmark
      // =======================================================================
      addBookmark: (doaId, doaTitle) => {
        // Check for duplicates
        const exists = get().bookmarks.some((b) => b.doaId === doaId);
        
        if (exists) {
          logger.debug('Bookmark already exists, skipping', { 
            doaId,
            doaTitle,
          });
          return;
        }
        
        logger.info('Adding dua bookmark', { 
          doaId,
          doaTitle,
        });
        
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            { doaId, doaTitle, timestamp: Date.now() }
          ]
        }));
        
        const newCount = get().bookmarks.length;
        logger.success('Bookmark added', { 
          doaId,
          totalBookmarks: newCount,
        });
      },
      
      // =======================================================================
      // Remove Bookmark
      // =======================================================================
      removeBookmark: (doaId) => {
        const bookmark = get().bookmarks.find((b) => b.doaId === doaId);
        
        if (!bookmark) {
          logger.debug('Bookmark not found, skipping removal', { doaId });
          return;
        }
        
        logger.info('Removing dua bookmark', { 
          doaId,
          doaTitle: bookmark.doaTitle,
        });
        
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.doaId !== doaId)
        }));
        
        const newCount = get().bookmarks.length;
        logger.success('Bookmark removed', { 
          doaId,
          totalBookmarks: newCount,
        });
      },
      
      // =======================================================================
      // Check if Bookmarked
      // =======================================================================
      isBookmarked: (doaId) => {
        return get().bookmarks.some((b) => b.doaId === doaId);
      },
      
      // =======================================================================
      // Clear All Bookmarks
      // =======================================================================
      clearBookmarks: () => {
        const count = get().bookmarks.length;
        
        logger.info('Clearing all dua bookmarks', { 
          count,
        });
        
        set({ bookmarks: [] });
        
        logger.success('All bookmarks cleared', { 
          previousCount: count,
        });
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

/**
 * Check if specific dua is bookmarked
 */
export const useIsDoaBookmarked = (doaId: string) => 
  useDoaBookmarksStore((state) => state.isBookmarked(doaId));

/**
 * Get total bookmark count
 */
export const useDoaBookmarkCount = () => 
  useDoaBookmarksStore((state) => state.bookmarks.length);