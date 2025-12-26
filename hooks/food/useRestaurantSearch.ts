/**
 * Restaurant Search Hook
 *
 * ✅ REFACTORED: Using structured logging system
 * ✅ IMPROVED: Debounce tracking, search analytics, performance monitoring
 *
 * Business logic for restaurant search page:
 * - Real-time search with debouncing
 * - Recent search history management
 * - Search result filtering
 * - Performance tracking
 *
 * @version 3.0
 * @since 2025-12-24
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRestaurants, searchRestaurants } from '../../api/services/food';
import { useRecentSearchesStore } from '../../stores/useRecentSearchesStore';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Restaurant Search');

// ============================================================================
// CONSTANTS
// ============================================================================

const DEBOUNCE_DELAY_MS = 300;

// ============================================================================
// HOOK
// ============================================================================

export function useRestaurantSearch() {
  logger.time('search-init');
  logger.debug('Initializing restaurant search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Recent searches from Zustand store
  const {
    searches: recentSearches,
    addSearch,
    removeSearch,
  } = useRecentSearchesStore();
  
  // All restaurants data
  const { data: restaurants = [], isLoading } = useRestaurants();
  
  // Log initial state
  useEffect(() => {
    if (restaurants.length > 0) {
      logger.info('Search initialized', {
        totalRestaurants: restaurants.length,
        recentSearchesCount: recentSearches.length,
        recentSearches,
      });
      logger.timeEnd('search-init');
    }
  }, [restaurants.length, recentSearches]);
  
  // Debounce search input
  useEffect(() => {
    logger.debug('Search query changed', {
      query: searchQuery,
      queryLength: searchQuery.length,
      willDebounce: true,
      debounceDelay: DEBOUNCE_DELAY_MS,
    });

    const handler = setTimeout(() => {
      logger.debug('Debounce complete, applying search', {
        originalQuery: searchQuery,
        debouncedQuery: searchQuery,
      });
      setDebouncedQuery(searchQuery);
    }, DEBOUNCE_DELAY_MS);
    
    return () => {
      clearTimeout(handler);
      logger.debug('Debounce timer cleared', { query: searchQuery });
    };
  }, [searchQuery]);
  
  // Filtered restaurants based on debounced search
  const filteredRestaurants = useMemo(() => {
    logger.time('filter-search-results');
    
    if (!debouncedQuery.trim()) {
      logger.debug('Empty search query, showing all restaurants', {
        totalRestaurants: restaurants.length,
      });
      logger.timeEnd('filter-search-results');
      return restaurants;
    }
    
    logger.debug('Filtering restaurants', {
      query: debouncedQuery,
      queryLength: debouncedQuery.length,
      totalRestaurants: restaurants.length,
    });
    
    const filtered = searchRestaurants(restaurants, debouncedQuery);
    
    // Calculate search effectiveness
    const matchPercentage = restaurants.length > 0
      ? ((filtered.length / restaurants.length) * 100).toFixed(1)
      : '0';
    
    logger.success('Search results filtered', {
      query: debouncedQuery,
      totalRestaurants: restaurants.length,
      matchedCount: filtered.length,
      matchPercentage: matchPercentage + '%',
      hasResults: filtered.length > 0,
    });
    logger.timeEnd('filter-search-results');
    
    return filtered;
  }, [restaurants, debouncedQuery]);
  
  // Handle search query change (immediate update)
  const handleSearchChange = useCallback((query: string) => {
    logger.debug('Search input changed', {
      previousQuery: searchQuery,
      newQuery: query,
      lengthChange: query.length - searchQuery.length,
    });
    
    setSearchQuery(query);
  }, [searchQuery]);
  
  // Handle search submit (save to history)
  const handleSearchSubmit = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      logger.debug('Search submit ignored, empty query');
      return;
    }
    
    // Check if already in recent searches
    const isDuplicate = recentSearches.includes(trimmedQuery);
    
    logger.info('Search submitted', {
      query: trimmedQuery,
      queryLength: trimmedQuery.length,
      isDuplicate,
      currentHistorySize: recentSearches.length,
    });
    
    if (isDuplicate) {
      logger.debug('Search already in history, moving to front');
    }
    
    addSearch(trimmedQuery);
    
    logger.success('Search saved to history', {
      query: trimmedQuery,
      newHistorySize: recentSearches.length + (isDuplicate ? 0 : 1),
    });
  }, [searchQuery, recentSearches, addSearch]);
  
  // Handle recent search tap (auto-populate search)
  const handleRecentSearchTap = useCallback((query: string) => {
    logger.info('Recent search selected', {
      query,
      previousQuery: searchQuery,
    });
    
    setSearchQuery(query);
    
    logger.debug('Search query updated from history', {
      newQuery: query,
    });
  }, [searchQuery]);
  
  // Handle remove recent search
  const handleRemoveSearch = useCallback((query: string) => {
    logger.info('Removing search from history', {
      query,
      currentHistorySize: recentSearches.length,
    });
    
    removeSearch(query);
    
    logger.success('Search removed from history', {
      removedQuery: query,
      newHistorySize: recentSearches.length - 1,
      remainingSearches: recentSearches.filter(s => s !== query),
    });
  }, [recentSearches, removeSearch]);
  
  return {
    // State
    searchQuery,
    filteredRestaurants,
    recentSearches,
    isLoading,
    
    // Computed
    hasResults: filteredRestaurants.length > 0,
    isSearching: debouncedQuery.trim() !== '',
    
    // Actions
    handleSearchChange,
    handleSearchSubmit,
    handleRecentSearchTap,
    handleRemoveSearch,
  };
}