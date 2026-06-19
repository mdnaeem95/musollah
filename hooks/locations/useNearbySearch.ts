/**
 * useNearbySearch
 *
 * Unified search across every Nearby layer — halal restaurants plus community
 * musollahs, mosques and bidets — backed by the shared recent-searches store.
 * Returns a flat, type-tagged result list the search screen renders with a
 * per-kind badge.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRestaurants } from '../../api/services/food';
import { useMusollahData } from '../../api/services/musollah';
import { useLocationStore } from '../../stores/useLocationStore';
import { useRecentSearchesStore } from '../../stores/useRecentSearchesStore';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Nearby Search');

const DEBOUNCE_MS = 250;
// Per-kind result cap so a broad query can't render thousands of rows.
const PER_KIND_CAP = 25;

export type NearbyResultKind = 'food' | 'musollah' | 'mosque' | 'bidet';

export interface NearbySearchResult {
  kind: NearbyResultKind;
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  halal?: boolean;
  categories?: string[];
}

const includesQ = (value: string | undefined, q: string): boolean =>
  !!value && value.toLowerCase().includes(q);

export function useNearbySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const {
    searches: recentSearches,
    addSearch,
    removeSearch,
  } = useRecentSearchesStore();

  const userLocation = useLocationStore((s) => s.userLocation);
  const { data: restaurants = [] } = useRestaurants();
  const { data: musollahData } = useMusollahData(userLocation);

  // Debounce the raw input.
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const results = useMemo<NearbySearchResult[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const out: NearbySearchResult[] = [];

    // Food
    const foodMatches: NearbySearchResult[] = [];
    for (const r of restaurants) {
      if (
        includesQ(r.name, q) ||
        includesQ(r.address, q) ||
        r.categories?.some((c) => includesQ(c, q))
      ) {
        foodMatches.push({
          kind: 'food',
          id: r.id,
          title: r.name,
          subtitle: r.address || '',
          image: r.image,
          halal: r.halal,
          categories: r.categories,
        });
        if (foodMatches.length >= PER_KIND_CAP) break;
      }
    }
    out.push(...foodMatches);

    // Facilities (musollah / mosque / bidet)
    const pushFacilities = (
      list: { id: string; building: string; address: string }[] | undefined,
      kind: NearbyResultKind
    ) => {
      if (!list) return;
      let count = 0;
      for (const loc of list) {
        if (includesQ(loc.building, q) || includesQ(loc.address, q)) {
          out.push({
            kind,
            id: loc.id,
            title: loc.building || 'Unknown',
            subtitle: loc.address || '',
          });
          if (++count >= PER_KIND_CAP) break;
        }
      }
    };

    pushFacilities(musollahData?.musollahLocations, 'musollah');
    pushFacilities(musollahData?.mosqueLocations, 'mosque');
    pushFacilities(musollahData?.bidetLocations, 'bidet');

    logger.debug('Unified search computed', { query: q, results: out.length });
    return out;
  }, [debouncedQuery, restaurants, musollahData]);

  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (trimmed) addSearch(trimmed);
  }, [searchQuery, addSearch]);

  const handleRecentSearchTap = useCallback((q: string) => setSearchQuery(q), []);

  const handleRemoveSearch = useCallback(
    (q: string) => removeSearch(q),
    [removeSearch]
  );

  return {
    searchQuery,
    results,
    recentSearches,
    isSearching: debouncedQuery.trim() !== '',
    handleSearchChange,
    handleSearchSubmit,
    handleRecentSearchTap,
    handleRemoveSearch,
  };
}
