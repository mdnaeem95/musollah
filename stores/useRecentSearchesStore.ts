/**
 * Recent Searches Store (REFACTORED WITH STRUCTURED LOGGING)
 * 
 * Client state for search history with MMKV persistence.
 * 
 * @version 2.0
 * @refactored 2025-12-23
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';
import { createLogger } from '../services/logging/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('Recent Searches');

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
        
        if (!trimmedQuery) {
          logger.debug('Empty search query, skipping', { query });
          return;
        }
        
        set((state) => {
          // Check if already exists
          const alreadyExists = state.searches.includes(trimmedQuery);
          
          if (alreadyExists) {
            // Remove and re-add to front (make it most recent)
            logger.debug('Search already exists, moving to front', {
              query: trimmedQuery,
              previousPosition: state.searches.indexOf(trimmedQuery),
            });
          } else {
            logger.info('New search added', {
              query: trimmedQuery,
              totalSearches: Math.min(state.searches.length + 1, 3),
            });
          }
          
          // Remove if already exists, add to front, limit to 3
          const filtered = state.searches.filter(s => s !== trimmedQuery);
          const newSearches = [trimmedQuery, ...filtered].slice(0, 3);
          
          return { searches: newSearches };
        });
      },
      
      removeSearch: (query: string) => {
        const state = get();
        const exists = state.searches.includes(query);
        
        if (!exists) {
          logger.warn('Search not found, cannot remove', { query });
          return;
        }
        
        logger.info('Search removed', {
          query,
          totalSearches: state.searches.length - 1,
        });
        
        set((state) => ({
          searches: state.searches.filter(s => s !== query)
        }));
      },
      
      clearSearches: () => {
        const count = get().searches.length;
        
        logger.info('All searches cleared', {
          previousCount: count,
        });
        
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
      // Log store hydration
      onRehydrateStorage: () => {
        logger.debug('Hydrating search history from MMKV');
        
        return (state, error) => {
          if (error) {
            logger.error('Hydration failed', { error: error });
          } else if (state) {
            logger.success('Hydration complete', {
              searchCount: state.searches.length,
              searches: state.searches,
            });
          }
        };
      },
    }
  )
);