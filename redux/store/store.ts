import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userLocationReducer from '../slices/userLocationSlice';
import prayerReducer from '../slices/prayerSlice';
import musollahReducer from '../slices/musollahSlice';
import quranReducer from '../slices/quranSlice';
import userReducer from '../slices/userSlice';
import dashboardReducer from '../slices/dashboardSlice';
import courseReducer from '../slices/courseSlice';
import doasReducer from '../slices/doasSlice'
import answersReducer from '../slices/answerSlice'
import questionsReducer from '../slices/questionSlice'
import userPreferencesReducer from '../slices/userPreferencesSlice';
import gamificationReducer from '../slices/gamificationSlice';
import articleReducer from '../slices/articlesSlice'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer, persistStore, FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'; // For deep merging

// Define RootState type based on your reducers
const rootReducer = combineReducers({
  userPreferences: userPreferencesReducer,
  location: userLocationReducer,
  prayer: prayerReducer,
  musollah: musollahReducer,
  quran: quranReducer,
  user: userReducer,
  dashboard: dashboardReducer,
  course: courseReducer,
  doas: doasReducer,
  answers: answersReducer,
  questions: questionsReducer,
  gamification: gamificationReducer,
  articles: articleReducer
});

// Define RootState type using ReturnType
export type RootState = ReturnType<typeof rootReducer>;

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
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
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Persistor for rehydrating the state
const persistor = persistStore(store);

// Export types for use throughout the app
export type AppDispatch = typeof store.dispatch;
export { store, persistor };
