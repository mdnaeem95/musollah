/**
 * Location Favorites Store
 *
 * Client-only (MMKV) favourites for community-map locations — musollahs,
 * mosques, bidets. Keyed `${kind}:${id}`. Local so it works logged-out, like the
 * other preference stores.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultStorage } from '../api/client/storage';
import { createLogger } from '../services/logging/logger';

const logger = createLogger('Location Favorites');

export type FavoriteKind = 'musollah' | 'mosque' | 'bidet';

/** Stable key for a favourited location. */
export const favoriteKey = (kind: FavoriteKind, id: string) => `${kind}:${id}`;

interface LocationFavoritesState {
  favorites: string[]; // `${kind}:${id}`
  toggleFavorite: (kind: FavoriteKind, id: string) => void;
  isFavorite: (kind: FavoriteKind, id: string) => boolean;
}

export const useLocationFavoritesStore = create<LocationFavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      toggleFavorite: (kind, id) => {
        const key = favoriteKey(kind, id);
        set((state) => {
          const has = state.favorites.includes(key);
          logger.info(has ? 'Favorite removed' : 'Favorite added', { key });
          return {
            favorites: has
              ? state.favorites.filter((k) => k !== key)
              : [...state.favorites, key],
          };
        });
      },

      isFavorite: (kind, id) => get().favorites.includes(favoriteKey(kind, id)),
    }),
    {
      name: 'location-favorites',
      storage: createJSONStorage(() => ({
        getItem: (name) => defaultStorage.getString(name) ?? null,
        setItem: (name, value) => defaultStorage.setString(name, value),
        removeItem: (name) => defaultStorage.delete(name),
      })),
    }
  )
);

/** Reactive selector — re-renders when this location's favourite state changes. */
export const useIsFavorite = (kind: FavoriteKind, id: string) =>
  useLocationFavoritesStore((s) => s.favorites.includes(favoriteKey(kind, id)));
