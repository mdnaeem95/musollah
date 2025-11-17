/**
 * Restaurant Search Hook
 * 
 * Business logic for restaurant search page.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRestaurants, searchRestaurants } from '../../api/services/food';
import { useRecentSearchesStore } from '../../stores/useRecentSearchesStore';

export function useRestaurantSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Recent searches from Zustand store
  const {
    searches: recentSearches,
    addSearch,
    removeSearch,
  } = useRecentSearchesStore();
  
  // All restaurants
  const { data: restaurants = [], isLoading } = useRestaurants();
  
  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  // Filtered restaurants based on search
  const filteredRestaurants = useMemo(() => {
    return searchRestaurants(restaurants, debouncedQuery);
  }, [restaurants, debouncedQuery]);
  
  // Handle search query change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  // Handle search submit
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      addSearch(searchQuery.trim());
    }
  }, [searchQuery, addSearch]);
  
  // Handle recent search tap
  const handleRecentSearchTap = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  // Handle remove recent search
  const handleRemoveSearch = useCallback((query: string) => {
    removeSearch(query);
  }, [removeSearch]);
  
  return {
    // State
    searchQuery,
    filteredRestaurants,
    recentSearches,
    isLoading,
    
    // Actions
    handleSearchChange,
    handleSearchSubmit,
    handleRecentSearchTap,
    handleRemoveSearch,
  };
}