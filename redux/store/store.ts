import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userLocationReducer from '../slices/userLocationSlice';
import prayerReducer from '../slices/prayerSlice';
import musollahReducer from '../slices/musollahSlice';
import quranReducer from '../slices/quranSlice';
import userReducer from '../slices/userSlice';
import doasReducer from '../slices/doasSlice'
import userPreferencesReducer from '../slices/userPreferencesSlice';
import gamificationReducer from '../slices/gamificationSlice';
import { persistReducer, persistStore, FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'; // For deep merging
import { MMKVStorage } from '../../utils/storage';

// Define RootState type based on your reducers
const rootReducer = combineReducers({
  userPreferences: userPreferencesReducer,
  location: userLocationReducer,
  prayer: prayerReducer,
  musollah: musollahReducer,
  quran: quranReducer,
  user: userReducer,
  doas: doasReducer,
  gamification: gamificationReducer,
});

// Define RootState type using ReturnType
export type RootState = ReturnType<typeof rootReducer>;

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage: MMKVStorage,
  stateReconciler: autoMergeLevel2, // Ensures deep merging
  whitelist: ['userPreferences', 'user'],  // Only persist certain reducers
};

// Apply persistReducer with correct types
const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

// Configure the store with the persisted reducer and correct types
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, 'events/fetchEvents/fulfilled'],
        ignoredPaths: ['events.events.coordinates'],
      },
    }),
});

// Persistor for rehydrating the state
const persistor = persistStore(store);

// Export types for use throughout the app
export type AppDispatch = typeof store.dispatch;
export { store, persistor };
