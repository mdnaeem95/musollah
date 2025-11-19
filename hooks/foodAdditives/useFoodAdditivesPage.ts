import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useFoodAdditives, searchFoodAdditives } from '../../api/services/foodAdditives';

export function useFoodAdditivesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch food additives
  const { data: foodAdditives, isLoading, error } = useFoodAdditives();

  // Filter additives based on search query
  const filteredAdditives = useMemo(() => {
    if (!foodAdditives) return [];
    return searchFoodAdditives(foodAdditives, searchQuery);
  }, [foodAdditives, searchQuery]);

  // Navigation handlers
  const navigateToScanner = () => {
    router.push('/(settings)/food-additives/foodScanner');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return {
    // State
    searchQuery,
    foodAdditives: foodAdditives || [],
    filteredAdditives,
    isLoading,
    error,

    // Actions
    handleSearchChange,
    navigateToScanner,
  };
}