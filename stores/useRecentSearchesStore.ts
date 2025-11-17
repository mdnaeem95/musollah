/**
 * Recent Searches Store
 * 
 * Client state for search history with MMKV persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';

// ============================================================================
// TYPES
// ============================================================================

interface RecentSearchesState {
  searches: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set, get) => ({
      searches: [],
      
      addSearch: (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;
        
        console.log('🔍 Adding search:', trimmedQuery);
        
        set((state) => {
          // Remove if already exists, add to front, limit to 3
          const filtered = state.searches.filter(s => s !== trimmedQuery);
          return {
            searches: [trimmedQuery, ...filtered].slice(0, 3)
          };
        });
      },
      
      removeSearch: (query: string) => {
        console.log('🗑️ Removing search:', query);
        set((state) => ({
          searches: state.searches.filter(s => s !== query)
        }));
      },
      
      clearSearches: () => {
        console.log('🗑️ Clearing all searches');
        set({ searches: [] });
      },
    }),
    {
      name: 'recent-searches',
      storage: createJSONStorage(() => ({
        getItem: (name) => defaultStorage.getString(name) ?? null,
        setItem: (name, value) => defaultStorage.setString(name, value),
        removeItem: (name) => defaultStorage.delete(name),
      })),
    }
  )
);