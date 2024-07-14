import { configureStore } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';
import locationReducer from '../reducer/userLocationReducer';
import prayerTimesReducer from '../reducer/prayerTimesReducer';
import musollahReducer from '../reducer/musollahReducer';
import quranReducer from '../reducer/quranReducer'
import surahTextReducer from '../reducer/surahTextReducer'

const store = configureStore({
  reducer: {
    location: locationReducer,
    prayer: prayerTimesReducer,
    musollah: musollahReducer,
    quran: quranReducer,
    surahText: surahTextReducer,
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
