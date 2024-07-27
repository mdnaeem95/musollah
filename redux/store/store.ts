import { configureStore } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';
import userLocationReducer from '../slices/userLocationSlice';
import prayerReducer  from '../slices/prayerSlice';
import musollahReducer from '../slices/musollahSlice';
import quranReducer from '../slices/quranSlice'

const store = configureStore({
  reducer: {
    location: userLocationReducer,
    prayer: prayerReducer,
    musollah: musollahReducer,
    quran: quranReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(
    { immutableCheck: false, 
      serializableCheck: false,
    }
  ).concat(thunk),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
