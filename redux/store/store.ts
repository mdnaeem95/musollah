import { configureStore } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';
import locationReducer from '../reducer/userLocationReducer';
import prayerReducer  from '../slices/prayerSlice';
import musollahReducer from '../reducer/musollahReducer';
import quranReducer from '../reducer/quranReducer'

const store = configureStore({
  reducer: {
    location: locationReducer,
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
