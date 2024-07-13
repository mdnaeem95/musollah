import { configureStore } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';
import locationReducer from '../reducer/userLocationReducer';
import prayerTimesReducer from '../reducer/prayerTimesReducer';
import musollahReducer from '../reducer/musollahReducer';
import quranReducer from '../reducer/quranReducer'

const store = configureStore({
  reducer: {
    location: locationReducer,
    prayer: prayerTimesReducer,
    musollah: musollahReducer,
    quran: quranReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(
    { immutableCheck: {warnAfter: 500}, 
      serializableCheck: {warnAfter: 500},
    }
  ).concat(thunk),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
