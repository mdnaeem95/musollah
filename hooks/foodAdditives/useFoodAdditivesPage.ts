/**
 * Food Additives Page Hook
 *
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Better error handling and debug info
 *
 * Manages the Food Additives (E-codes) database page:
 * - Search functionality
 * - Navigation to food scanner
 * - Filtered results display
 *
 * @version 2.0
 * @since 2025-12-24
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useFoodAdditives, searchFoodAdditives } from '../../api/services/foodAdditives';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Food Additives');

// ============================================================================
// HOOK
// ============================================================================

export function useFoodAdditivesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Food additives page mounted');
    
    return () => {
      logger.debug('Food additives page unmounted');
    };
  }, []);

  // Fetch food additives
  const { data: foodAdditives, isLoading, error } = useFoodAdditives();

  // ✅ Log data fetch results
  useEffect(() => {
    if (foodAdditives) {
      logger.success('Food additives loaded', {
        count: foodAdditives.length,
        categories: new Set(foodAdditives.map(a => a.category)).size,
      });
    }
    
    if (error) {
      logger.error('Failed to load food additives', error as Error);
    }
  }, [foodAdditives, error]);

  // Filter additives based on search query
  const filteredAdditives = useMemo(() => {
    if (!foodAdditives) {
      logger.debug('No food additives data available for filtering');
      return [];
    }
    
    logger.time('search-additives');
    const results = searchFoodAdditives(foodAdditives, searchQuery);
    logger.timeEnd('search-additives');
    
    if (searchQuery) {
      logger.debug('Search results', {
        query: searchQuery,
        results: results.length,
        total: foodAdditives.length,
      });
    }
    
    return results;
  }, [foodAdditives, searchQuery]);

  // ✅ Navigation handlers with logging
  const navigateToScanner = () => {
    logger.info('Navigating to food scanner');
    router.push('/(settings)/food-additives/foodScanner');
  };

  const handleSearchChange = (query: string) => {
    logger.debug('Search query changed', {
      previousQuery: searchQuery,
      newQuery: query,
      queryLength: query.length,
    });
    setSearchQuery(query);
  };

  // ✅ Clear search handler (useful for UI)
  const handleClearSearch = () => {
    logger.debug('Search cleared');
    setSearchQuery('');
  };

  return {
    // State
    searchQuery,
    foodAdditives: foodAdditives || [],
    filteredAdditives,
    isLoading,
    error,
    
    // ✅ Additional state for UI
    hasSearchQuery: searchQuery.length > 0,
    resultsCount: filteredAdditives.length,
    totalCount: foodAdditives?.length || 0,

    // Actions
    handleSearchChange,
    handleClearSearch,
    navigateToScanner,
  };
}