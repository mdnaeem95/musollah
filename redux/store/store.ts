import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userLocationReducer from '../slices/userLocationSlice';
import prayerReducer  from '../slices/prayerSlice';
import musollahReducer from '../slices/musollahSlice';
import quranReducer from '../slices/quranSlice'
import userReducer from '../slices/userSlice'
import dashboardReducer from '../slices/dashboardSlice';
import courseReducer from '../slices/courseSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';

// Configuration for redux-persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage
}

// Combining all reducers
const rootReducer = combineReducers({
  location: userLocationReducer,
  prayer: prayerReducer,
  musollah: musollahReducer,
  quran: quranReducer,
  user: userReducer,
  dashboard: dashboardReducer,
  course: courseReducer,
})

// Wrap root reducer with persistreducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] 
    }
  })
});

const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { store, persistor };
